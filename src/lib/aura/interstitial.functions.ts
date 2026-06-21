import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * SERVER-CONTROLLED INTERSTITIAL FREQUENCY
 *
 * Truth source for "should this user see an interstitial right now?" lives
 * here, not in localStorage. Client can still spam trigger() — server returns
 * `show:false` until cooldown/daily-cap clears. Recording is also server-side
 * (service_role insert into interstitial_ad_log), so a client that fakes
 * `recordInterstitialShown` calls cannot inflate or hide its own counters.
 *
 * Rules:
 *   - Premium / Plus / active trial → never show (`reason: "premium"`).
 *   - Minimum cooldown between any two interstitials → COOLDOWN_MS.
 *   - Daily cap → MAX_PER_DAY (rolling 24h).
 *   - First-session grace handled client-side (UX only).
 */

const COOLDOWN_MS = 10 * 60 * 1000; // 10 min hard floor
const SAME_PLACEMENT_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_PER_DAY = 10; // sits in user-requested 8–12 band
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;

async function isUnlimitedTier(supabase: any, userId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: trial }, { data: grant }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", userId).maybeSingle(),
    supabase
      .from("aura_plus_trials")
      .select("ends_at")
      .eq("user_id", userId)
      .gt("ends_at", nowIso)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("premium_grants")
      .select("ends_at")
      .eq("user_id", userId)
      .gt("ends_at", nowIso)
      .limit(1)
      .maybeSingle(),
  ]);
  const tier = ((profile?.tier as string | null) ?? "free").toLowerCase();
  if (tier === "premium" || tier === "plus" || tier === "aura+") return true;
  return !!trial || !!grant;
}

export type ShouldShowInterstitialResult =
  | { show: true; secondsUntilNext: number }
  | {
      show: false;
      reason: "premium" | "cooldown" | "daily_cap" | "same_placement_cooldown" | "error";
      retryAfterMs?: number;
    };

const PlacementSchema = z.object({ placement: z.string().min(1).max(64) });

export const shouldShowInterstitial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlacementSchema.parse(d))
  .handler(async ({ data, context }): Promise<ShouldShowInterstitialResult> => {
    try {
      if (await isUnlimitedTier(context.supabase, context.userId)) {
        return { show: false, reason: "premium" };
      }

      const sinceIso = new Date(Date.now() - ROLLING_WINDOW_MS).toISOString();
      const { data: recent } = await context.supabase
        .from("interstitial_ad_log")
        .select("placement, shown_at")
        .eq("user_id", context.userId)
        .gte("shown_at", sinceIso)
        .order("shown_at", { ascending: false });

      const rows = (recent ?? []) as Array<{ placement: string; shown_at: string }>;
      if (rows.length >= MAX_PER_DAY) {
        const oldest = rows[rows.length - 1];
        const retryAfterMs = Math.max(
          0,
          new Date(oldest.shown_at).getTime() + ROLLING_WINDOW_MS - Date.now(),
        );
        return { show: false, reason: "daily_cap", retryAfterMs };
      }

      if (rows.length > 0) {
        const lastMs = new Date(rows[0].shown_at).getTime();
        const sinceLast = Date.now() - lastMs;
        if (sinceLast < COOLDOWN_MS) {
          return { show: false, reason: "cooldown", retryAfterMs: COOLDOWN_MS - sinceLast };
        }
        const lastSamePlacement = rows.find((r) => r.placement === data.placement);
        if (lastSamePlacement) {
          const sinceSame = Date.now() - new Date(lastSamePlacement.shown_at).getTime();
          if (sinceSame < SAME_PLACEMENT_COOLDOWN_MS) {
            return {
              show: false,
              reason: "same_placement_cooldown",
              retryAfterMs: SAME_PLACEMENT_COOLDOWN_MS - sinceSame,
            };
          }
        }
      }

      return { show: true, secondsUntilNext: Math.floor(COOLDOWN_MS / 1000) };
    } catch {
      return { show: false, reason: "error" };
    }
  });

export const recordInterstitialShown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlacementSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    // Re-check premium so a client that ignored a `premium` response cannot
    // pollute the log.
    if (await isUnlimitedTier(context.supabase, context.userId)) return { ok: false };

    // Re-check cooldown to defeat replay (two trigger() calls racing past the
    // shouldShow check). If we'd violate it, drop silently.
    const { data: last } = await context.supabase
      .from("interstitial_ad_log")
      .select("shown_at")
      .eq("user_id", context.userId)
      .order("shown_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && Date.now() - new Date(last.shown_at).getTime() < COOLDOWN_MS) {
      return { ok: false };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("interstitial_ad_log")
      .insert({ user_id: context.userId, placement: data.placement });
    return { ok: !error };
  });

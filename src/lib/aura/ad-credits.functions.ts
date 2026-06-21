import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Unified ad-reward credits.
 *
 * Free tier: must spend 1 credit per ritual (tarot / coffee / mystic).
 *            Credits earned only by watching a rewarded ad — recorded
 *            server-side via grantAdCredit.
 * Plus / Premium / active trial: bypassed entirely. Whisper is always free.
 *
 * The credit balance is the sum of `delta` in ad_credits_ledger; only
 * service_role can insert rows, so client-side manipulation is impossible.
 */

export type AdSource = "tarot" | "coffee" | "mystic";

const SourceEnum = z.enum(["tarot", "coffee", "mystic"]);

const MIN_AD_DURATION_MS = 4000; // anti-fraud: must match client countdown
const MIN_INTERVAL_MS = 3000; // between grants (any source)

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

async function readBalance(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from("ad_credits_ledger")
    .select("delta")
    .eq("user_id", userId);
  const rows = (data ?? []) as Array<{ delta: number }>;
  return rows.reduce((s, r) => s + (r.delta || 0), 0);
}

/**
 * Public-facing balance fetch. Returns Infinity-style for premium users via
 * the `unlimited` flag so the UI can hide ad CTAs.
 */
export const getAdCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ balance: number; unlimited: boolean }> => {
    const unlimited = await isUnlimitedTier(context.supabase, context.userId);
    if (unlimited) return { balance: 0, unlimited: true };
    const balance = await readBalance(context.supabase, context.userId);
    return { balance: Math.max(0, balance), unlimited: false };
  });

export type GrantAdCreditResult =
  | { ok: true; balance: number }
  | { ok: false; reason: "unlimited" | "too_soon" | "invalid" | "error"; balance?: number };

/**
 * Server-side reward callback. The client calls this only AFTER the rewarded
 * ad SDK fires onRewarded. We rate-limit by checking the last grant timestamp
 * to defeat trivial replay (calling this in a loop).
 */
export const grantAdCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ source: SourceEnum, adDurationMs: z.number().int().min(0).max(120_000) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<GrantAdCreditResult> => {
    if (data.adDurationMs < MIN_AD_DURATION_MS) return { ok: false, reason: "invalid" };

    const unlimited = await isUnlimitedTier(context.supabase, context.userId);
    if (unlimited) return { ok: false, reason: "unlimited" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Anti-replay: any grant within MIN_INTERVAL_MS is rejected.
    const sinceIso = new Date(Date.now() - MIN_INTERVAL_MS).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("ad_credits_ledger")
      .select("id")
      .eq("user_id", context.userId)
      .gt("delta", 0)
      .gte("created_at", sinceIso)
      .limit(1)
      .maybeSingle();
    if (recent) {
      const balance = await readBalance(supabaseAdmin, context.userId);
      return { ok: false, reason: "too_soon", balance };
    }

    const reason = data.source === "tarot" ? "ad_tarot" : data.source === "coffee" ? "ad_coffee" : "ad_mystic";
    const { error } = await supabaseAdmin
      .from("ad_credits_ledger")
      .insert({ user_id: context.userId, delta: 1, reason });
    if (error) return { ok: false, reason: "error" };

    const balance = await readBalance(supabaseAdmin, context.userId);
    return { ok: true, balance };
  });

/**
 * Internal helper used by ritual handlers (tarot/coffee/mystic) to consume
 * exactly one credit. Returns true on success, false if the user has none.
 * Premium / plus / trial users always succeed without deducting.
 *
 * NOT exposed as a server fn — calling code must already have verified the
 * caller via requireSupabaseAuth and own its own admin import.
 */
export async function hasAdCreditServer(
  supabase: any,
  userId: string,
): Promise<{ unlimited: boolean; balance: number }> {
  if (await isUnlimitedTier(supabase, userId)) return { unlimited: true, balance: 0 };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const balance = await readBalance(supabaseAdmin, userId);
  return { unlimited: false, balance };
}

export async function consumeAdCreditServer(
  supabase: any,
  userId: string,
  source: AdSource,
): Promise<{ ok: true; bypassed: boolean } | { ok: false; reason: "ad_required" }> {
  if (await isUnlimitedTier(supabase, userId)) return { ok: true, bypassed: true };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const balance = await readBalance(supabaseAdmin, userId);
  if (balance <= 0) return { ok: false, reason: "ad_required" };

  const reason = source === "tarot" ? "spend_tarot" : source === "coffee" ? "spend_coffee" : "spend_mystic";
  const { error } = await supabaseAdmin
    .from("ad_credits_ledger")
    .insert({ user_id: userId, delta: -1, reason });
  if (error) return { ok: false, reason: "ad_required" };
  return { ok: true, bypassed: false };
}

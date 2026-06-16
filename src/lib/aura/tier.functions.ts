import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UserTier = "free" | "plus" | "premium";

/**
 * Resolves the user's effective tier:
 *   - reads profiles.tier
 *   - normalizes "aura+" -> "plus"
 *   - if a free user has an active aura_plus_trials row, upgrades to "plus"
 *   - if an active premium_grants row exists, uses the grant tier when it is
 *     higher than the profile tier
 *
 * Centralized so every feature (tarot, kahve, mistik, stylist) sees the
 * same tier and trial/grant rules instead of duplicating logic.
 */
export const getUserTier = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tier: UserTier; trialEndsAt: string | null }> => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();

    const [profileRes, trialRes, grantRes] = await Promise.all([
      supabase.from("profiles").select("tier").eq("id", userId).maybeSingle(),
      supabase
        .from("aura_plus_trials")
        .select("ends_at")
        .eq("user_id", userId)
        .gt("ends_at", nowIso)
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("premium_grants")
        .select("tier, ends_at")
        .eq("user_id", userId)
        .gt("ends_at", nowIso)
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let tier: UserTier = "free";
    const raw = (profileRes.data?.tier as string | null)?.toLowerCase() ?? "free";
    if (raw === "premium") tier = "premium";
    else if (raw === "plus" || raw === "aura+") tier = "plus";

    // active grant can elevate tier
    const grantTier = (grantRes.data?.tier as string | null)?.toLowerCase();
    if (grantTier === "premium") tier = "premium";
    else if (grantTier === "plus" && tier === "free") tier = "plus";

    // active trial elevates free -> plus
    if (tier === "free" && trialRes.data) tier = "plus";

    return { tier, trialEndsAt: (trialRes.data?.ends_at as string | null) ?? null };
  });

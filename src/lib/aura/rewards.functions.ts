import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RewardsSummary = {
  referralCode: string;
  referralUrl: string;
  referralCount: number;
  tarotCreditsEarned: number;     // lifetime, from any source
  tarotCreditsAvailable: number;  // unconsumed
  trialDaysEarned: number;        // lifetime trial days earned via milestones
  activeTrialEndsAt: string | null;
  adTarotAvailableThisWeek: boolean; // free user can still claim this week
  weekStart: string;
};

const TRIAL_DAYS_PER_MILESTONE = 7;
const MILESTONE_EVERY = 4;
const SITE_URL =
  (typeof process !== "undefined" && process.env?.PUBLIC_SITE_URL) ||
  "https://aura.lovable.app";


function mondayOfWeekUTC(d = new Date()): string {
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return m.toISOString().slice(0, 10);
}

function codeFromUserId(userId: string): string {
  // 6-char base32-ish code derived from uuid (stable)
  const hex = userId.replace(/-/g, "").slice(0, 12);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let n = BigInt("0x" + hex);
  let out = "";
  for (let i = 0; i < 6; i++) {
    out = alphabet[Number(n % 32n)] + out;
    n = n / 32n;
  }
  return out;
}

async function ensureCode(supabase: any, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.code) return existing.code as string;

  let code = codeFromUserId(userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    // collision: append random char
    code = code.slice(0, 5) + Math.floor(Math.random() * 36).toString(36).toUpperCase();
  }
  return code;
}

// Privileged writes: users cannot self-grant rewards via RLS, so any
// reward issuance must go through the service-role client after the
// server has validated the request.
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getRewardsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RewardsSummary> => {
    const { supabase, userId } = context;
    const code = await ensureCode(supabase, userId);

    const [{ count: refCount }, { data: credits }, { data: trials }, { data: adGrant }] = await Promise.all([
      supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", userId),
      supabase.from("bonus_tarot_credits").select("id, consumed_at, source").eq("user_id", userId),
      supabase.from("aura_plus_trials").select("starts_at, ends_at").eq("user_id", userId).order("ends_at", { ascending: false }),
      supabase.from("ad_tarot_grants").select("id").eq("user_id", userId).eq("week_start", mondayOfWeekUTC()).maybeSingle(),
    ]);

    const creditsList = (credits ?? []) as Array<{ consumed_at: string | null }>;
    const tarotCreditsEarned = creditsList.length;
    const tarotCreditsAvailable = creditsList.filter((c) => !c.consumed_at).length;

    const trialList = (trials ?? []) as Array<{ starts_at: string; ends_at: string }>;
    const now = Date.now();
    const activeTrial = trialList.find((t) => new Date(t.ends_at).getTime() > now) ?? null;
    const trialDaysEarned = trialList.reduce((sum, t) => {
      const d = Math.round((new Date(t.ends_at).getTime() - new Date(t.starts_at).getTime()) / 86400000);
      return sum + Math.max(0, d);
    }, 0);

    return {
      referralCode: code,
      referralUrl: `${SITE_URL}/?ref=${code}`,
      referralCount: refCount ?? 0,
      tarotCreditsEarned,
      tarotCreditsAvailable,
      trialDaysEarned,
      activeTrialEndsAt: activeTrial?.ends_at ?? null,
      adTarotAvailableThisWeek: !adGrant,
      weekStart: mondayOfWeekUTC(),
    };
  });

export type ClaimAdTarotResult =
  | { ok: true; creditsAvailable: number }
  | { ok: false; reason: "already_claimed" | "premium" | "error" };

export const claimAdTarot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClaimAdTarotResult> => {
    const { supabase, userId } = context;
    const week = mondayOfWeekUTC();
    const admin = await getAdmin();

    // Only free-tier users (no active plus/premium trial or grant) may claim
    const nowIso = new Date().toISOString();
    const [{ data: profile }, { data: trial }, { data: grant }] = await Promise.all([
      supabase.from("profiles").select("tier").eq("id", userId).maybeSingle(),
      supabase.from("aura_plus_trials").select("ends_at").eq("user_id", userId).gt("ends_at", nowIso).limit(1).maybeSingle(),
      supabase.from("premium_grants").select("ends_at").eq("user_id", userId).gt("ends_at", nowIso).limit(1).maybeSingle(),
    ]);
    const tier = ((profile?.tier as string | null) ?? "free").toLowerCase();
    if (tier !== "free" || trial || grant) return { ok: false, reason: "premium" };

    const { error: grantErr } = await admin
      .from("ad_tarot_grants")
      .insert({ user_id: userId, week_start: week });
    if (grantErr) {
      // unique violation
      return { ok: false, reason: "already_claimed" };
    }


    await admin.from("bonus_tarot_credits").insert({ user_id: userId, source: "ad" });
    const { count } = await admin
      .from("bonus_tarot_credits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("consumed_at", null);

    return { ok: true, creditsAvailable: count ?? 0 };
  });

export type RedeemReferralResult =
  | { ok: true; alreadyRedeemed?: boolean }
  | { ok: false; reason: "invalid" | "self" | "already" | "error" };

export const redeemReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(3).max(12) }).parse(d))
  .handler(async ({ data, context }): Promise<RedeemReferralResult> => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase().trim();
    const admin = await getAdmin();

    // Already referred?
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .maybeSingle();
    if (existing) return { ok: true, alreadyRedeemed: true };

    // Look up referrer via admin client — referral_codes is owner-read only
    const { data: codeRow } = await admin
      .from("referral_codes")
      .select("user_id")
      .eq("code", code)
      .maybeSingle();
    if (!codeRow) return { ok: false, reason: "invalid" };
    const referrerId = codeRow.user_id as string;
    if (referrerId === userId) return { ok: false, reason: "self" };

    const { error: insErr } = await admin.from("referrals").insert({
      referrer_id: referrerId,
      referred_user_id: userId,
      code,
      rewarded_at: new Date().toISOString(),
    });
    if (insErr) return { ok: false, reason: "error" };


    // Grant credits: 1 for referrer, 1 welcome for new user (privileged)
    await admin.from("bonus_tarot_credits").insert([
      { user_id: referrerId, source: "referral_referrer" },
      { user_id: userId, source: "referral_welcome" },
    ]);

    // Milestone: every 4 referrals = 7-day AURA+ trial
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referrerId);
    const total = count ?? 0;
    if (total > 0 && total % MILESTONE_EVERY === 0) {
      // Idempotency: tag each milestone with a deterministic source so a
      // re-run (race / retry) cannot grant the same milestone twice.
      const milestoneSource = `referral_milestone_${total / MILESTONE_EVERY}`;
      const { data: existingTrial } = await admin
        .from("aura_plus_trials")
        .select("id")
        .eq("user_id", referrerId)
        .eq("source", milestoneSource)
        .maybeSingle();
      if (!existingTrial) {
        const ends = new Date(Date.now() + TRIAL_DAYS_PER_MILESTONE * 86400000);
        await admin.from("aura_plus_trials").insert({
          user_id: referrerId,
          ends_at: ends.toISOString(),
          source: milestoneSource,
        });
      }
    }


    return { ok: true };
  });

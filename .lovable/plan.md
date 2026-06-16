# Plan — Ad-Tarot & Referral System

## 1. Database (single migration)

New tables:

- **bonus_tarot_credits** — `id`, `user_id`, `source` ('ad' | 'referral_referrer' | 'referral_welcome' | 'milestone'), `created_at`, `consumed_at` (nullable). Each row = one free tarot reading the user can spend.
- **ad_tarot_grants** — `id`, `user_id`, `week_start` (date, Monday), `created_at`. Unique on `(user_id, week_start)` — enforces "one ad-tarot per week" for free users.
- **referral_codes** — `user_id` PK, `code` (text unique, 6-char), `created_at`. Lazily created on first profile open.
- **referrals** — `id`, `referrer_id`, `referred_user_id` (unique — one credit per new user), `code`, `created_at`, `rewarded_at`. Records every completed referral.
- **aura_plus_trials** — `id`, `user_id`, `starts_at`, `ends_at`, `source` ('referral_milestone'). Profile reads tier as effective `plus` if any active trial.

All tables: `GRANT` to `authenticated` + `service_role`, RLS enabled, `auth.uid() = user_id` (or referrer_id) policies. `referrals` allows referrer SELECT of their own rows.

## 2. Server functions

`src/lib/aura/rewards.functions.ts` (new):
- `getRewardsSummary` — returns `{ referralCode, referralUrl, referralCount, tarotCreditsEarned, trialDaysEarned, activeTrialEndsAt, adTarotAvailableThisWeek }`. Lazy-creates referral code.
- `claimAdTarot` — free users only; inserts `ad_tarot_grants` (errors if already claimed this week) and a `bonus_tarot_credits` row with `source='ad'`. Returns new available count.
- `redeemReferral({ code })` — called once after sign-up. Validates code ≠ self, not already referred, inserts `referrals` row, grants 1 bonus credit to referrer + 1 welcome credit to new user, checks referrer's count — every 4 referrals adds a 7-day AURA+ trial. Stores a "notification" row (simple: append to a `user_notifications` table — out of scope; instead surface "yeni ödül var" via summary flag `newReward`).

Modify `src/lib/aura/tarot.functions.ts`:
- `fetchTier`: also check active trial → return `plus` if trial active.
- `tarotLimitFor` already exists. In `drawTarot`, before rejecting (`free` or limit reached), check unconsumed `bonus_tarot_credits`. If available, allow the draw and mark one credit `consumed_at = now()` after successful insert. Update `getTarotStatus` to include `bonusCredits` count.

## 3. UI

**Tarot screen (`src/routes/tarot.tsx`)** — for free users, show "Reklam İzle ve 1 Tarot Hakkı Kazan 🎴" button if no ad-tarot this week. Click → simulated 5s ad modal (placeholder, since no real ad SDK) → `claimAdTarot` → user can immediately draw. If already claimed, show "Bu hafta hakkını kullandın, Pazartesi yenilenecek."

**Profile (`src/routes/profil.tsx`)** — two new sections above "Ayarlar":
- **Ödüllerim ✦** — three cards: tarot credits, invited friends, trial days, plus active trial countdown if any.
- **Arkadaşını Davet Et 🎁** — shows code, copy-link button, WhatsApp share, Instagram share (web share API fallback). Message exactly as specified.

**Referral capture** — `src/routes/index.tsx` reads `?ref=CODE` from URL on mount, stores in `localStorage`. After first successful auth/onboarding (in `AuthScreen` or root effect), calls `redeemReferral`. Use a simple effect in `__root.tsx` post-auth.

## 4. Constraints/notes

- No real ad SDK — the "ad" is a 5s modal with a countdown. Clear in code comment that this is a placeholder for AdMob.
- Reset every Monday: implicit via `week_start` date computed in JS (Monday of current week) used in unique key.
- Notifications: in-app only (toast on next profile open when `newReward` flag is true); no push, since native push isn't wired here.
- All copy in Turkish.

## Files

Created:
- `supabase/migrations/<ts>_rewards_and_referrals.sql`
- `src/lib/aura/rewards.functions.ts`
- `src/components/aura/AdTarotModal.tsx`
- `src/components/aura/ReferralCard.tsx`
- `src/components/aura/RewardsCard.tsx`

Edited:
- `src/lib/aura/tarot.functions.ts` (bonus credit consumption, trial-aware tier)
- `src/lib/aura/tarot-data.ts` (extend `TarotLimit` with `bonusCredits`)
- `src/routes/tarot.tsx` (ad button for free users)
- `src/routes/profil.tsx` (Rewards + Referral sections)
- `src/routes/__root.tsx` (capture `?ref=` + redeem after sign-in)

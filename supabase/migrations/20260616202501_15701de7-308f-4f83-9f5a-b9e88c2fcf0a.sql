
-- referrals: drop any insert/update/delete policies so only service_role can write
DROP POLICY IF EXISTS "Users can insert their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users insert own referral" ON public.referrals;
DROP POLICY IF EXISTS "Users can manage own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Referrals select own" ON public.referrals;

CREATE POLICY "Referrals select own"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- referral_codes: drop any client write policies; service role writes via redeemReferral / ensureCode
DROP POLICY IF EXISTS "Users manage own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can manage own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can insert own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Referral codes select own" ON public.referral_codes;

CREATE POLICY "Referral codes select own"
  ON public.referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

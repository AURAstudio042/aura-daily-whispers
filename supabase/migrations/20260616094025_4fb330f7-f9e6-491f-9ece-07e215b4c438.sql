
-- Bonus tarot credits (each row = 1 free reading)
CREATE TABLE public.bonus_tarot_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_tarot_credits TO authenticated;
GRANT ALL ON public.bonus_tarot_credits TO service_role;
ALTER TABLE public.bonus_tarot_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bonus_tarot_credits" ON public.bonus_tarot_credits
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_btc_user_unconsumed ON public.bonus_tarot_credits(user_id) WHERE consumed_at IS NULL;

-- Weekly ad-tarot grants
CREATE TABLE public.ad_tarot_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_tarot_grants TO authenticated;
GRANT ALL ON public.ad_tarot_grants TO service_role;
ALTER TABLE public.ad_tarot_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad_tarot_grants" ON public.ad_tarot_grants
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Referral codes (one per user)
CREATE TABLE public.referral_codes (
  user_id uuid NOT NULL PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
-- Owners manage their own
CREATE POLICY "Users manage own referral_codes" ON public.referral_codes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Anyone signed-in can read codes to redeem (only exposes code <-> user_id)
CREATE POLICY "Authenticated can read referral_codes" ON public.referral_codes
  FOR SELECT TO authenticated USING (true);

-- Referrals
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  rewarded_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrer can read own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "Referred user can insert" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_user_id);

-- AURA+ trials
CREATE TABLE public.aura_plus_trials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aura_plus_trials TO authenticated;
GRANT ALL ON public.aura_plus_trials TO service_role;
ALTER TABLE public.aura_plus_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own aura_plus_trials" ON public.aura_plus_trials
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_apt_user_active ON public.aura_plus_trials(user_id, ends_at);

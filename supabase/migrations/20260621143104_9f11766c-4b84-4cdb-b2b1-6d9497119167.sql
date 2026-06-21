
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS device_hash text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_referrals_device_hash ON public.referrals (device_hash) WHERE device_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_ip_hash ON public.referrals (ip_hash) WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_activated ON public.referrals (referrer_id) WHERE activated_at IS NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_device_hash text,
  ADD COLUMN IF NOT EXISTS signup_ip_hash text;

CREATE INDEX IF NOT EXISTS idx_profiles_signup_device_hash ON public.profiles (signup_device_hash) WHERE signup_device_hash IS NOT NULL;

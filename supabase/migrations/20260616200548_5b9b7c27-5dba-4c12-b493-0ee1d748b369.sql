
-- Lock down ad_tarot_grants: SELECT own rows only
DROP POLICY IF EXISTS "Users manage own ad_tarot_grants" ON public.ad_tarot_grants;
CREATE POLICY "Users read own ad_tarot_grants" ON public.ad_tarot_grants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Lock down aura_plus_trials: SELECT own rows only
DROP POLICY IF EXISTS "Users manage own aura_plus_trials" ON public.aura_plus_trials;
CREATE POLICY "Users read own aura_plus_trials" ON public.aura_plus_trials
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Lock down bonus_tarot_credits: SELECT own rows only
DROP POLICY IF EXISTS "Users manage own bonus_tarot_credits" ON public.bonus_tarot_credits;
CREATE POLICY "Users read own bonus_tarot_credits" ON public.bonus_tarot_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- referral_codes: drop broad-read policy; owner-only access
DROP POLICY IF EXISTS "Authenticated can read referral_codes" ON public.referral_codes;
-- "Users manage own referral_codes" (ALL, auth.uid()=user_id) already restricts to owner

-- Storage: add UPDATE policy mirroring ownership check
DROP POLICY IF EXISTS "Users update own coffee photos" ON storage.objects;
CREATE POLICY "Users update own coffee photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'coffee-photos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'coffee-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

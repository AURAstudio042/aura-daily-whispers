
CREATE TABLE IF NOT EXISTS public.coffee_ad_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

GRANT SELECT ON public.coffee_ad_grants TO authenticated;
GRANT ALL ON public.coffee_ad_grants TO service_role;

ALTER TABLE public.coffee_ad_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coffee ad grants select own"
  ON public.coffee_ad_grants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coffee_ad_grants_user_unconsumed_idx
  ON public.coffee_ad_grants (user_id) WHERE consumed_at IS NULL;

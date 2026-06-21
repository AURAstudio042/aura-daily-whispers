
CREATE TABLE IF NOT EXISTS public.interstitial_ad_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placement text NOT NULL,
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interstitial_ad_log_user_shown
  ON public.interstitial_ad_log (user_id, shown_at DESC);

GRANT SELECT ON public.interstitial_ad_log TO authenticated;
GRANT ALL ON public.interstitial_ad_log TO service_role;

ALTER TABLE public.interstitial_ad_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own interstitial log"
  ON public.interstitial_ad_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

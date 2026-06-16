-- Add subscription tier to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';

-- Tarot readings table
CREATE TABLE IF NOT EXISTS public.tarot_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  card_name text NOT NULL,
  card_meaning text NOT NULL,
  interpretation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarot_readings TO authenticated;
GRANT ALL ON public.tarot_readings TO service_role;

ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tarot_readings"
ON public.tarot_readings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tarot_readings_user_created_idx
ON public.tarot_readings (user_id, created_at DESC);
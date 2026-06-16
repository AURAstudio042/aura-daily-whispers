CREATE TABLE public.monthly_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_analyses TO authenticated;
GRANT ALL ON public.monthly_analyses TO service_role;

ALTER TABLE public.monthly_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own monthly_analyses"
  ON public.monthly_analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.stone_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('stone','scent')),
  name text NOT NULL,
  meaning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, kind, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_favorites TO authenticated;
GRANT ALL ON public.stone_favorites TO service_role;
ALTER TABLE public.stone_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stone_favorites" ON public.stone_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.birth_charts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.birth_charts TO authenticated;
GRANT ALL ON public.birth_charts TO service_role;
ALTER TABLE public.birth_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own birth_charts" ON public.birth_charts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.planet_transits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planet_transits TO authenticated;
GRANT ALL ON public.planet_transits TO service_role;
ALTER TABLE public.planet_transits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own planet_transits" ON public.planet_transits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

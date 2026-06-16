
-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  birth_date DATE,
  birth_time TEXT,
  city TEXT,
  zodiac_sign TEXT,
  style_type TEXT,
  skin_tone TEXT,
  hair_color TEXT,
  notification_time TEXT NOT NULL DEFAULT '07:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- daily_content
CREATE TABLE public.daily_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_content TO authenticated;
GRANT ALL ON public.daily_content TO service_role;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily_content" ON public.daily_content FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saved_quotes
CREATE TABLE public.saved_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  quote_author TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_quotes TO authenticated;
GRANT ALL ON public.saved_quotes TO service_role;
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved_quotes" ON public.saved_quotes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

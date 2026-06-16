CREATE TABLE public.coffee_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  reading TEXT NOT NULL,
  saved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coffee_readings TO authenticated;
GRANT ALL ON public.coffee_readings TO service_role;

ALTER TABLE public.coffee_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coffee readings"
ON public.coffee_readings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX coffee_readings_user_created_idx
ON public.coffee_readings (user_id, created_at DESC);
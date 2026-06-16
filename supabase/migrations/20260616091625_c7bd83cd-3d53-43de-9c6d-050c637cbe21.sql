CREATE TABLE public.future_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  letter text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deliver_at timestamptz NOT NULL,
  opened_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.future_letters TO authenticated;
GRANT ALL ON public.future_letters TO service_role;

ALTER TABLE public.future_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own future_letters"
  ON public.future_letters
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_future_letters_user_deliver ON public.future_letters(user_id, deliver_at DESC);
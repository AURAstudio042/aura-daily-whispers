
-- Unified ad-reward credits ledger. All entries are append-only and only
-- service_role may insert. Users can read their own ledger to compute balance.
CREATE TABLE public.ad_credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL CHECK (delta IN (-1, 1)),
  reason text NOT NULL CHECK (reason IN (
    'ad_tarot','ad_coffee','ad_mystic',
    'spend_tarot','spend_coffee','spend_mystic'
  )),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ad_credits_ledger_user_idx ON public.ad_credits_ledger(user_id, created_at DESC);

GRANT SELECT ON public.ad_credits_ledger TO authenticated;
GRANT ALL ON public.ad_credits_ledger TO service_role;

ALTER TABLE public.ad_credits_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ad ledger"
  ON public.ad_credits_ledger
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

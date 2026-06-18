
-- 1) Profiles: enforce tier-immutability at RLS layer (defense in depth alongside trigger)
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;

CREATE POLICY "Users select own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND tier IS NOT DISTINCT FROM (SELECT p.tier FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2) Future letters: never expose letter body before deliver_at
-- Revoke column-level SELECT on `letter` and expose via a SECURITY DEFINER function.
REVOKE SELECT ON public.future_letters FROM authenticated;
GRANT SELECT (id, user_id, created_at, deliver_at, opened_at, answers)
  ON public.future_letters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.future_letters TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_future_letters()
RETURNS TABLE (
  id uuid,
  letter text,
  created_at timestamptz,
  deliver_at timestamptz,
  opened_at timestamptz,
  answers jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fl.id,
    CASE WHEN fl.deliver_at <= now() THEN fl.letter ELSE NULL END AS letter,
    fl.created_at,
    fl.deliver_at,
    fl.opened_at,
    fl.answers
  FROM public.future_letters fl
  WHERE fl.user_id = auth.uid()
  ORDER BY fl.created_at DESC
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_future_letters() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_future_letters() TO authenticated;

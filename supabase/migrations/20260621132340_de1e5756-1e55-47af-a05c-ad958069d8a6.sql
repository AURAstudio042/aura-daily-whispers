-- Account soft deletion support
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON public.profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Allow the existing UPDATE policy to set deleted_at; tier-protection trigger
-- already blocks tier escalation, so no extra change needed there.

-- Server-side helper: marks the calling user's profile as soft-deleted.
-- Returns true on success. SECURITY DEFINER so the row can be updated even if
-- the caller's policies change in the future; auth.uid() gate keeps it safe.
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles
     SET deleted_at = now(),
         updated_at = now()
   WHERE id = uid;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

-- Cancel a pending deletion within the 7-day grace window.
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles
     SET deleted_at = NULL,
         updated_at = now()
   WHERE id = uid
     AND deleted_at IS NOT NULL
     AND deleted_at > now() - interval '7 days';
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated;
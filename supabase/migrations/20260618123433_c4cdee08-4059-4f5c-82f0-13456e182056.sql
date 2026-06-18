-- Prevent users from self-escalating their subscription tier via direct UPDATE.
-- The "Users manage own profile" policy allows row-level updates on profiles, but
-- the `tier` column must only be writable by service_role (server-side admin code).
CREATE OR REPLACE FUNCTION public.prevent_user_tier_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / postgres / supabase_admin to change tier freely.
  IF current_setting('role', true) IN ('service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF session_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Otherwise, the `tier` column cannot be modified by the row owner.
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Updating tier is not permitted. Tier is managed server-side.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_tier_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_tier_escalation
BEFORE UPDATE OF tier ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_tier_escalation();
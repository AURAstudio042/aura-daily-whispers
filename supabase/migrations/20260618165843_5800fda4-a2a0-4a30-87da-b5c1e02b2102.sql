
-- Create a private schema for helpers that must not be exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- Recreate has_role in the private schema (SECURITY DEFINER, fixed search_path)
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO postgres, service_role;

-- Repoint every policy that referenced public.has_role to private.has_role
-- user_roles
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- whispers_pool
DROP POLICY IF EXISTS "admins manage whispers" ON public.whispers_pool;
CREATE POLICY "admins manage whispers" ON public.whispers_pool
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- quotes_pool
DROP POLICY IF EXISTS "admins manage quotes" ON public.quotes_pool;
CREATE POLICY "admins manage quotes" ON public.quotes_pool
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- mystic_pool
DROP POLICY IF EXISTS "admins manage mystic" ON public.mystic_pool;
CREATE POLICY "admins manage mystic" ON public.mystic_pool
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- special_day_messages
DROP POLICY IF EXISTS "admins manage special days" ON public.special_day_messages;
CREATE POLICY "admins manage special days" ON public.special_day_messages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- page_views
DROP POLICY IF EXISTS "admins read views" ON public.page_views;
CREATE POLICY "admins read views" ON public.page_views
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- share_events
DROP POLICY IF EXISTS "admins read shares" ON public.share_events;
CREATE POLICY "admins read shares" ON public.share_events
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- premium_grants
DROP POLICY IF EXISTS "users read own grants" ON public.premium_grants;
CREATE POLICY "users read own grants" ON public.premium_grants
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins manage grants" ON public.premium_grants;
CREATE POLICY "admins manage grants" ON public.premium_grants
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Finally drop the public version so it is no longer callable as RPC
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

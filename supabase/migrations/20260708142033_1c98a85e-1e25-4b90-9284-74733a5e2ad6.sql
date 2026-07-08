
-- Enforce user_id NOT NULL and explicit non-null check in RLS
ALTER TABLE public.page_views ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.share_events ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "users insert own views" ON public.page_views;
CREATE POLICY "users insert own views" ON public.page_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "users insert own shares" ON public.share_events;
CREATE POLICY "users insert own shares" ON public.share_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

-- Revoke EXECUTE on internal SECURITY DEFINER functions from client roles.
-- These are only ever invoked by service_role / backend processes (edge cron,
-- email queue). Signed-in users must not be able to call them directly.
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_user_tier_escalation() FROM PUBLIC, anon, authenticated;

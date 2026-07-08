
CREATE OR REPLACE FUNCTION public.request_account_deletion()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
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
$function$;

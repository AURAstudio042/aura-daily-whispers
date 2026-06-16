-- Production hardening: protect against duplicate referral milestone trials
-- by making (user_id, source) unique on aura_plus_trials. The app code already
-- writes a deterministic per-milestone source like "referral_milestone_3",
-- and this constraint guarantees idempotency even under a race.
ALTER TABLE public.aura_plus_trials
  ADD CONSTRAINT aura_plus_trials_user_source_key
  UNIQUE (user_id, source);
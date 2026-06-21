
-- RLS hijyen: {public} role yerine açık olarak authenticated / anon / service_role.
-- Tüm policy bodies aynı kalır; sadece TO clause düzeltilir.

-- USER-OWNED tables → TO authenticated (auth.uid() bazlı)
DROP POLICY IF EXISTS "own birth_charts" ON public.birth_charts;
CREATE POLICY "own birth_charts" ON public.birth_charts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own coffee readings" ON public.coffee_readings;
CREATE POLICY "Users manage own coffee readings" ON public.coffee_readings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own daily_content" ON public.daily_content;
CREATE POLICY "Users manage own daily_content" ON public.daily_content
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own planet_transits" ON public.planet_transits;
CREATE POLICY "own planet_transits" ON public.planet_transits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own saved_quotes" ON public.saved_quotes;
CREATE POLICY "Users manage own saved_quotes" ON public.saved_quotes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own stone_favorites" ON public.stone_favorites;
CREATE POLICY "own stone_favorites" ON public.stone_favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own tarot_readings" ON public.tarot_readings;
CREATE POLICY "Users manage own tarot_readings" ON public.tarot_readings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PUBLIC CONTENT READS → TO anon, authenticated (server publishable / signed-in clients)
DROP POLICY IF EXISTS "anyone reads active mystic" ON public.mystic_pool;
CREATE POLICY "anyone reads active mystic" ON public.mystic_pool
  FOR SELECT TO anon, authenticated USING (active);

DROP POLICY IF EXISTS "anyone reads active quotes" ON public.quotes_pool;
CREATE POLICY "anyone reads active quotes" ON public.quotes_pool
  FOR SELECT TO anon, authenticated USING (active);

DROP POLICY IF EXISTS "anyone reads active whispers" ON public.whispers_pool;
CREATE POLICY "anyone reads active whispers" ON public.whispers_pool
  FOR SELECT TO anon, authenticated USING (active);

DROP POLICY IF EXISTS "anyone reads special days" ON public.special_day_messages;
CREATE POLICY "anyone reads special days" ON public.special_day_messages
  FOR SELECT TO anon, authenticated USING (true);

-- SERVICE-ROLE only operations → TO service_role
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
CREATE POLICY "Service role can insert send log" ON public.email_send_log
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
CREATE POLICY "Service role can read send log" ON public.email_send_log
  FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
CREATE POLICY "Service role can update send log" ON public.email_send_log
  FOR UPDATE TO service_role USING (true);

DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role can manage send state" ON public.email_send_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens
  FOR UPDATE TO service_role USING (true);

DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens
  FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can insert suppressed emails" ON public.suppressed_emails
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can read suppressed emails" ON public.suppressed_emails
  FOR SELECT TO service_role USING (true);

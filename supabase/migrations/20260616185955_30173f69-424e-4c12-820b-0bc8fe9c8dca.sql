
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Seed admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'harunn.hk42@gmail.com'
ON CONFLICT DO NOTHING;

-- CONTENT POOLS
CREATE TABLE public.whispers_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.whispers_pool TO anon, authenticated;
GRANT ALL ON public.whispers_pool TO service_role;
ALTER TABLE public.whispers_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads active whispers" ON public.whispers_pool FOR SELECT USING (active);
CREATE POLICY "admins manage whispers" ON public.whispers_pool FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quotes_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text,
  tags text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quotes_pool TO anon, authenticated;
GRANT ALL ON public.quotes_pool TO service_role;
ALTER TABLE public.quotes_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads active quotes" ON public.quotes_pool FOR SELECT USING (active);
CREATE POLICY "admins manage quotes" ON public.quotes_pool FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.mystic_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mystic_pool TO anon, authenticated;
GRANT ALL ON public.mystic_pool TO service_role;
ALTER TABLE public.mystic_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads active mystic" ON public.mystic_pool FOR SELECT USING (active);
CREATE POLICY "admins manage mystic" ON public.mystic_pool FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.special_day_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  day int NOT NULL CHECK (day BETWEEN 1 AND 31),
  label text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month, day)
);
GRANT SELECT ON public.special_day_messages TO anon, authenticated;
GRANT ALL ON public.special_day_messages TO service_role;
ALTER TABLE public.special_day_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads special days" ON public.special_day_messages FOR SELECT USING (true);
CREATE POLICY "admins manage special days" ON public.special_day_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ANALYTICS
CREATE TABLE public.page_views (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  route text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO authenticated;
GRANT USAGE ON SEQUENCE public.page_views_id_seq TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users insert own views" ON public.page_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read views" ON public.page_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX page_views_route_idx ON public.page_views (route);
CREATE INDEX page_views_viewed_at_idx ON public.page_views (viewed_at);

CREATE TABLE public.share_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.share_events TO authenticated;
GRANT USAGE ON SEQUENCE public.share_events_id_seq TO authenticated;
GRANT ALL ON public.share_events TO service_role;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users insert own shares" ON public.share_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read shares" ON public.share_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PREMIUM GRANTS
CREATE TABLE public.premium_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('plus','premium')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_grants TO authenticated;
GRANT ALL ON public.premium_grants TO service_role;
ALTER TABLE public.premium_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own grants" ON public.premium_grants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage grants" ON public.premium_grants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

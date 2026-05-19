-- Create onboardings table
CREATE TABLE IF NOT EXISTS public.onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  site TEXT,
  instagram TEXT,
  facebook TEXT,
  service_description TEXT,
  marketing_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.onboardings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboardings_admin_all" ON public.onboardings;
CREATE POLICY "onboardings_admin_all" ON public.onboardings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "onboardings_user_select" ON public.onboardings;
CREATE POLICY "onboardings_user_select" ON public.onboardings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "onboardings_user_insert" ON public.onboardings;
CREATE POLICY "onboardings_user_insert" ON public.onboardings
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "onboardings_user_update" ON public.onboardings;
CREATE POLICY "onboardings_user_update" ON public.onboardings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "onboardings_user_delete" ON public.onboardings;
CREATE POLICY "onboardings_user_delete" ON public.onboardings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_all" ON public.settings;
CREATE POLICY "settings_all" ON public.settings
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS onboardings_user_id_idx ON public.onboardings (user_id);
CREATE INDEX IF NOT EXISTS onboardings_opportunity_id_idx ON public.onboardings (opportunity_id);

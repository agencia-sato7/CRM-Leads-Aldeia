-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'COMMERCIAL',
  phone TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Novo',
  country TEXT NOT NULL DEFAULT 'Brazil',
  city TEXT,
  origin TEXT NOT NULL DEFAULT 'Site',
  marketing_status TEXT,
  objectives TEXT,
  notes TEXT,
  scheduled_meeting_date TIMESTAMPTZ,
  invests_in_mkt BOOLEAN DEFAULT FALSE,
  has_agency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  service TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Aberta',
  lead_needs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  file_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resources
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true) ON CONFLICT (id) DO NOTHING;

-- Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policies for Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "leads_update" ON public.leads;
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR user_id = auth.uid()
);

-- Policies for Meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
CREATE POLICY "meetings_select" ON public.meetings FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.leads l 
    LEFT JOIN public.profiles p ON p.id = auth.uid()
    WHERE l.id = lead_id AND (p.role = 'ADMIN' OR l.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND user_id = auth.uid())
);

-- Policies for Opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opps_select" ON public.opportunities;
CREATE POLICY "opps_select" ON public.opportunities FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "opps_insert" ON public.opportunities;
CREATE POLICY "opps_insert" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "opps_update" ON public.opportunities;
CREATE POLICY "opps_update" ON public.opportunities FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR user_id = auth.uid()
);

-- Policies for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated USING (from_id = auth.uid() OR to_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (from_id = auth.uid());

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated USING (to_id = auth.uid());

-- Policies for Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_select" ON public.resources;
CREATE POLICY "resources_select" ON public.resources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "resources_insert" ON public.resources;
CREATE POLICY "resources_insert" ON public.resources FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "resources_delete" ON public.resources;
CREATE POLICY "resources_delete" ON public.resources FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Policies for Storage Buckets
DROP POLICY IF EXISTS "resources_bucket_select" ON storage.objects;
CREATE POLICY "resources_bucket_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "resources_bucket_insert" ON storage.objects;
CREATE POLICY "resources_bucket_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "resources_bucket_delete" ON storage.objects;
CREATE POLICY "resources_bucket_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Trigger for Profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'COMMERCIAL')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Users & Data
DO $$
DECLARE
  admin_id uuid;
  user_id uuid;
  lead1_id uuid;
  lead2_id uuid;
BEGIN
  -- Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'diretor@sato7.com.br') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000', 'diretor@sato7.com.br', crypt('Skip@Pass', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Admin S7SALES", "role": "ADMIN"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  -- User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joao@sato7.com.br') THEN
    user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      user_id, '00000000-0000-0000-0000-000000000000', 'joao@sato7.com.br', crypt('Skip@Pass', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "João (Comercial)", "role": "COMMERCIAL"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );

    SELECT id INTO admin_id FROM auth.users WHERE email = 'diretor@sato7.com.br';

    -- Seed Leads for joao
    lead1_id := gen_random_uuid();
    INSERT INTO public.leads (id, user_id, contact, company, email, status, country, origin, objectives, invests_in_mkt, has_agency, created_at)
    VALUES (lead1_id, user_id, 'Marcos Paulo', 'Tech Solutions Brazil', 'marcos@techbr.com', 'Em Negociação', 'Brazil', 'Site', 'Aumentar faturamento online', true, true, NOW());

    lead2_id := gen_random_uuid();
    INSERT INTO public.leads (id, user_id, contact, company, email, status, country, origin, objectives, invests_in_mkt, has_agency, created_at)
    VALUES (lead2_id, user_id, 'John Doe', 'Global Soft US', 'john@globalus.com', 'Qualificado', 'USA', 'Google', 'Launch new SaaS product', false, false, NOW());

    -- Seed Opportunities
    INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, lead_needs, created_at)
    VALUES (lead1_id, user_id, 'Fee Mensal', 'Gestão de Performance ADS', 15000, 'Aberta', 'Precisa urgente de tráfego', NOW());

    INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, lead_needs, created_at)
    VALUES (lead2_id, user_id, 'Job', 'Criação de Website', 35000, 'Ganha', 'Website in english and spanish', NOW() - INTERVAL '2 days');

    -- Seed Messages
    IF admin_id IS NOT NULL THEN
      INSERT INTO public.messages (from_id, to_id, text, created_at)
      VALUES (admin_id, user_id, 'João, parabéns pelo fechamento com a Global Soft! Vamos focar agora na Tech Solutions.', NOW());
    END IF;

    -- Seed Resources
    INSERT INTO public.resources (title, description, tag, url, created_at)
    VALUES ('Guia de Vendas S7SALES', 'Manual completo de abordagem.', 'Oficial', 'https://example.com/guide', NOW());
  END IF;
END $$;

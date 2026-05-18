CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select" ON public.settings
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert" ON public.settings;
CREATE POLICY "settings_insert" ON public.settings
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "settings_update" ON public.settings;
CREATE POLICY "settings_update" ON public.settings
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

INSERT INTO public.settings (key, value)
VALUES ('onboarding_emails', '["diretoria@sato7.com.br"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

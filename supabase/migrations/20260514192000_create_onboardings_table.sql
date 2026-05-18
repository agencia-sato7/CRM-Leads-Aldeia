CREATE TABLE IF NOT EXISTS public.onboardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    site TEXT,
    instagram TEXT,
    facebook TEXT,
    service_description TEXT,
    marketing_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.onboardings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboardings_select" ON public.onboardings;
CREATE POLICY "onboardings_select" ON public.onboardings
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN') OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "onboardings_insert" ON public.onboardings;
CREATE POLICY "onboardings_insert" ON public.onboardings
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "onboardings_update" ON public.onboardings;
CREATE POLICY "onboardings_update" ON public.onboardings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN') OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "onboardings_delete" ON public.onboardings;
CREATE POLICY "onboardings_delete" ON public.onboardings
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN') OR
        user_id = auth.uid()
    );

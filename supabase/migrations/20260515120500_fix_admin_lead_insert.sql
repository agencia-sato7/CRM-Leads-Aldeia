DO $$
BEGIN
  -- Fix leads insert for ADMIN
  DROP POLICY IF EXISTS "leads_insert" ON public.leads;
  CREATE POLICY "leads_insert" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

  -- Fix opportunities insert for ADMIN
  DROP POLICY IF EXISTS "opps_insert" ON public.opportunities;
  CREATE POLICY "opps_insert" ON public.opportunities
    FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

  -- Fix customers insert for ADMIN
  DROP POLICY IF EXISTS "customers_insert" ON public.customers;
  CREATE POLICY "customers_insert" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );
END $$;

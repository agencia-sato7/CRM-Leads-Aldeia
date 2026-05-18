DO $$
BEGIN
  -- Update RLS for leads
  DROP POLICY IF EXISTS "leads_select" ON public.leads;
  CREATE POLICY "leads_select" ON public.leads 
    FOR SELECT TO authenticated USING (true);
    
  -- Update RLS for opportunities
  DROP POLICY IF EXISTS "opps_select" ON public.opportunities;
  CREATE POLICY "opps_select" ON public.opportunities 
    FOR SELECT TO authenticated USING (true);
    
  -- Update RLS for customers
  DROP POLICY IF EXISTS "customers_select" ON public.customers;
  CREATE POLICY "customers_select" ON public.customers 
    FOR SELECT TO authenticated USING (true);
    
  -- Update RLS for onboardings
  DROP POLICY IF EXISTS "onboardings_select" ON public.onboardings;
  CREATE POLICY "onboardings_select" ON public.onboardings 
    FOR SELECT TO authenticated USING (true);

  -- Update RLS for meetings
  DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
  CREATE POLICY "meetings_select" ON public.meetings 
    FOR SELECT TO authenticated USING (true);
END $$;

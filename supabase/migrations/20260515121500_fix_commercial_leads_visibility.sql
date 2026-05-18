DO $$
BEGIN
  -- Update leads_select policy so non-admins can see leads with user_id = auth.uid() OR user_id IS NULL
  DROP POLICY IF EXISTS "leads_select" ON public.leads;
  CREATE POLICY "leads_select" ON public.leads
    FOR SELECT TO authenticated
    USING (
      EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' )
      OR user_id = auth.uid()
      OR user_id IS NULL
    );

  -- Update leads_update policy to allow non-admins to update/claim unassigned leads
  DROP POLICY IF EXISTS "leads_update" ON public.leads;
  CREATE POLICY "leads_update" ON public.leads
    FOR UPDATE TO authenticated
    USING (
      EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' )
      OR user_id = auth.uid()
      OR user_id IS NULL
    );

  -- Update opps_select policy
  DROP POLICY IF EXISTS "opps_select" ON public.opportunities;
  CREATE POLICY "opps_select" ON public.opportunities
    FOR SELECT TO authenticated
    USING (
      EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' )
      OR user_id = auth.uid()
      OR user_id IS NULL
    );

  -- Update opps_update policy
  DROP POLICY IF EXISTS "opps_update" ON public.opportunities;
  CREATE POLICY "opps_update" ON public.opportunities
    FOR UPDATE TO authenticated
    USING (
      EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' )
      OR user_id = auth.uid()
      OR user_id IS NULL
    );

  -- Update customers_select policy
  DROP POLICY IF EXISTS "customers_select" ON public.customers;
  CREATE POLICY "customers_select" ON public.customers
    FOR SELECT TO authenticated
    USING (
      EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' )
      OR user_id = auth.uid()
      OR user_id IS NULL
    );

  -- Update meetings_select policy
  DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
  CREATE POLICY "meetings_select" ON public.meetings
    FOR SELECT TO authenticated
    USING (
      EXISTS ( 
        SELECT 1 FROM leads l 
        LEFT JOIN profiles p ON p.id = auth.uid()
        WHERE l.id = meetings.lead_id 
        AND (p.role = 'ADMIN' OR l.user_id = auth.uid() OR l.user_id IS NULL)
      )
    );

END $$;

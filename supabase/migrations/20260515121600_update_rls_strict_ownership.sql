DO $$
BEGIN
  -- Update RLS for opportunities update (strict ownership)
  DROP POLICY IF EXISTS "opps_update" ON public.opportunities;
  CREATE POLICY "opps_update" ON public.opportunities 
    FOR UPDATE TO authenticated USING ((user_id = auth.uid()) OR (user_id IS NULL));
    
  -- Update RLS for leads update (strict ownership)
  DROP POLICY IF EXISTS "leads_update" ON public.leads;
  CREATE POLICY "leads_update" ON public.leads 
    FOR UPDATE TO authenticated USING ((user_id = auth.uid()) OR (user_id IS NULL));
END $$;

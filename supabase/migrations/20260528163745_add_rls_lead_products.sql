DO $
BEGIN
  -- Create policies safely for lead_products
  DROP POLICY IF EXISTS "authenticated_select_lead_products" ON public.lead_products;
  CREATE POLICY "authenticated_select_lead_products" ON public.lead_products
    FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "authenticated_insert_lead_products" ON public.lead_products;
  CREATE POLICY "authenticated_insert_lead_products" ON public.lead_products
    FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "authenticated_update_lead_products" ON public.lead_products;
  CREATE POLICY "authenticated_update_lead_products" ON public.lead_products
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "authenticated_delete_lead_products" ON public.lead_products;
  CREATE POLICY "authenticated_delete_lead_products" ON public.lead_products
    FOR DELETE TO authenticated USING (true);
END $;

DO $$
BEGIN
  -- Drop existing leads_insert policy if any
  DROP POLICY IF EXISTS "leads_insert" ON public.leads;

  -- Recreate policy to allow authenticated users to insert, but allow ADMINs to bypass the exact user_id match
  CREATE POLICY "leads_insert" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    );
END $$;

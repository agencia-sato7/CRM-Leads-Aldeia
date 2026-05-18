DO $$
BEGIN
  DROP POLICY IF EXISTS "onboardings_select" ON public.onboardings;
  
  CREATE POLICY "onboardings_select" ON public.onboardings
    FOR SELECT TO authenticated USING (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
      )
    );
END $$;

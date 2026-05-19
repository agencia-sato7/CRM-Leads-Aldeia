DO $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Fix leads SELECT policy
  DROP POLICY IF EXISTS "leads_select" ON public.leads;
  CREATE POLICY "leads_select" ON public.leads
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid() OR 
      user_id IS NULL OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    );

  -- Fix leads UPDATE policy
  DROP POLICY IF EXISTS "leads_update" ON public.leads;
  CREATE POLICY "leads_update" ON public.leads
    FOR UPDATE TO authenticated
    USING (
      user_id = auth.uid() OR 
      user_id IS NULL OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    );

  -- Fix opps SELECT policy
  DROP POLICY IF EXISTS "opps_select" ON public.opportunities;
  CREATE POLICY "opps_select" ON public.opportunities
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid() OR 
      user_id IS NULL OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    );

  -- Fix opps INSERT policy
  DROP POLICY IF EXISTS "opps_insert" ON public.opportunities;
  CREATE POLICY "opps_insert" ON public.opportunities
    FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid() OR 
      user_id IS NULL OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    );

  -- Fix opps UPDATE policy
  DROP POLICY IF EXISTS "opps_update" ON public.opportunities;
  CREATE POLICY "opps_update" ON public.opportunities
    FOR UPDATE TO authenticated
    USING (
      user_id = auth.uid() OR 
      user_id IS NULL OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    );

  -- Handle Role Permissions Seed
  -- Create or get 'COMMERCIAL' role
  INSERT INTO public.roles (name, description, is_system)
  VALUES ('COMMERCIAL', 'Role comercial padrão', true)
  ON CONFLICT (name) DO UPDATE SET is_system = true
  RETURNING id INTO v_role_id;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'COMMERCIAL';
  END IF;

  IF v_role_id IS NOT NULL THEN
    -- Add permissions for COMMERCIAL
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES 
      (v_role_id, 'leads', true, true, true, false),
      (v_role_id, 'opportunities', true, true, true, false),
      (v_role_id, 'customers', true, true, true, false),
      (v_role_id, 'products', false, true, false, false),
      (v_role_id, 'price-table', false, true, false, false),
      (v_role_id, 'onboarding', true, true, true, false)
    ON CONFLICT (role_id, resource) DO UPDATE
    SET can_read = true, can_create = true, can_update = true;
  END IF;

  -- Handle 'COMERCIAL' misspell
  INSERT INTO public.roles (name, description, is_system)
  VALUES ('COMERCIAL', 'Role comercial pt-br', true)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_role_id FROM public.roles WHERE name = 'COMERCIAL';
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES 
      (v_role_id, 'leads', true, true, true, false),
      (v_role_id, 'opportunities', true, true, true, false),
      (v_role_id, 'customers', true, true, true, false),
      (v_role_id, 'products', false, true, false, false),
      (v_role_id, 'price-table', false, true, false, false),
      (v_role_id, 'onboarding', true, true, true, false)
    ON CONFLICT (role_id, resource) DO UPDATE
    SET can_read = true, can_create = true, can_update = true;
  END IF;

END $$;

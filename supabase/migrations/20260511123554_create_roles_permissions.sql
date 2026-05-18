DO $$
DECLARE
  v_admin_id UUID;
  v_comm_id UUID;
BEGIN
  CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, resource)
  );

  -- Seed initial roles
  INSERT INTO public.roles (name, description, is_system) VALUES 
  ('ADMIN', 'Administrador do Sistema', true),
  ('COMMERCIAL', 'Equipe Comercial', true)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_admin_id FROM public.roles WHERE name = 'ADMIN';
  SELECT id INTO v_comm_id FROM public.roles WHERE name = 'COMMERCIAL';

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES 
      (v_admin_id, 'leads', true, true, true, true),
      (v_admin_id, 'opportunities', true, true, true, true),
      (v_admin_id, 'resources', true, true, true, true),
      (v_admin_id, 'users', true, true, true, true),
      (v_admin_id, 'roles', true, true, true, true)
    ON CONFLICT (role_id, resource) DO NOTHING;
  END IF;

  IF v_comm_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES 
      (v_comm_id, 'leads', true, true, true, false),
      (v_comm_id, 'opportunities', true, true, true, false),
      (v_comm_id, 'resources', false, true, false, false),
      (v_comm_id, 'users', false, false, false, false),
      (v_comm_id, 'roles', false, false, false, false)
    ON CONFLICT (role_id, resource) DO NOTHING;
  END IF;
END $$;

-- RLS for roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "roles_insert" ON public.roles;
CREATE POLICY "roles_insert" ON public.roles FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

DROP POLICY IF EXISTS "roles_update" ON public.roles;
CREATE POLICY "roles_update" ON public.roles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

DROP POLICY IF EXISTS "roles_delete" ON public.roles;
CREATE POLICY "roles_delete" ON public.roles FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

-- RLS for role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_permissions_insert" ON public.role_permissions;
CREATE POLICY "role_permissions_insert" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

DROP POLICY IF EXISTS "role_permissions_update" ON public.role_permissions;
CREATE POLICY "role_permissions_update" ON public.role_permissions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

DROP POLICY IF EXISTS "role_permissions_delete" ON public.role_permissions;
CREATE POLICY "role_permissions_delete" ON public.role_permissions FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

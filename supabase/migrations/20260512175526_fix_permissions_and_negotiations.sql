DO $$
BEGIN
  INSERT INTO public.roles (name, description, is_system)
  VALUES 
    ('ADMIN', 'Administrador do Sistema', true),
    ('COMMERCIAL', 'Equipe Comercial', true)
  ON CONFLICT (name) DO NOTHING;
END $$;

DO $$
DECLARE
  v_role record;
  v_resource text;
  v_resources text[] := ARRAY['leads', 'opportunities', 'price-table', 'onboarding', 'resources'];
BEGIN
  FOR v_role IN SELECT id, name FROM public.roles
  LOOP
    FOREACH v_resource IN ARRAY v_resources
    LOOP
      INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
      VALUES (v_role.id, v_resource, true, true, true, v_role.name = 'ADMIN')
      ON CONFLICT (role_id, resource) DO UPDATE 
      SET can_read = true, can_create = true, can_update = true;
    END LOOP;
  END LOOP;
END $$;

CREATE OR REPLACE VIEW public.negotiations AS
SELECT * FROM public.opportunities;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.negotiations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negotiations TO service_role;

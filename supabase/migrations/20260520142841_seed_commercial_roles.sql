DO $$
DECLARE
  commercial_role_id uuid;
  admin_role_id uuid;
  new_user_id uuid;
BEGIN
  -- 1. Create essential roles
  INSERT INTO public.roles (name, description, is_system)
  VALUES ('COMMERCIAL', 'Commercial User', true)
  ON CONFLICT (name) DO UPDATE SET is_system = true
  RETURNING id INTO commercial_role_id;

  IF commercial_role_id IS NULL THEN
    SELECT id INTO commercial_role_id FROM public.roles WHERE name = 'COMMERCIAL';
  END IF;

  INSERT INTO public.roles (name, description, is_system)
  VALUES ('ADMIN', 'Administrator', true)
  ON CONFLICT (name) DO UPDATE SET is_system = true
  RETURNING id INTO admin_role_id;

  IF admin_role_id IS NULL THEN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'ADMIN';
  END IF;

  -- 2. Define standard permissions for the COMMERCIAL role
  INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
  VALUES
    (commercial_role_id, 'leads', true, true, true, false),
    (commercial_role_id, 'opportunities', true, true, true, false),
    (commercial_role_id, 'customers', true, true, true, false),
    (commercial_role_id, 'products', false, true, false, false),
    (commercial_role_id, 'resources', false, true, false, false),
    (commercial_role_id, 'onboarding', true, true, true, false)
  ON CONFLICT (role_id, resource) DO UPDATE
  SET 
    can_read = true, 
    can_create = EXCLUDED.can_create, 
    can_update = EXCLUDED.can_update;

  -- 3. Ensure profiles role casing consistency for COMMERCIAL users
  UPDATE public.profiles 
  SET role = 'COMMERCIAL' 
  WHERE role ILIKE 'commercial' AND role != 'COMMERCIAL';

  -- 4. Seed initial Admin User (diretor@sato7.com.br)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'diretor@sato7.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'diretor@sato7.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Diretor", "role": "ADMIN"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- 5. Seed initial Commercial User for testing
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'comercial@sato7.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'comercial@sato7.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Comercial", "role": "COMMERCIAL"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

END $$;

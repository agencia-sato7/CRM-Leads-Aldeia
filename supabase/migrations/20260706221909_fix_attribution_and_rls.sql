CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'diretor@sato7.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000',
      'diretor@sato7.com.br', crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Diretor", "role": "ADMIN"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (v_user_id, 'diretor@sato7.com.br', 'Diretor', 'ADMIN')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.profiles SET role = 'ADMIN'
    WHERE email = 'diretor@sato7.com.br' AND COALESCE(role, '') != 'ADMIN';
  END IF;
END $$;

DO $$
DECLARE
  v_kika_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(TRIM(unaccent(name))) = 'kika') THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kika@sato7.com.br') THEN
      v_kika_id := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud,
        confirmation_token, recovery_token, email_change_token_new,
        email_change, email_change_token_current,
        phone, phone_change, phone_change_token, reauthentication_token
      ) VALUES (
        v_kika_id, '00000000-0000-0000-0000-000000000000',
        'kika@sato7.com.br', crypt('Skip@Pass', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Kika", "role": "COMMERCIAL"}',
        false, 'authenticated', 'authenticated',
        '', '', '', '', '',
        NULL, '', '', ''
      );
      INSERT INTO public.profiles (id, email, name, role)
      VALUES (v_kika_id, 'kika@sato7.com.br', 'Kika', 'COMMERCIAL')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.find_profile_by_name(search_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id UUID;
  normalized_search TEXT;
BEGIN
  normalized_search := LOWER(TRIM(unaccent(COALESCE(search_name, ''))));
  IF normalized_search = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO result_id
  FROM public.profiles
  WHERE LOWER(TRIM(unaccent(COALESCE(name, '')))) = normalized_search
  LIMIT 1;

  IF result_id IS NOT NULL THEN
    RETURN result_id;
  END IF;

  SELECT id INTO result_id
  FROM public.profiles
  WHERE LOWER(TRIM(unaccent(COALESCE(name, '')))) LIKE '%' || normalized_search || '%'
     OR normalized_search LIKE '%' || LOWER(TRIM(unaccent(COALESCE(name, '')))) || '%'
  LIMIT 1;

  IF result_id IS NOT NULL THEN
    RETURN result_id;
  END IF;

  SELECT id INTO result_id
  FROM public.profiles
  WHERE SPLIT_PART(LOWER(TRIM(unaccent(COALESCE(name, '')))), ' ', 1) = SPLIT_PART(normalized_search, ' ', 1)
    AND LENGTH(SPLIT_PART(normalized_search, ' ', 1)) >= 3
  LIMIT 1;

  RETURN result_id;
END;
$$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.leads;
CREATE POLICY "Enable read access for authenticated users" ON public.leads
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "leads_update" ON public.leads;
CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    OR user_id = auth.uid()
    OR user_id IS NULL
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

UPDATE public.leads
SET user_id = NULL
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'diretor@sato7.com.br' LIMIT 1)
  AND origin = 'Planilha';

UPDATE public.role_permissions
SET can_read = true
WHERE resource = 'leads' AND can_read = false;

INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
SELECT r.id, 'leads', true, true, true, false
FROM public.roles r
WHERE r.name = 'COMMERCIAL'
ON CONFLICT (role_id, resource) DO NOTHING;

INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
SELECT r.id, 'leads', true, true, true, true
FROM public.roles r
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, resource) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_email text,
  new_password text,
  new_name text,
  new_role text,
  new_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $function$
DECLARE
  is_admin boolean;
  new_user_id uuid;
BEGIN
  -- Verifica se o usuário atual é ADMIN
  SELECT (role = 'ADMIN') INTO is_admin FROM public.profiles WHERE id = auth.uid();
  
  IF is_admin IS NULL OR NOT is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado: apenas administradores podem criar usuários.');
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'E-mail já está em uso.');
  END IF;

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
    new_email,
    extensions.crypt(new_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', new_name, 'role', new_role),
    false, 'authenticated', 'authenticated',
    '', '', '', '', '',
    NULL, '', '', ''
  );

  -- Atualiza o perfil criado pela trigger para incluir telefone se fornecido
  IF new_phone IS NOT NULL AND new_phone <> '' THEN
    UPDATE public.profiles SET phone = new_phone WHERE id = new_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(
  user_id_to_update uuid,
  new_email text DEFAULT NULL,
  new_password text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $function$
DECLARE
  is_admin boolean;
BEGIN
  -- Verifica se o usuário atual é ADMIN
  SELECT (role = 'ADMIN') INTO is_admin FROM public.profiles WHERE id = auth.uid();
  
  IF is_admin IS NULL OR NOT is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado: apenas administradores podem alterar credenciais.');
  END IF;

  -- Atualiza o e-mail, se fornecido
  IF new_email IS NOT NULL AND new_email <> '' THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email AND id <> user_id_to_update) THEN
      RETURN jsonb_build_object('success', false, 'error', 'E-mail já está em uso por outro usuário.');
    END IF;
    
    UPDATE auth.users 
    SET email = new_email, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
    WHERE id = user_id_to_update;
    
    UPDATE public.profiles 
    SET email = new_email 
    WHERE id = user_id_to_update;
  END IF;

  -- Atualiza a senha, se fornecida
  IF new_password IS NOT NULL AND new_password <> '' THEN
    UPDATE auth.users 
    SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
    WHERE id = user_id_to_update;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;

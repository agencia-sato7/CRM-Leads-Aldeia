-- Ensure unaccent extension is available for accent-insensitive matching
CREATE EXTENSION IF NOT EXISTS unaccent;

-- IMMUTABLE wrapper around unaccent (safe for indexing).
-- The built-in unaccent(text) is STABLE (depends on text-search dictionary
-- config), so it cannot be used directly in a CREATE INDEX expression. This
-- SQL wrapper is marked IMMUTABLE, which is the standard accepted workaround
-- (safe as long as the unaccent dictionary does not change at runtime).
CREATE OR REPLACE FUNCTION public.f_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT public.unaccent($1);
$$;

-- Create improved index for accent-insensitive name lookups using the
-- IMMUTABLE wrapper so PostgreSQL accepts it in the index expression.
CREATE INDEX IF NOT EXISTS profiles_name_unaccent_lower_idx
  ON public.profiles (LOWER(TRIM(public.f_unaccent(name))));

-- Update find_profile_by_name to use f_unaccent + ILIKE for robust matching.
-- Uses public.f_unaccent (IMMUTABLE) so the function is index-aligned with
-- profiles_name_unaccent_lower_idx. Ensures names like "Kika" or
-- "Maria Vitoria" match correctly regardless of casing or accent formatting.
CREATE OR REPLACE FUNCTION public.find_profile_by_name(search_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result uuid;
  v_search text;
BEGIN
  v_search := LOWER(TRIM(public.f_unaccent(search_name)));

  IF v_search = '' THEN
    RETURN NULL;
  END IF;

  -- Exact match (case + accent insensitive)
  SELECT p.id INTO v_result
  FROM public.profiles p
  WHERE LOWER(TRIM(public.f_unaccent(p.name))) = v_search
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Prefix match (e.g., "Kika" matches "Kika Silva")
  SELECT p.id INTO v_result
  FROM public.profiles p
  WHERE LOWER(TRIM(public.f_unaccent(p.name))) ILIKE v_search || '%'
  ORDER BY LENGTH(p.name) ASC
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Contains match (e.g., "Maria Vitoria" matches "Maria Vitoria Santos")
  SELECT p.id INTO v_result
  FROM public.profiles p
  WHERE LOWER(TRIM(public.f_unaccent(p.name))) ILIKE '%' || v_search || '%'
    OR v_search ILIKE '%' || LOWER(TRIM(public.f_unaccent(p.name))) || '%'
  ORDER BY LENGTH(p.name) ASC
  LIMIT 1;

  RETURN v_result;
END;
$$;

-- Ensure RLS is enabled and policies allow authenticated users to
-- SELECT, INSERT, and UPDATE on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "leads_update" ON public.leads;
CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
    OR user_id = auth.uid()
    OR user_id IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

-- Ensure diretor@sato7.com.br profile exists with ADMIN role
DO $$
DECLARE
  v_user_id uuid;
  v_admin_role_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'diretor@sato7.com.br';

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (v_user_id, 'diretor@sato7.com.br', 'Diretor', 'ADMIN')
    ON CONFLICT (id) DO UPDATE
    SET role = 'ADMIN', name = 'Diretor', email = 'diretor@sato7.com.br';
  END IF;

  -- Ensure ADMIN role exists in roles table
  INSERT INTO public.roles (name, description, is_system)
  VALUES ('ADMIN', 'Administrator', true)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'ADMIN';

  IF v_admin_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES
      (v_admin_role_id, 'leads', true, true, true, true),
      (v_admin_role_id, 'opportunities', true, true, true, true),
      (v_admin_role_id, 'customers', true, true, true, true),
      (v_admin_role_id, 'onboarding', true, true, true, true)
    ON CONFLICT (role_id, resource) DO UPDATE
    SET can_create = true, can_read = true, can_update = true, can_delete = true;
  END IF;
END $$;

-- Data reconciliation: Reset leads incorrectly assigned to ADMIN users to NULL
-- The sync-external-spreadsheet edge function will reassign them to the
-- correct responsible team member based on the CSV "Responsável" column
-- using the updated find_profile_by_name function with f_unaccent + ILIKE
UPDATE public.leads
SET user_id = NULL
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'ADMIN'
);

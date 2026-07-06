-- Migration: Enhanced lead ownership correction with accent-insensitive matching
-- Improves on 20260706214249 by using unaccent() for more robust name matching
-- All statements are idempotent (safe to run multiple times).

CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
DECLARE
  admin_user_id UUID;
  v_count INTEGER;
BEGIN
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE email = 'diretor@sato7.com.br'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user not found, skipping ownership fix';
    RETURN;
  END IF;

  -- Unassign any remaining leads incorrectly assigned to admin from spreadsheet sync
  -- that were not caught by the previous migration
  UPDATE public.leads
  SET user_id = NULL
  WHERE user_id = admin_user_id
    AND origin = 'Planilha';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Unassigned % leads previously assigned to admin from spreadsheet sync', v_count;
END $$;

-- Apply known mappings using accent-insensitive matching (unaccent)
-- Each UPDATE is idempotent: WHERE user_id IS NULL avoids overwriting existing assignments

-- Mapping: "Maria Vitoria De Azevedo" (or "Maria Vitória De Azevedo") -> "Kika"
UPDATE public.leads
SET user_id = (
  SELECT id FROM public.profiles
  WHERE LOWER(TRIM(unaccent(name))) = 'kika'
  LIMIT 1
)
WHERE LOWER(TRIM(unaccent(contact))) = 'maria vitoria de azevedo'
  AND user_id IS NULL;

-- Additional known mappings can be added here following the same pattern:
-- UPDATE public.leads
-- SET user_id = (
--   SELECT id FROM public.profiles
--   WHERE LOWER(TRIM(unaccent(name))) = 'profile_name'
--   LIMIT 1
-- )
-- WHERE LOWER(TRIM(unaccent(contact))) = 'contact_name'
--   AND user_id IS NULL;

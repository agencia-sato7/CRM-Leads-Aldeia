-- Migration: Fix lead ownership from spreadsheet sync
-- Unassigns leads incorrectly assigned to admin from spreadsheet sync
-- and applies known mappings from spreadsheet responsible names to profile IDs.
-- All statements are idempotent (safe to run multiple times).

DO $$
DECLARE
  admin_user_id UUID;
  v_count INTEGER;
BEGIN
  -- Get the admin user ID (diretor@sato7.com.br)
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE email = 'diretor@sato7.com.br'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user not found, skipping ownership fix';
    RETURN;
  END IF;

  -- Step 1: Unassign leads from spreadsheet sync that were incorrectly assigned to admin.
  -- These will be re-assigned correctly on the next sync run with the improved matching logic.
  UPDATE public.leads
  SET user_id = NULL
  WHERE user_id = admin_user_id
    AND origin = 'Planilha';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Unassigned % leads previously assigned to admin from spreadsheet sync', v_count;
END $$;

-- Step 2: Apply known mappings from spreadsheet contact names to responsible profile IDs.
-- Each UPDATE is idempotent: the WHERE clause includes user_id IS NULL to avoid
-- overwriting assignments already made by the sync or a previous migration run.

-- Mapping: "Maria Vitoria De Azevedo" -> "Kika"
UPDATE public.leads
SET user_id = (
  SELECT id FROM public.profiles
  WHERE LOWER(TRIM(name)) = 'kika'
  LIMIT 1
)
WHERE LOWER(TRIM(contact)) = 'maria vitoria de azevedo'
  AND user_id IS NULL;

-- Additional mappings can be added here following the same pattern:
-- UPDATE public.leads
-- SET user_id = (SELECT id FROM public.profiles WHERE LOWER(TRIM(name)) = 'responsible_name' LIMIT 1)
-- WHERE LOWER(TRIM(contact)) = 'contact_name' AND user_id IS NULL;

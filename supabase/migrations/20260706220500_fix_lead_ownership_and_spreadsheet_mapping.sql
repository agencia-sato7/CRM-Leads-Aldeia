-- Migration: Fix lead ownership and map spreadsheet names correctly
-- Ensures leads incorrectly assigned to admin are unassigned
-- and maps specific known leads based on spreadsheet matching logic.

CREATE EXTENSION IF NOT EXISTS unaccent;

DO $DO$
DECLARE
  admin_user_id UUID;
  v_count INTEGER;
BEGIN
  -- 1. Find the Admin User ID
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE email = 'diretor@sato7.com.br'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- 2. Retroactive Cleanup: Unassign leads that were defaulted to Admin during sync
    UPDATE public.leads
    SET user_id = NULL
    WHERE user_id = admin_user_id
      AND origin = 'Planilha';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Unassigned % leads previously incorrectly assigned to admin', v_count;
  END IF;

  -- 3. Specific reassignment based on known spreadsheet mappings
  -- Example: "Maria Vitoria De Azevedo" should be mapped to "Kika"
  UPDATE public.leads
  SET user_id = (
    SELECT id FROM public.profiles
    WHERE LOWER(TRIM(unaccent(name))) = 'kika'
    LIMIT 1
  )
  WHERE LOWER(TRIM(unaccent(contact))) = LOWER(TRIM(unaccent('Maria Vitoria De Azevedo')))
    AND user_id IS NULL;

END $DO$;

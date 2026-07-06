CREATE EXTENSION IF NOT EXISTS unaccent;

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
    RAISE NOTICE 'Admin user not found, skipping ownership cleanup';
    RETURN;
  END IF;

  UPDATE public.leads
  SET user_id = NULL
  WHERE user_id = admin_user_id
    AND origin = 'Planilha';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Unassigned % leads assigned to admin from spreadsheet sync', v_count;

  UPDATE public.leads
  SET user_id = NULL
  WHERE user_id = admin_user_id
    AND origin != 'Manual';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Unassigned % additional non-manual leads assigned to admin', v_count;
END $$;

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE email = 'diretor@sato7.com.br'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, metadata)
    SELECT
      admin_user_id,
      'UPDATE',
      'leads',
      NULL,
      jsonb_build_object(
        'source', 'migration',
        'event', 'lead_attribution_cleanup',
        'description', 'Unassigned leads incorrectly defaulted to admin during spreadsheet sync. Re-run sync-external-spreadsheet to re-attribute correctly.',
        'timestamp', NOW()
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.audit_logs
      WHERE metadata->>'event' = 'lead_attribution_cleanup'
        AND metadata->>'source' = 'migration'
    );
  END IF;
END $$;

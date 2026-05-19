DO $$
BEGIN
  -- Add quantity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN quantity numeric DEFAULT 1;
  END IF;

  -- Drop obsolete marketing columns if they exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name = 'invests_in_mkt'
  ) THEN
    ALTER TABLE public.leads DROP COLUMN invests_in_mkt;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name = 'has_agency'
  ) THEN
    ALTER TABLE public.leads DROP COLUMN has_agency;
  END IF;
END $$;

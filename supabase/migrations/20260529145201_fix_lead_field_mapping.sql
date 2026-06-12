DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name = 'mapping_fixed'
  ) THEN
    -- Add a flag to ensure this swap is idempotent
    ALTER TABLE public.leads ADD COLUMN mapping_fixed BOOLEAN DEFAULT TRUE;
    
    -- Swap the data between notes and objectives to fix the previous UI mapping bug
    UPDATE public.leads
    SET
      notes = objectives,
      objectives = notes
    WHERE notes IS DISTINCT FROM objectives;
  END IF;
END $$;

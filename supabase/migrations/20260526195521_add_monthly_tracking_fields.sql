DO $$
BEGIN
  -- Add responded column to leads
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS responded BOOLEAN DEFAULT false;

  -- Add closed_date and amount_paid to opportunities
  ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS closed_date TIMESTAMPTZ;
  ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
END $$;

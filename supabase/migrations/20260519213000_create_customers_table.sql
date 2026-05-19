CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cnpj TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_lead_id_key'
  ) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_lead_id_key UNIQUE (lead_id);
  END IF;
END $$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;
CREATE POLICY "customers_admin_all" ON public.customers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "customers_commercial_select" ON public.customers;
CREATE POLICY "customers_commercial_select" ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "customers_commercial_update" ON public.customers;
CREATE POLICY "customers_commercial_update" ON public.customers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "customers_commercial_insert" ON public.customers;
CREATE POLICY "customers_commercial_insert" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "customers_commercial_delete" ON public.customers;
CREATE POLICY "customers_commercial_delete" ON public.customers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

CREATE OR REPLACE FUNCTION public.handle_opportunity_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead record;
BEGIN
  IF NEW.status = 'Ganha' AND (TG_OP = 'INSERT' OR OLD.status != 'Ganha') THEN
    UPDATE public.leads
    SET status = 'Ganho'
    WHERE id = NEW.lead_id AND status != 'Ganho';
    
    -- Sync with customers table automatically
    SELECT * INTO v_lead FROM public.leads WHERE id = NEW.lead_id;
    
    IF FOUND THEN
      INSERT INTO public.customers (lead_id, user_id, name, company, email, phone, cnpj)
      VALUES (v_lead.id, v_lead.user_id, v_lead.contact, v_lead.company, v_lead.email, v_lead.phone, v_lead.cnpj)
      ON CONFLICT (lead_id) DO NOTHING;
    END IF;
  ELSIF NEW.status = 'Perdida' AND (TG_OP = 'INSERT' OR OLD.status != 'Perdida') THEN
    UPDATE public.leads
    SET status = 'Perdido'
    WHERE id = NEW.lead_id AND status != 'Perdido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_opportunity_status_change ON public.opportunities;
CREATE TRIGGER on_opportunity_status_change
  AFTER INSERT OR UPDATE OF status ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_opportunity_status_change();

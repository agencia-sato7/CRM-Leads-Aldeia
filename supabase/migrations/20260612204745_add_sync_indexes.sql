DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);
  CREATE INDEX IF NOT EXISTS leads_cnpj_idx ON public.leads (cnpj);
  CREATE INDEX IF NOT EXISTS leads_company_idx ON public.leads (company);
END $$;

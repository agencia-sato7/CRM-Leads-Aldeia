CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS trigger AS $$
BEGIN
  -- Cria uma oportunidade automaticamente se o lead for movido para "Em Negociação"
  IF NEW.status = 'Em Negociação' AND (TG_OP = 'INSERT' OR OLD.status != 'Em Negociação') THEN
    IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status)
      VALUES (NEW.id, NEW.user_id, 'Fee Mensal', 'Não especificado', 0, 'Aberta');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
CREATE TRIGGER on_lead_status_change
  AFTER INSERT OR UPDATE OF status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_status_change();

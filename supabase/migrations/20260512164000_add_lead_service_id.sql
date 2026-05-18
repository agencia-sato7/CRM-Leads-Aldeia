ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
 RETURNS trigger
 AS $$
DECLARE
  v_service_name text := 'Não especificado';
BEGIN
  -- Cria uma oportunidade automaticamente se o lead for movido para "Em Negociação"
  IF NEW.status = 'Em Negociação' AND (TG_OP = 'INSERT' OR OLD.status != 'Em Negociação') THEN
    IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
      
      IF NEW.service_id IS NOT NULL THEN
        SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;
      END IF;

      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status)
      VALUES (NEW.id, NEW.user_id, 'Fee Mensal', COALESCE(v_service_name, 'Não especificado'), 0, 'Aberta');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

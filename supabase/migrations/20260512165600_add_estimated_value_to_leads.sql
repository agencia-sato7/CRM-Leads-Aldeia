ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimated_value numeric DEFAULT 0;

CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_service_name text := 'Não especificado';
  v_service_value numeric := 0;
BEGIN
  -- Cria uma oportunidade automaticamente se o lead for movido para "Em Negociação"
  IF NEW.status = 'Em Negociação' AND (TG_OP = 'INSERT' OR OLD.status != 'Em Negociação') THEN
    IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
      
      IF NEW.service_id IS NOT NULL THEN
        SELECT name, min_price INTO v_service_name, v_service_value FROM public.services WHERE id = NEW.service_id;
      END IF;

      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status)
      VALUES (
        NEW.id, 
        NEW.user_id, 
        'Fee Mensal', 
        COALESCE(v_service_name, 'Não especificado'), 
        COALESCE(NULLIF(NEW.estimated_value, 0), v_service_value, 0), 
        'Aberta'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

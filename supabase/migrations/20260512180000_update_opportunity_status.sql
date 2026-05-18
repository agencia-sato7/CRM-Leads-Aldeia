-- Update opportunity default status in the handle_lead_status_change trigger
CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_service_name text := 'Não especificado';
  v_service_value numeric := 0;
BEGIN
  IF NEW.status = 'Em Negociação' AND (TG_OP = 'INSERT' OR OLD.status != 'Em Negociação') THEN
    IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
      
      IF NEW.service_id IS NOT NULL THEN
        SELECT name, base_value INTO v_service_name, v_service_value FROM public.services WHERE id = NEW.service_id;
      END IF;

      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status)
      VALUES (
        NEW.id, 
        NEW.user_id, 
        'Fee Mensal', 
        COALESCE(v_service_name, 'Não especificado'), 
        COALESCE(NULLIF(NEW.estimated_value, 0), v_service_value, 0), 
        'Aguardando'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to sync opportunity status back to lead
CREATE OR REPLACE FUNCTION public.handle_opportunity_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status = 'Ganha' AND OLD.status != 'Ganha' THEN
    UPDATE public.leads SET status = 'Ganho' WHERE id = NEW.lead_id;
  ELSIF NEW.status = 'Perdida' AND OLD.status != 'Perdida' THEN
    UPDATE public.leads SET status = 'Perdido' WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_opportunity_status_change ON public.opportunities;

CREATE TRIGGER on_opportunity_status_change
  AFTER UPDATE OF status ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_opportunity_status_change();

ALTER TABLE IF EXISTS public.opportunities ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 1;

CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_service_name TEXT := 'Não especificado';
BEGIN
  -- Tenta pegar o nome do produto se existir
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO v_service_name FROM public.products WHERE id = NEW.product_id;
  END IF;

  -- Cria uma oportunidade automaticamente se o lead for movido para "Em Negociação"
  IF NEW.status = 'Em Negociação' AND (TG_OP = 'INSERT' OR OLD.status != 'Em Negociação') THEN
    IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, quantity)
      VALUES (NEW.id, NEW.user_id, 'Fee Mensal', COALESCE(v_service_name, 'Não especificado'), COALESCE(NEW.estimated_value, 0), 'Aberta', COALESCE(NEW.quantity, 1));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_opportunities_updated_at ON public.opportunities;

CREATE TRIGGER set_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.value IS DISTINCT FROM NEW.value)
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0;

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
      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status)
      VALUES (NEW.id, NEW.user_id, 'Fee Mensal', COALESCE(v_service_name, 'Não especificado'), COALESCE(NEW.estimated_value, 0), 'Aberta');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

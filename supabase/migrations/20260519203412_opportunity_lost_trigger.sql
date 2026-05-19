CREATE OR REPLACE FUNCTION public.handle_opportunity_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'Ganha' AND (TG_OP = 'INSERT' OR OLD.status != 'Ganha') THEN
    UPDATE public.leads
    SET status = 'Ganho'
    WHERE id = NEW.lead_id AND status != 'Ganho';
  ELSIF NEW.status = 'Perdida' AND (TG_OP = 'INSERT' OR OLD.status != 'Perdida') THEN
    UPDATE public.leads
    SET status = 'Perdido'
    WHERE id = NEW.lead_id AND status != 'Perdido';
  END IF;
  RETURN NEW;
END;
$$;

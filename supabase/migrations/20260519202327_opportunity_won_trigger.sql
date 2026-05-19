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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_opportunity_status_change ON public.opportunities;
CREATE TRIGGER on_opportunity_status_change
  AFTER INSERT OR UPDATE OF status ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_opportunity_status_change();

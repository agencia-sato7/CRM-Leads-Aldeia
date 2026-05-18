CREATE OR REPLACE FUNCTION public.check_lead_meeting_before_advance()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('Qualificado', 'Em Negociação', 'Ganho') THEN
    IF (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
      IF NOT EXISTS (SELECT 1 FROM public.meetings WHERE lead_id = NEW.id) THEN
        RAISE EXCEPTION 'É necessário ter pelo menos uma reunião concluída para avançar o lead para esta etapa.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_meeting_before_advance_trigger ON public.leads;
CREATE TRIGGER enforce_meeting_before_advance_trigger
  BEFORE UPDATE OF status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.check_lead_meeting_before_advance();

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

  IF NEW.status IN ('Em Negociação', 'Ganho') THEN
    IF (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
      IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE lead_id = NEW.id) THEN
        RAISE EXCEPTION 'É necessário criar uma oportunidade para avançar o lead para esta etapa.';
      END IF;
    END IF;
  END IF;

  IF OLD.status = 'Em Negociação' AND NEW.status IN ('Ganho', 'Perdido') THEN
    IF EXISTS (
      SELECT 1 FROM public.opportunities 
      WHERE lead_id = NEW.id AND status NOT IN ('Ganha', 'Perdida')
    ) THEN
      RAISE EXCEPTION 'Não é possível avançar o status do lead para Ganho ou Perdido enquanto a oportunidade não for Ganha ou Perdida.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Removemos a trigger de auto-criação pois a governança agora exige criação manual prévia
DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
DROP FUNCTION IF EXISTS public.handle_lead_status_change();

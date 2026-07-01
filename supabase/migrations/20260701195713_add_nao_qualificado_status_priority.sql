CREATE OR REPLACE FUNCTION public.sync_lead_status_priority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.status_priority := CASE
    WHEN NEW.status = 'Novo' THEN 1
    WHEN NEW.status = 'Qualificado' THEN 2
    WHEN NEW.status = 'Em Negociação' THEN 3
    WHEN NEW.status = 'Ganho' THEN 4
    WHEN NEW.status = 'Perdido' THEN 5
    WHEN NEW.status = 'Não Qualificado' THEN 6
    ELSE COALESCE(NEW.status_priority, 1)
  END;
  RETURN NEW;
END;
$$;

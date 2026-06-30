CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_entity_id UUID;
  v_metadata JSONB;
BEGIN
  v_action := TG_OP;
  v_entity_id := CASE
    WHEN v_action = 'DELETE' THEN OLD.id
    ELSE NEW.id
  END;

  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF v_user_id IS NULL AND v_action IN ('INSERT', 'UPDATE') THEN
    v_user_id := COALESCE(
      (NEW).user_id,
      (SELECT user_id FROM public.leads WHERE id = v_entity_id LIMIT 1)
    );
  END IF;

  IF v_action = 'INSERT' THEN
    v_metadata := jsonb_build_object(
      'after', to_jsonb(NEW)
    );
  ELSIF v_action = 'UPDATE' THEN
    v_metadata := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after', to_jsonb(NEW)
    );
  ELSIF v_action = 'DELETE' THEN
    v_metadata := jsonb_build_object(
      'before', to_jsonb(OLD)
    );
  END IF;

  INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_user_id, v_action, TG_TABLE_NAME, v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_leads_insert ON public.leads;
DROP TRIGGER IF EXISTS trg_audit_leads_update ON public.leads;
DROP TRIGGER IF EXISTS trg_audit_leads_delete ON public.leads;
DROP TRIGGER IF EXISTS trg_audit_meetings_insert ON public.meetings;
DROP TRIGGER IF EXISTS trg_audit_meetings_update ON public.meetings;
DROP TRIGGER IF EXISTS trg_audit_meetings_delete ON public.meetings;

CREATE TRIGGER trg_audit_leads_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

CREATE TRIGGER trg_audit_leads_update
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

CREATE TRIGGER trg_audit_meetings_insert
  AFTER INSERT ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

CREATE TRIGGER trg_audit_meetings_update
  AFTER UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

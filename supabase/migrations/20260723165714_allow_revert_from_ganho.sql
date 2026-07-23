-- Allow reverting leads from "Ganho" to any other status
-- Updates transition_lead_stage RPC to handle opportunity deletion,
-- closed_date clearing, and customer preservation when reverting.

CREATE OR REPLACE FUNCTION public.transition_lead_stage(
  p_lead_id UUID,
  p_new_status TEXT,
  p_source TEXT DEFAULT 'manual',
  p_closed_date TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_user_role TEXT;
  v_user_id UUID;
  v_previous_status TEXT;
  v_closed_date TIMESTAMPTZ;
  v_opp_status TEXT;
  v_previous_opp_status TEXT;
  v_new_opp_status TEXT;
  v_existing_opp RECORD;
  v_has_opp BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: user profile not found';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Permission check: admin or owner or unassigned lead
  IF v_user_role != 'ADMIN' AND v_lead.user_id IS NOT NULL AND v_lead.user_id != v_user_id THEN
    RAISE EXCEPTION 'Forbidden: insufficient permissions';
  END IF;

  v_previous_status := v_lead.status;

  -- Determine opportunity status mapping
  v_opp_status := CASE p_new_status
    WHEN 'Ganho' THEN 'Ganha'
    WHEN 'Perdido' THEN 'Perdida'
    WHEN 'Em Negociação' THEN 'Aberta'
    ELSE NULL
  END;

  -- Determine closed_date: only set for terminal statuses
  IF p_new_status IN ('Ganho', 'Perdido') THEN
    v_closed_date := COALESCE(p_closed_date, NOW());
  ELSE
    v_closed_date := NULL;
  END IF;

  -- Get existing opportunity BEFORE update (for previous status audit)
  SELECT * INTO v_existing_opp FROM public.opportunities WHERE lead_id = p_lead_id LIMIT 1;
  v_has_opp := FOUND;
  v_previous_opp_status := v_existing_opp.status;

  -- Update lead status (this fires the handle_lead_status_change trigger)
  IF v_user_role != 'ADMIN' AND v_lead.user_id IS NULL THEN
    UPDATE public.leads
    SET status = p_new_status, user_id = v_user_id
    WHERE id = p_lead_id;
  ELSE
    UPDATE public.leads
    SET status = p_new_status
    WHERE id = p_lead_id;
  END IF;

  -- Re-query opportunity AFTER trigger may have modified it
  SELECT * INTO v_existing_opp FROM public.opportunities WHERE lead_id = p_lead_id LIMIT 1;
  v_has_opp := FOUND;

  -- Handle opportunity based on new status
  IF v_opp_status IS NOT NULL THEN
    -- Need an opportunity: create or update
    IF v_has_opp THEN
      UPDATE public.opportunities
      SET status = v_opp_status,
          closed_date = v_closed_date,
          updated_at = NOW()
      WHERE id = v_existing_opp.id;
    ELSE
      INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, closed_date, quantity)
      VALUES (
        p_lead_id,
        COALESCE(v_lead.user_id, v_user_id),
        'Fee Mensal',
        'Não especificado',
        COALESCE(v_lead.estimated_value, 0),
        v_opp_status,
        v_closed_date,
        COALESCE(v_lead.quantity, 1)
      );
    END IF;
    v_new_opp_status := v_opp_status;
  ELSE
    -- Moving to Novo, Qualificado, or Não Qualificado: delete opportunity if exists
    -- Safe because a new opportunity will be created if lead re-enters negotiation
    IF v_has_opp THEN
      DELETE FROM public.opportunities WHERE lead_id = p_lead_id;
    END IF;
    v_new_opp_status := NULL;
  END IF;

  -- Customer record preservation: do NOT delete customer when reverting from Ganho
  -- The customer remains in the system with lead_id reference intact

  -- Audit log with detailed transition metadata
  INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (
    v_user_id,
    'status_change',
    'lead',
    p_lead_id,
    jsonb_build_object(
      'source', p_source,
      'from', v_previous_status,
      'to', p_new_status,
      'previous_opportunity_status', v_previous_opp_status,
      'new_opportunity_status', v_new_opp_status,
      'closed_date', v_closed_date
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', p_lead_id,
    'previous_status', v_previous_status,
    'new_status', p_new_status,
    'previous_opportunity_status', v_previous_opp_status,
    'new_opportunity_status', v_new_opp_status,
    'closed_date', v_closed_date
  );
END;
$$;

-- Ensure check_lead_meeting_before_advance is a no-op (already done in prior migration,
-- but re-assert here for idempotency)
CREATE OR REPLACE FUNCTION public.check_lead_meeting_before_advance()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any remaining BEFORE triggers that might block transitions
DROP TRIGGER IF EXISTS enforce_meeting_before_advance ON public.leads;
DROP TRIGGER IF EXISTS check_lead_meeting_before_advance ON public.leads;
DROP TRIGGER IF EXISTS enforce_opportunity_before_negotiation ON public.leads;
DROP TRIGGER IF EXISTS before_lead_status_change ON public.leads;
DROP TRIGGER IF EXISTS trg_check_lead_meeting ON public.leads;
DROP TRIGGER IF EXISTS trg_enforce_meeting ON public.leads;
DROP TRIGGER IF EXISTS trg_enforce_opp_before_negotiation ON public.leads;

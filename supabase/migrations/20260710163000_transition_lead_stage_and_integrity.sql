-- =====================================================
-- 1. transition_lead_stage RPC
-- =====================================================
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
  v_existing_opp RECORD;
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

  v_opp_status := CASE p_new_status
    WHEN 'Ganho' THEN 'Ganha'
    WHEN 'Perdido' THEN 'Perdida'
    WHEN 'Em Negociação' THEN 'Aberta'
    ELSE NULL
  END;

  IF p_new_status IN ('Ganho', 'Perdido') THEN
    v_closed_date := COALESCE(p_closed_date, NOW());
  ELSE
    v_closed_date := NULL;
  END IF;

  -- Assign commercial user if lead was unassigned
  IF v_user_role != 'ADMIN' AND v_lead.user_id IS NULL THEN
    UPDATE public.leads
    SET status = p_new_status, user_id = v_user_id
    WHERE id = p_lead_id;
  ELSE
    UPDATE public.leads
    SET status = p_new_status
    WHERE id = p_lead_id;
  END IF;

  -- Sync opportunity
  IF v_opp_status IS NOT NULL THEN
    SELECT * INTO v_existing_opp FROM public.opportunities WHERE lead_id = p_lead_id LIMIT 1;

    IF FOUND THEN
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
        COALESCE(NULL, 'Não especificado'),
        COALESCE(v_lead.estimated_value, 0),
        v_opp_status,
        v_closed_date,
        COALESCE(v_lead.quantity, 1)
      );
    END IF;
  END IF;

  -- Create customer when won
  IF p_new_status = 'Ganho' THEN
    INSERT INTO public.customers (lead_id, user_id, name, company, email, phone, cnpj)
    VALUES (v_lead.id, COALESCE(v_lead.user_id, v_user_id), v_lead.contact, v_lead.company, v_lead.email, v_lead.phone, v_lead.cnpj)
    ON CONFLICT (lead_id) DO NOTHING;
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_user_id, 'UPDATE', 'leads', p_lead_id, jsonb_build_object(
    'source', p_source,
    'transition', true,
    'previous_status', v_previous_status,
    'new_status', p_new_status,
    'closed_date', v_closed_date,
    'opportunity_status', v_opp_status
  ));

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', p_lead_id,
    'previous_status', v_previous_status,
    'new_status', p_new_status,
    'opportunity_status', v_opp_status,
    'closed_date', v_closed_date
  );
END;
$$;

-- =====================================================
-- 2. Update handle_lead_status_change trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opp_status TEXT;
  v_closed_date TIMESTAMPTZ;
  v_existing_opp RECORD;
BEGIN
  v_opp_status := CASE NEW.status
    WHEN 'Ganho' THEN 'Ganha'
    WHEN 'Perdido' THEN 'Perdida'
    WHEN 'Em Negociação' THEN 'Aberta'
    ELSE NULL
  END;

  IF v_opp_status IS NULL THEN
    RETURN NEW;
  END IF;

  v_closed_date := CASE
    WHEN NEW.status IN ('Ganho', 'Perdido') THEN NOW()
    ELSE NULL
  END;

  SELECT * INTO v_existing_opp FROM public.opportunities WHERE lead_id = NEW.id LIMIT 1;

  IF FOUND THEN
    UPDATE public.opportunities
    SET status = v_opp_status,
        closed_date = v_closed_date,
        updated_at = NOW()
    WHERE id = v_existing_opp.id;
  ELSE
    INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, closed_date, quantity)
    VALUES (NEW.id, NEW.user_id, 'Fee Mensal', 'Não especificado', COALESCE(NEW.estimated_value, 0), v_opp_status, v_closed_date, COALESCE(NEW.quantity, 1));
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. Update handle_opportunity_status_change trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_opportunity_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_lead_status TEXT;
  v_closed_date TIMESTAMPTZ;
BEGIN
  v_lead_status := CASE NEW.status
    WHEN 'Ganha' THEN 'Ganho'
    WHEN 'Perdida' THEN 'Perdido'
    WHEN 'Aberta' THEN 'Em Negociação'
    WHEN 'Aguardando' THEN 'Em Negociação'
    ELSE NULL
  END;

  v_closed_date := CASE
    WHEN NEW.status IN ('Ganha', 'Perdida') THEN COALESCE(NEW.closed_date, NOW())
    ELSE NULL
  END;

  -- Set closed_date on opportunity if missing
  IF NEW.status IN ('Ganha', 'Perdida') AND NEW.closed_date IS NULL THEN
    UPDATE public.opportunities SET closed_date = v_closed_date WHERE id = NEW.id;
  END IF;

  -- Sync lead status
  IF v_lead_status IS NOT NULL THEN
    UPDATE public.leads SET status = v_lead_status WHERE id = NEW.lead_id AND status != v_lead_status;
  END IF;

  -- Create customer when won
  IF NEW.status = 'Ganha' AND (TG_OP = 'INSERT' OR OLD.status != 'Ganha') THEN
    SELECT * INTO v_lead FROM public.leads WHERE id = NEW.lead_id;
    IF FOUND THEN
      INSERT INTO public.customers (lead_id, user_id, name, company, email, phone, cnpj)
      VALUES (v_lead.id, v_lead.user_id, v_lead.contact, v_lead.company, v_lead.email, v_lead.phone, v_lead.cnpj)
      ON CONFLICT (lead_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
CREATE TRIGGER on_lead_status_change
  AFTER INSERT OR UPDATE OF status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_status_change();

DROP TRIGGER IF EXISTS on_opportunity_status_change ON public.opportunities;
CREATE TRIGGER on_opportunity_status_change
  AFTER INSERT OR UPDATE OF status ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_opportunity_status_change();

-- =====================================================
-- 4. Backfill: closed_date for won/lost opportunities
-- =====================================================
UPDATE public.opportunities
SET closed_date = updated_at
WHERE status IN ('Ganha', 'Perdida') AND closed_date IS NULL;

-- =====================================================
-- 5. Backfill: create opportunities for won leads without opps
-- =====================================================
INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, closed_date, quantity)
SELECT l.id, l.user_id, 'Fee Mensal', 'Não especificado', COALESCE(l.estimated_value, 0), 'Ganha', l.created_at, COALESCE(l.quantity, 1)
FROM public.leads l
WHERE l.status = 'Ganho'
  AND NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.lead_id = l.id);

-- =====================================================
-- 6. Backfill: create opportunities for perdido leads without opps
-- =====================================================
INSERT INTO public.opportunities (lead_id, user_id, type, service, value, status, closed_date, quantity)
SELECT l.id, l.user_id, 'Fee Mensal', 'Não especificado', COALESCE(l.estimated_value, 0), 'Perdida', l.created_at, COALESCE(l.quantity, 1)
FROM public.leads l
WHERE l.status = 'Perdido'
  AND NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.lead_id = l.id);

-- =====================================================
-- 7. Backfill: create customers for won leads without customers
-- =====================================================
INSERT INTO public.customers (lead_id, user_id, name, company, email, phone, cnpj)
SELECT l.id, l.user_id, l.contact, l.company, l.email, l.phone, l.cnpj
FROM public.leads l
WHERE l.status = 'Ganho'
  AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.lead_id = l.id)
ON CONFLICT (lead_id) DO NOTHING;

-- =====================================================
-- 8. Index for closed_date filtering
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_opportunities_closed_date ON public.opportunities(closed_date);

-- =====================================================
-- 9. Ensure COMMERCIAL role permissions exist
-- =====================================================
DO $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Ensure COMMERCIAL role exists
  INSERT INTO public.roles (name, description, is_system)
  VALUES ('COMMERCIAL', 'Role comercial padrão', true)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_role_id FROM public.roles WHERE name = 'COMMERCIAL';

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES
      (v_role_id, 'leads', true, true, true, false),
      (v_role_id, 'opportunities', true, true, true, false),
      (v_role_id, 'customers', true, true, true, false),
      (v_role_id, 'onboarding', true, true, true, false),
      (v_role_id, 'products', false, true, false, false),
      (v_role_id, 'price-table', false, true, false, false)
    ON CONFLICT (role_id, resource) DO UPDATE
    SET can_read = true, can_create = true, can_update = true;
  END IF;

  -- Also handle COMERCIAL misspelling
  INSERT INTO public.roles (name, description, is_system)
  VALUES ('COMERCIAL', 'Role comercial pt-br', true)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_role_id FROM public.roles WHERE name = 'COMERCIAL';

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES
      (v_role_id, 'leads', true, true, true, false),
      (v_role_id, 'opportunities', true, true, true, false),
      (v_role_id, 'customers', true, true, true, false),
      (v_role_id, 'onboarding', true, true, true, false),
      (v_role_id, 'products', false, true, false, false),
      (v_role_id, 'price-table', false, true, false, false)
    ON CONFLICT (role_id, resource) DO UPDATE
    SET can_read = true, can_create = true, can_update = true;
  END IF;
END $$;

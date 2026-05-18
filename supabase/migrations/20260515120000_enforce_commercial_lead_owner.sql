DO $$
BEGIN
  -- Add a trigger to enforce commercial lead owner assignment
  -- and prevent ADMINs from being owners of leads and opportunities
END $$;

CREATE OR REPLACE FUNCTION public.enforce_lead_owner_on_negotiation()
 RETURNS trigger
 AS $$
DECLARE
  v_current_user_role text;
  v_assigned_user_role text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_current_user_role FROM public.profiles WHERE id = auth.uid();

    IF NEW.status = 'Em Negociação' THEN
      IF v_current_user_role = 'COMMERCIAL' THEN
        NEW.user_id := auth.uid();
      ELSIF v_current_user_role = 'ADMIN' THEN
        IF TG_OP = 'UPDATE' AND NEW.user_id = auth.uid() THEN
          NEW.user_id := OLD.user_id;
        ELSIF TG_OP = 'INSERT' AND NEW.user_id = auth.uid() THEN
          NEW.user_id := NULL;
        END IF;
      END IF;
    END IF;
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    SELECT role INTO v_assigned_user_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_assigned_user_role = 'ADMIN' THEN
      IF TG_OP = 'UPDATE' THEN
         NEW.user_id := OLD.user_id;
      ELSE
         NEW.user_id := NULL;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_lead_owner_trigger ON public.leads;
CREATE TRIGGER enforce_lead_owner_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_lead_owner_on_negotiation();

CREATE OR REPLACE FUNCTION public.enforce_opp_owner_rule()
 RETURNS trigger
 AS $$
DECLARE
  v_assigned_user_role text;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT role INTO v_assigned_user_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_assigned_user_role = 'ADMIN' THEN
      IF TG_OP = 'UPDATE' THEN
         NEW.user_id := OLD.user_id;
      ELSE
         NEW.user_id := NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_opp_owner_trigger ON public.opportunities;
CREATE TRIGGER enforce_opp_owner_trigger
  BEFORE INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.enforce_opp_owner_rule();

CREATE OR REPLACE FUNCTION public.enforce_customer_owner_rule()
 RETURNS trigger
 AS $$
DECLARE
  v_assigned_user_role text;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT role INTO v_assigned_user_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_assigned_user_role = 'ADMIN' THEN
      IF TG_OP = 'UPDATE' THEN
         NEW.user_id := OLD.user_id;
      ELSE
         NEW.user_id := NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_customer_owner_trigger ON public.customers;
CREATE TRIGGER enforce_customer_owner_trigger
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_owner_rule();

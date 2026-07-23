-- Allow lead transition to "Ganho" from any status
-- (Novo, Não Qualificado, Qualificado, Em Negociação)
-- Remove BEFORE UPDATE triggers that enforce meeting/opportunity prerequisites

-- 1. Replace the check function to be a no-op (allows all transitions)
CREATE OR REPLACE FUNCTION public.check_lead_meeting_before_advance()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop any BEFORE triggers that might block transitions
DROP TRIGGER IF EXISTS enforce_meeting_before_advance ON public.leads;
DROP TRIGGER IF EXISTS check_lead_meeting_before_advance ON public.leads;
DROP TRIGGER IF EXISTS enforce_opportunity_before_negotiation ON public.leads;
DROP TRIGGER IF EXISTS before_lead_status_change ON public.leads;
DROP TRIGGER IF EXISTS trg_check_lead_meeting ON public.leads;
DROP TRIGGER IF EXISTS trg_enforce_meeting ON public.leads;
DROP TRIGGER IF EXISTS trg_enforce_opp_before_negotiation ON public.leads;

-- Migration to add indexes for opportunities table to improve pagination and filtering performance
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities (status);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON public.opportunities (user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_service ON public.opportunities (service);

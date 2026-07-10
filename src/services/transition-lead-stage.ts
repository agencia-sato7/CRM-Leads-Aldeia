import { supabase } from '@/lib/supabase/client'
import type { LeadStatus, OppStatus } from '@/stores/use-data-store'

export interface TransitionResult {
  success: boolean
  lead_id: string
  previous_status: string
  new_status: string
  opportunity_status: string | null
  closed_date: string | null
}

export async function transitionLeadStage(
  leadId: string,
  newStatus: LeadStatus,
  source: string = 'manual',
  closedDate?: string,
): Promise<TransitionResult> {
  const { data, error } = await supabase.rpc('transition_lead_stage', {
    p_lead_id: leadId,
    p_new_status: newStatus,
    p_source: source,
    p_closed_date: closedDate || null,
  })

  if (error) {
    throw new Error(error.message || 'Failed to transition lead stage')
  }

  return data as TransitionResult
}

export function leadStatusToOppStatus(
  leadStatus: LeadStatus,
): OppStatus | null {
  switch (leadStatus) {
    case 'Ganho':
      return 'Ganha'
    case 'Perdido':
      return 'Perdida'
    case 'Em Negociação':
      return 'Aberta'
    default:
      return null
  }
}

import { supabase } from '@/lib/supabase/client'

export interface AuditLog {
  id: string
  user_id: string | null
  action_type: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, any>
  created_at: string
  profile?: {
    id: string
    name: string
    email: string
  } | null
}

export interface AuditLogFilters {
  userId?: string
  entityType?: string
  actionType?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export async function fetchAuditLogs(
  filters: AuditLogFilters,
): Promise<{ logs: AuditLog[]; total: number }> {
  const {
    userId,
    entityType,
    actionType,
    startDate,
    endDate,
    page = 1,
    pageSize = 15,
  } = filters

  let query = supabase
    .from('audit_logs')
    .select('*, profile:profiles!audit_logs_user_id_fkey(id, name, email)', {
      count: 'exact',
    })

  if (userId && userId !== 'all') {
    query = query.eq('user_id', userId)
  }
  if (entityType && entityType !== 'all') {
    query = query.eq('entity_type', entityType)
  }
  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType)
  }
  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching audit logs:', error)
    throw error
  }

  const logs: AuditLog[] = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    action_type: row.action_type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata || {},
    created_at: row.created_at,
    profile: row.profile || null,
  }))

  return { logs, total: count || 0 }
}

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { parse } from 'npm:csv-parse@5.5.6/sync'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

interface SyncStats {
  total: number
  newLeads: number
  updatedLeads: number
  newOpps: number
  updatedOpps: number
  newCustomers: number
  auditLogs: number
}

function normalizeText(value: string | undefined | null): string {
  if (!value) return ''
  return value.trim()
}

function parseBooleanFlag(value: string | undefined | null): boolean {
  if (!value) return false
  const lower = value.toLowerCase().trim()
  return ['sim', 'yes', 'y', 's', 'true', '1', 'x', 'v', 'ok'].includes(lower)
}

function parseNegativeFlag(value: string | undefined | null): boolean {
  if (!value) return false
  const lower = value.toLowerCase().trim()
  return ['não', 'nao', 'no', 'n', 'false', '0'].includes(lower)
}

function parseDate(value: string | undefined | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/)
  if (brMatch) {
    const [, day, month, year, rest] = brMatch
    const timePart = rest?.match(/(\d{2}):(\d{2})/)
    const iso = `${year}-${month}-${day}T${timePart ? `${timePart[1]}:${timePart[2]}` : '00:00'}:00-03:00`
    const parsed = new Date(iso)
    if (!isNaN(parsed.getTime())) return parsed.toISOString()
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed.toISOString()
  return null
}

function parseCurrency(value: string | undefined | null): number {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9,-]+/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

async function logAuditEntry(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  entityId: string,
  metadata: Record<string, any>,
): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action_type: 'UPDATE',
    entity_type: 'leads',
    entity_id: entityId,
    metadata,
  })
}

export async function processSync(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string | null,
): Promise<{ success: boolean; message: string; stats: SyncStats }> {
  const stats: SyncStats = {
    total: 0,
    newLeads: 0,
    updatedLeads: 0,
    newOpps: 0,
    updatedOpps: 0,
    newCustomers: 0,
    auditLogs: 0,
  }

  const SHEET_URL =
    'https://docs.google.com/spreadsheets/d/1sSy0o-F-gpAlXGCRXnMMLF18YgOYCXjwmqP0kp3oJI4/export?format=csv&gid=1168122098'

  const response = await fetch(SHEET_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`)
  }

  const csvText = await response.text()
  const records = parse(csvText, {
    skip_empty_lines: true,
    relax_column_count: true,
  })

  if (!records || records.length < 2) {
    throw new Error('Spreadsheet is empty or invalid.')
  }

  const headers = (records[0] as string[]).map((h: string) =>
    h
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  )

  const findIdx = (...patterns: string[]): number => {
    for (const p of patterns) {
      const idx = headers.findIndex((h: string) => h.includes(p))
      if (idx >= 0) return idx
    }
    return -1
  }

  const idxData = findIdx('data', 'date')
  let idxNome = findIdx('nome', 'contato', 'name', 'cliente')
  if (idxNome === -1) {
    idxNome = 1
  }
  const idxEmpresa = findIdx('empresa', 'company')
  const idxTelefone = findIdx(
    'telefone',
    'celular',
    'phone',
    'whats',
    'whatsapp',
  )
  const idxEmail = findIdx('email', 'e-mail')
  const idxObs = findIdx('observacao', 'observacoes', 'obs', 'notes', 'note')
  const idxPlataforma = findIdx('plataforma', 'origem', 'origin', 'canal')
  const idxInteresse = findIdx(
    'interesse',
    'servico',
    'produto',
    'service',
    'objetivo',
  )
  let idxResponsavel = findIdx(
    'responsavel',
    'responsável',
    'vendedor',
    'seller',
    'owner',
  )
  if (idxResponsavel === -1) {
    // Fallback to Column E (index 4) if it's the known structure
    idxResponsavel = 4
  }
  const idxRespondeu = findIdx('respondeu', 'responded', 'reply')
  const idxQualificado = findIdx('qualificado', 'qualified')
  const idxFechou = findIdx('fechou', 'closed', 'won', 'ganho')
  const idxStatus = findIdx('status', 'fase', 'etapa')
  const idxValor = findIdx('valor', 'orcamento', 'preco')
  const idxQuantidade = findIdx('quantidade', 'qtd', 'qty')

  const getCell = (row: string[], idx: number): string => {
    if (idx < 0 || idx >= row.length) return ''
    return normalizeText(row[idx])
  }

  const ownerCache = new Map<string, string | null>()

  const findOwnerByName = async (name: string): Promise<string | null> => {
    if (!name) return null
    const cacheKey = name.toLowerCase().trim()
    if (ownerCache.has(cacheKey)) return ownerCache.get(cacheKey)!

    const { data: matchedId, error: rpcError } = await supabase.rpc(
      'find_profile_by_name',
      { search_name: name },
    )

    if (rpcError) {
      console.warn(
        `[sync] RPC error finding profile for "${name}":`,
        rpcError.message,
      )
    }

    if (matchedId) {
      ownerCache.set(cacheKey, matchedId as string)
      return matchedId as string
    }

    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
    const newEmail = `${slug}@sato7.com.br`

    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: newEmail,
        password: 'Skip@Pass',
        email_confirm: true,
        user_metadata: { name, role: 'COMMERCIAL' },
      })

    if (newUser?.user?.id) {
      ownerCache.set(cacheKey, newUser.user.id)
      return newUser.user.id
    }

    if (createError) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newEmail)
        .maybeSingle()
      if (existingProfile?.id) {
        ownerCache.set(cacheKey, existingProfile.id)
        return existingProfile.id
      }
    }

    console.warn(
      `[sync] No profile match for responsible: "${name}" — lead will be unassigned (user_id = NULL)`,
    )
    ownerCache.set(cacheKey, null)
    return null
  }

  for (let i = 1; i < records.length; i++) {
    const row = records[i] as string[]
    const nome = getCell(row, idxNome)
    const empresa = getCell(row, idxEmpresa) || nome || 'Empresa Desconhecida'
    const telefone = getCell(row, idxTelefone)
    const email = getCell(row, idxEmail)
    const observacao = getCell(row, idxObs)
    const plataforma = getCell(row, idxPlataforma) || 'Planilha'
    const interesse = getCell(row, idxInteresse)
    const responsavel = getCell(row, idxResponsavel)
    const respondeuRaw = getCell(row, idxRespondeu)
    const qualificadoRaw = getCell(row, idxQualificado)
    const fechouRaw = getCell(row, idxFechou)
    const statusRaw = getCell(row, idxStatus)
    const valorRaw = getCell(row, idxValor)
    const quantidadeRaw = getCell(row, idxQuantidade)
    const dataRaw = getCell(row, idxData)

    if (!nome && !empresa && !telefone && !email) continue
    stats.total++

    const contact = nome || empresa || 'Sem Nome'
    const parsedValue = parseCurrency(valorRaw)
    const parsedQty = quantidadeRaw
      ? parseFloat(quantidadeRaw.replace(',', '.')) || 1
      : 1
    const parsedDate = parseDate(dataRaw)
    const responded = parseBooleanFlag(respondeuRaw)

    const ownerId = responsavel ? await findOwnerByName(responsavel) : null

    if (responsavel && !ownerId) {
      console.warn(
        `[sync] No profile match for responsible: "${responsavel}" — lead will be unassigned (user_id = NULL)`,
      )
    }

    let mappedStatus = 'Novo'
    if (parseNegativeFlag(qualificadoRaw) && !parseBooleanFlag(fechouRaw)) {
      mappedStatus = 'Não Qualificado'
    } else if (parseBooleanFlag(fechouRaw)) {
      mappedStatus = 'Ganho'
    } else {
      const statusLower = statusRaw.toLowerCase()
      if (statusLower.match(/ganho|fechado|sucesso/)) mappedStatus = 'Ganho'
      else if (statusLower.match(/perdido|cancelado/)) mappedStatus = 'Perdido'
      else if (statusLower.match(/negocia/)) mappedStatus = 'Em Negociação'
      else if (statusLower.match(/qualificado/)) mappedStatus = 'Qualificado'
      else if (qualificadoRaw && parseBooleanFlag(qualificadoRaw))
        mappedStatus = 'Qualificado'
    }

    // Lead identification: prioritize phone, then name (contact), then email, then company
    let existingLead: any = null
    if (telefone) {
      const { data } = await supabase
        .from('leads')
        .select(
          'id, status, user_id, contact, company, email, phone, notes, objectives, origin, responded, estimated_value, quantity, created_at',
        )
        .eq('phone', telefone)
        .maybeSingle()
      existingLead = data
    }
    if (!existingLead && nome) {
      const { data } = await supabase
        .from('leads')
        .select(
          'id, status, user_id, contact, company, email, phone, notes, objectives, origin, responded, estimated_value, quantity, created_at',
        )
        .eq('contact', nome)
        .maybeSingle()
      existingLead = data
    }
    if (!existingLead && email) {
      const { data } = await supabase
        .from('leads')
        .select(
          'id, status, user_id, contact, company, email, phone, notes, objectives, origin, responded, estimated_value, quantity, created_at',
        )
        .eq('email', email)
        .maybeSingle()
      existingLead = data
    }
    if (!existingLead && empresa !== 'Empresa Desconhecida') {
      const { data } = await supabase
        .from('leads')
        .select(
          'id, status, user_id, contact, company, email, phone, notes, objectives, origin, responded, estimated_value, quantity, created_at',
        )
        .eq('company', empresa)
        .maybeSingle()
      existingLead = data
    }

    const leadPayload: Record<string, any> = {
      contact,
      company: empresa,
      email: email || null,
      phone: telefone || null,
      origin: plataforma,
      objectives: interesse || null,
      notes: observacao || null,
      status: mappedStatus,
      estimated_value: parsedValue,
      responded,
      user_id: ownerId,
      quantity: parsedQty,
      country: 'Brazil',
    }

    if (parsedDate) {
      leadPayload.created_at = parsedDate
    }

    if (existingLead && !responsavel) {
      delete leadPayload.user_id
    }

    let leadId: string | null = existingLead?.id || null

    if (existingLead) {
      // Check if anything actually changed to avoid spamming audit logs
      const hasChanges =
        existingLead.status !== mappedStatus ||
        existingLead.user_id !== ownerId ||
        existingLead.contact !== contact ||
        (existingLead.phone || null) !== (telefone || null) ||
        (existingLead.email || null) !== (email || null) ||
        (existingLead.notes || null) !== (observacao || null) ||
        (existingLead.objectives || null) !== (interesse || null) ||
        existingLead.origin !== plataforma ||
        existingLead.responded !== responded ||
        Number(existingLead.estimated_value || 0) !== parsedValue ||
        Number(existingLead.quantity || 1) !== parsedQty

      if (hasChanges) {
        const { error } = await supabase
          .from('leads')
          .update(leadPayload)
          .eq('id', leadId)

        if (!error) {
          stats.updatedLeads++

          const responsibilityChanged = existingLead.user_id !== ownerId
          const auditMetadata = {
            source: 'spreadsheet_sync',
            responsibility_changed: responsibilityChanged,
            previous_user_id: existingLead.user_id,
            new_user_id: ownerId,
            responsible_name_provided: responsavel || null,
            responsible_match_found: !!ownerId,
            before: {
              status: existingLead.status,
              user_id: existingLead.user_id,
              contact: existingLead.contact,
              phone: existingLead.phone,
              email: existingLead.email,
              notes: existingLead.notes,
              objectives: existingLead.objectives,
              origin: existingLead.origin,
              responded: existingLead.responded,
              estimated_value: existingLead.estimated_value,
              quantity: existingLead.quantity,
            },
            after: {
              status: mappedStatus,
              user_id: ownerId,
              contact,
              phone: telefone || null,
              email: email || null,
              notes: observacao || null,
              objectives: interesse || null,
              origin: plataforma,
              responded,
              estimated_value: parsedValue,
              quantity: parsedQty,
            },
            synced_by: adminUserId,
          }

          await logAuditEntry(supabase, adminUserId, leadId!, auditMetadata)
          stats.auditLogs++
        }
      }
    } else {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert(leadPayload)
        .select('id')
        .single()
      if (error) {
        console.error('Error inserting lead:', error)
      } else if (newLead) {
        leadId = newLead.id
        stats.newLeads++

        const auditMetadata = {
          source: 'spreadsheet_sync',
          action: 'insert',
          responsibility_assigned: !!ownerId,
          new_user_id: ownerId,
          responsible_name_provided: responsavel || null,
          responsible_match_found: !!ownerId,
          data: leadPayload,
          synced_by: adminUserId,
        }

        await logAuditEntry(supabase, adminUserId, leadId!, auditMetadata)
        stats.auditLogs++
      }
    }

    if (responsavel && !ownerId && existingLead && !existingLead.user_id) {
      await logAuditEntry(supabase, adminUserId, leadId!, {
        source: 'spreadsheet_sync',
        event: 'unmatched_responsible',
        responsible_name_provided: responsavel,
        responsible_match_found: false,
        lead_contact: contact,
        lead_company: empresa,
        synced_by: adminUserId,
      })
      stats.auditLogs++
    }

    if (!leadId) continue

    if (['Em Negociação', 'Ganho', 'Perdido'].includes(mappedStatus)) {
      const { data: opps } = await supabase
        .from('opportunities')
        .select('id')
        .eq('lead_id', leadId)
      const opp = opps?.[0]

      let oppStatus = 'Aberta'
      if (mappedStatus === 'Ganho') oppStatus = 'Ganha'
      if (mappedStatus === 'Perdido') oppStatus = 'Perdida'

      const oppPayload: Record<string, any> = {
        status: oppStatus,
        value: parsedValue,
        service: interesse || 'Não especificado',
        quantity: parsedQty,
      }

      if (opp) {
        const { error } = await supabase
          .from('opportunities')
          .update(oppPayload)
          .eq('id', opp.id)
        if (!error) stats.updatedOpps++
      } else {
        const { error } = await supabase.from('opportunities').insert({
          lead_id: leadId,
          user_id: ownerId,
          type: 'Fee Mensal',
          service: interesse || 'Não especificado',
          value: parsedValue,
          status: oppStatus,
          quantity: parsedQty,
        })
        if (!error) stats.newOpps++
      }
    }

    if (mappedStatus === 'Ganho') {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle()
      if (!existingCustomer) {
        const { error } = await supabase.from('customers').insert({
          lead_id: leadId,
          user_id: ownerId,
          name: contact,
          company: empresa,
          email: email || null,
          phone: telefone || null,
        })
        if (!error) stats.newCustomers++
      }
    }
  }

  await supabase.from('settings').upsert({
    key: 'sync_spreadsheet_last_run',
    value: {
      date: new Date().toISOString(),
      stats,
    },
    updated_at: new Date().toISOString(),
  })

  return {
    success: true,
    message: 'Sync process completed',
    stats,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    let adminUserId: string | null = null
    let isAdmin = false

    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: userData } = await supabase.auth.getUser(token)
      if (userData?.user) {
        adminUserId = userData.user.id
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', adminUserId)
          .maybeSingle()
        isAdmin = profile?.role === 'ADMIN'
      }
    }

    if (!isAdmin) {
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'diretor@sato7.com.br')
        .maybeSingle()
      adminUserId = adminUser?.id || null
    }

    const result = await processSync(supabase, adminUserId)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Sync Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stats: {
          total: 0,
          newLeads: 0,
          updatedLeads: 0,
          newOpps: 0,
          updatedOpps: 0,
          newCustomers: 0,
          auditLogs: 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

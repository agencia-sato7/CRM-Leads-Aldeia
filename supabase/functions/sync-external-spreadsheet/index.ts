import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { parse } from 'npm:csv-parse@5.5.6/sync'
import { corsHeaders } from '../_shared/cors.ts'

interface SyncStats {
  total: number
  valid: number
  newLeads: number
  updatedLeads: number
  newOpps: number
  updatedOpps: number
  newCustomers: number
  auditLogs: number
  errors: RowError[]
}

interface RowError {
  row: number
  reason: string
  data?: Record<string, any>
}

function normalizeText(value: string | undefined | null): string {
  if (!value) return ''
  return value.trim()
}

function normalizeForCompare(value: string | undefined | null): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9@._-]/g, '')
}

function parseBooleanFlag(value: string | undefined | null): boolean {
  if (!value) return false
  const lower = normalizeForCompare(value)
  return ['sim', 'yes', 'y', 's', 'true', '1', 'x', 'v', 'ok'].includes(lower)
}

function parseNegativeFlag(value: string | undefined | null): boolean {
  if (!value) return false
  const lower = normalizeForCompare(value)
  return ['nao', 'no', 'n', 'false', '0'].includes(lower)
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

function normalizeStatus(
  statusRaw: string,
  qualificadoRaw: string,
  fechouRaw: string,
): string {
  const statusNorm = normalizeForCompare(statusRaw)
  const qualificadoNorm = normalizeForCompare(qualificadoRaw)
  const fechouNorm = normalizeForCompare(fechouRaw)

  if (parseNegativeFlag(qualificadoRaw) && !parseBooleanFlag(fechouRaw)) {
    return 'Não Qualificado'
  }

  if (parseBooleanFlag(fechouRaw)) {
    return 'Ganho'
  }

  if (
    statusNorm.includes('vendaconcluida') ||
    statusNorm.includes('vendaconcluida') ||
    statusNorm.includes('fechado') ||
    statusNorm.includes('ganho') ||
    statusNorm.includes('sucesso') ||
    statusNorm.includes('won') ||
    statusNorm.includes('closed')
  ) {
    return 'Ganho'
  }

  if (
    statusNorm.includes('perdido') ||
    statusNorm.includes('cancelado') ||
    statusNorm.includes('lost') ||
    statusNorm.includes('perda')
  ) {
    return 'Perdido'
  }

  if (
    statusNorm.includes('propostaenviada') ||
    statusNorm.includes('proposta') ||
    statusNorm.includes('negocia') ||
    statusNorm.includes('negotiation') ||
    statusNorm.includes('emnegociacao')
  ) {
    return 'Em Negociação'
  }

  if (
    qualificadoRaw &&
    (parseBooleanFlag(qualificadoRaw) ||
      qualificadoNorm.includes('qualificado') ||
      qualificadoNorm.includes('qualified'))
  ) {
    return 'Qualificado'
  }

  if (
    statusNorm.includes('qualificado') ||
    statusNorm.includes('qualified')
  ) {
    return 'Qualificado'
  }

  if (statusNorm.includes('novo') || statusNorm.includes('new') || !statusRaw) {
    return 'Novo'
  }

  return 'Novo'
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

interface LeadMatch {
  conflict: boolean
  leadId: string | null
  matchType: string | null
}

async function findExistingLead(
  supabase: ReturnType<typeof createClient>,
  externalId: string,
  cnpj: string,
  email: string,
  phone: string,
): Promise<LeadMatch> {
  const matches = new Map<string, string>()

  if (externalId) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('id', externalId)
      .maybeSingle()
    if (data) matches.set(data.id, 'external_id')
  }

  if (cnpj) {
    const cnpjClean = cnpj.replace(/\D/g, '')
    if (cnpjClean) {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('cnpj', cnpjClean)
        .maybeSingle()
      if (data && !matches.has(data.id)) matches.set(data.id, 'cnpj')
    }
  }

  if (email) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()
    if (data && !matches.has(data.id)) matches.set(data.id, 'email')
  }

  if (phone) {
    const phoneClean = phone.replace(/\D/g, '')
    if (phoneClean) {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phoneClean)
        .maybeSingle()
      if (data && !matches.has(data.id)) matches.set(data.id, 'phone')
    }
  }

  if (matches.size > 1) {
    return { conflict: true, leadId: null, matchType: null }
  }

  if (matches.size === 1) {
    const [leadId, matchType] = matches.entries().next().value as [string, string]
    return { conflict: false, leadId, matchType }
  }

  return { conflict: false, leadId: null, matchType: null }
}

export async function processSync(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string | null,
): Promise<{ success: boolean; message: string; stats: SyncStats }> {
  const stats: SyncStats = {
    total: 0,
    valid: 0,
    newLeads: 0,
    updatedLeads: 0,
    newOpps: 0,
    updatedOpps: 0,
    newCustomers: 0,
    auditLogs: 0,
    errors: [],
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
    normalizeForCompare(h),
  )

  const findIdx = (...patterns: string[]): number => {
    for (const p of patterns) {
      const idx = headers.findIndex((h: string) => h.includes(p))
      if (idx >= 0) return idx
    }
    return -1
  }

  const idxData = findIdx('data', 'date')
  const idxNome = findIdx('nome', 'contato', 'name', 'cliente')
  const idxEmpresa = findIdx('empresa', 'company')
  const idxTelefone = findIdx('telefone', 'celular', 'phone', 'whats', 'whatsapp')
  const idxEmail = findIdx('email')
  const idxCnpj = findIdx('cnpj', 'cpfcnpj', 'documento')
  const idxExternalId = findIdx('id', 'externalid', 'codigo', 'cod')
  const idxObs = findIdx('observacao', 'obs', 'notes', 'note')
  const idxPlataforma = findIdx('plataforma', 'origem', 'origin', 'canal')
  const idxInteresse = findIdx('interesse', 'servico', 'produto', 'service', 'objetivo')
  const idxResponsavel = findIdx('responsavel', 'vendedor', 'seller', 'owner')
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
    const cacheKey = normalizeForCompare(name)
    if (ownerCache.has(cacheKey)) return ownerCache.get(cacheKey)!

    const { data: matchedId, error: rpcError } = await supabase.rpc(
      'find_profile_by_name',
      { search_name: name },
    )

    if (rpcError) {
      console.warn(`[sync] RPC error finding profile for "${name}":`, rpcError.message)
    }

    if (matchedId) {
      ownerCache.set(cacheKey, matchedId as string)
      return matchedId as string
    }

    ownerCache.set(cacheKey, null)
    return null
  }

  for (let i = 1; i < records.length; i++) {
    const row = records[i] as string[]
    const rowNum = i + 1

    const nome = getCell(row, idxNome)
    const empresa = getCell(row, idxEmpresa) || nome || 'Empresa Desconhecida'
    const telefone = getCell(row, idxTelefone)
    const email = getCell(row, idxEmail)
    const cnpj = getCell(row, idxCnpj)
    const externalId = getCell(row, idxExternalId)
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

    if (!nome && !empresa && !telefone && !email && !cnpj) continue
    stats.total++

    // Validation
    if (!nome && !empresa) {
      stats.errors.push({
        row: rowNum,
        reason: 'Missing required name/company field',
        data: { email, phone: telefone },
      })
      continue
    }

    stats.valid++

    const contact = nome || empresa || 'Sem Nome'
    const parsedValue = parseCurrency(valorRaw)
    const parsedQty = quantidadeRaw
      ? parseFloat(quantidadeRaw.replace(',', '.')) || 1
      : 1
    const parsedDate = parseDate(dataRaw)
    const responded = parseBooleanFlag(respondeuRaw)
    const cnpjClean = cnpj ? cnpj.replace(/\D/g, '') : ''

    const ownerId = responsavel ? await findOwnerByName(responsavel) : null

    const mappedStatus = normalizeStatus(statusRaw, qualificadoRaw, fechouRaw)

    // Deduplication: external ID > CNPJ > email > phone
    const match = await findExistingLead(supabase, externalId, cnpjClean, email, telefone)

    if (match.conflict) {
      stats.errors.push({
        row: rowNum,
        reason: 'Multiple conflicting matches found (CNPJ/Email/Phone match different leads)',
        data: { contact, company: empresa, email, phone: telefone, cnpj: cnpjClean },
      })
      continue
    }

    let existingLead: any = null
    if (match.leadId) {
      const { data } = await supabase
        .from('leads')
        .select(
          'id, status, user_id, contact, company, email, phone, notes, objectives, origin, responded, estimated_value, quantity, created_at, cnpj',
        )
        .eq('id', match.leadId)
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

    if (cnpjClean) {
      leadPayload.cnpj = cnpjClean
    }

    if (parsedDate) {
      leadPayload.created_at = parsedDate
    }

    if (existingLead && !responsavel) {
      delete leadPayload.user_id
    }

    let leadId: string | null = existingLead?.id || null

    if (existingLead) {
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

        if (error) {
          stats.errors.push({
            row: rowNum,
            reason: `Database error updating lead: ${error.message}`,
            data: { contact, leadId },
          })
          continue
        }

        stats.updatedLeads++

        const auditMetadata = {
          source: 'spreadsheet_sync',
          responsibility_changed: existingLead.user_id !== ownerId,
          previous_user_id: existingLead.user_id,
          new_user_id: ownerId,
          responsible_name_provided: responsavel || null,
          responsible_match_found: !!ownerId,
          previous_status: existingLead.status,
          new_status: mappedStatus,
          synced_by: adminUserId,
        }

        await logAuditEntry(supabase, adminUserId, leadId!, auditMetadata)
        stats.auditLogs++
      }
    } else {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert(leadPayload)
        .select('id')
        .single()

      if (error) {
        stats.errors.push({
          row: rowNum,
          reason: `Database error inserting lead: ${error.message}`,
          data: { contact, company: empresa },
        })
        continue
      }

      if (newLead) {
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

    if (!leadId) continue

    // Opportunity sync
    if (['Em Negociação', 'Ganho', 'Perdido'].includes(mappedStatus)) {
      const { data: opps } = await supabase
        .from('opportunities')
        .select('id, status, closed_date')
        .eq('lead_id', leadId)
      const opp = opps?.[0]

      let oppStatus = 'Aberta'
      if (mappedStatus === 'Ganho') oppStatus = 'Ganha'
      if (mappedStatus === 'Perdido') oppStatus = 'Perdida'

      const oppClosedDate =
        mappedStatus === 'Ganho' || mappedStatus === 'Perdido'
          ? parsedDate || new Date().toISOString()
          : null

      const oppPayload: Record<string, any> = {
        status: oppStatus,
        value: parsedValue,
        service: interesse || 'Não especificado',
        quantity: parsedQty,
        closed_date: oppClosedDate,
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
          closed_date: oppClosedDate,
        })
        if (!error) stats.newOpps++
      }
    }

    // Customer creation for won leads
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
          cnpj: cnpjClean || null,
        })
        if (!error) stats.newCustomers++
      }
    }
  }

  await supabase.from('settings').upsert({
    key: 'sync_spreadsheet_last_run',
    value: {
      date: new Date().toISOString(),
      stats: {
        ...stats,
        errors: stats.errors.slice(0, 50),
      },
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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: missing auth token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(token)

    if (!userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: invalid token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    adminUserId = userData.user.id
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUserId)
      .maybeSingle()

    isAdmin = profile?.role === 'ADMIN'

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: admin access required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
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
          valid: 0,
          newLeads: 0,
          updatedLeads: 0,
          newOpps: 0,
          updatedOpps: 0,
          newCustomers: 0,
          auditLogs: 0,
          errors: [],
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import Papa from 'npm:papaparse'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'ADMIN') {
      throw new Error('Forbidden: Only admins can trigger sync')
    }

    const csvUrl =
      'https://docs.google.com/spreadsheets/d/1sSy0o-F-gpAlXGCRXnMMLF18YgOYCXjwmqP0kp3oJI4/export?format=csv&gid=1168122098'
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`)
    }
    const csvText = await response.text()

    const { data: rows, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    })

    let newLeads = 0
    let updatedLeads = 0
    let newOpps = 0

    // Fetch existing leads and opportunities to minimize DB calls
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, email, cnpj, company, estimated_value')
    const { data: existingOpps } = await supabase
      .from('opportunities')
      .select('id, lead_id, service')

    const leadsList = existingLeads || []
    const oppsList = existingOpps || []

    for (const row of rows as any[]) {
      const normalizedRow: any = {}
      for (const key in row) {
        const normKey = key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
        normalizedRow[normKey] = row[key]
      }

      const company =
        normalizedRow['empresa'] || normalizedRow['company'] || 'Desconhecida'
      const contact =
        normalizedRow['nome'] ||
        normalizedRow['contato'] ||
        normalizedRow['contact'] ||
        'Desconhecido'
      const email = normalizedRow['email'] || null
      const phone =
        normalizedRow['telefone'] ||
        normalizedRow['celular'] ||
        normalizedRow['phone'] ||
        null
      const cnpj = normalizedRow['cnpj'] || null
      const status = normalizedRow['status'] || 'Novo'
      const origin =
        normalizedRow['origem'] || normalizedRow['origin'] || 'Planilha'
      const service =
        normalizedRow['servico'] ||
        normalizedRow['produto'] ||
        normalizedRow['service'] ||
        null

      let estimated_value = 0
      const valorStr =
        normalizedRow['valor'] ||
        normalizedRow['budget'] ||
        normalizedRow['orcamento']
      if (valorStr) {
        const parsed = parseFloat(
          valorStr.replace(/[^\d.,]/g, '').replace(',', '.'),
        )
        if (!isNaN(parsed)) estimated_value = parsed
      }

      let existingLead = leadsList.find(
        (l) =>
          (email && l.email === email) ||
          (cnpj && l.cnpj === cnpj) ||
          company.toLowerCase() === l.company.toLowerCase(),
      )

      let leadId = existingLead?.id

      if (existingLead) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            contact,
            company,
            phone,
            status,
            origin,
            estimated_value: estimated_value || existingLead.estimated_value,
          })
          .eq('id', leadId)

        if (!updateError) {
          updatedLeads++
        }
      } else {
        const { data: insertedLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            user_id: user.id,
            company,
            contact,
            email,
            phone,
            cnpj,
            status,
            origin,
            estimated_value,
          })
          .select('id')
          .single()

        if (!insertError && insertedLead) {
          leadId = insertedLead.id
          newLeads++
          leadsList.push({ id: leadId, email, cnpj, company, estimated_value })
        }
      }

      if (leadId && service) {
        const hasOpp = oppsList.find(
          (o) => o.lead_id === leadId && o.service === service,
        )
        if (!hasOpp) {
          const { error: oppError, data: newOpp } = await supabase
            .from('opportunities')
            .insert({
              lead_id: leadId,
              user_id: user.id,
              service,
              type: 'Fee Mensal',
              value: estimated_value,
              status: 'Aberta',
            })
            .select('id')
            .single()

          if (!oppError && newOpp) {
            newOpps++
            oppsList.push({ id: newOpp.id, lead_id: leadId, service })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: { newLeads, updatedLeads, newOpps },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

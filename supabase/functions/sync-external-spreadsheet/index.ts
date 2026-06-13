import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { parse } from 'csv-parse/sync';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1sSy0o-F-gpAlXGCRXnMMLF18YgOYCXjwmqP0kp3oJI4/export?format=csv&gid=1168122098';

    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    const records = parse(csvText, {
      skip_empty_lines: true,
      relax_column_count: true,
    });

    if (!records || records.length < 2) {
      throw new Error('Spreadsheet is empty or invalid.');
    }

    const headers = records[0].map((h: string) => h.toLowerCase().trim());
    
    const idxEmail = headers.findIndex((h: string) => h.includes('email') || h.includes('e-mail'));
    const idxCompany = headers.findIndex((h: string) => h.includes('empresa') || h.includes('company') || h.includes('cliente'));
    const idxName = headers.findIndex((h: string) => h.includes('nome') || h.includes('contato'));
    const idxPhone = headers.findIndex((h: string) => h.includes('telefone') || h.includes('celular') || h.includes('phone'));
    const idxStatus = headers.findIndex((h: string) => h.includes('status') || h.includes('fase') || h.includes('etapa'));
    const idxValue = headers.findIndex((h: string) => h.includes('valor') || h.includes('orçamento') || h.includes('preço'));
    const idxService = headers.findIndex((h: string) => h.includes('serviço') || h.includes('produto') || h.includes('interesse'));

    const safeIdxEmail = idxEmail >= 0 ? idxEmail : 2;
    const safeIdxCompany = idxCompany >= 0 ? idxCompany : 1;
    const safeIdxName = idxName >= 0 ? idxName : 0;
    const safeIdxPhone = idxPhone >= 0 ? idxPhone : 3;
    const safeIdxStatus = idxStatus >= 0 ? idxStatus : 4;
    const safeIdxValue = idxValue >= 0 ? idxValue : 5;
    const safeIdxService = idxService >= 0 ? idxService : 6;

    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'diretor@sato7.com.br')
      .single();

    const adminId = adminUser?.id;

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      const rawEmail = row[idxEmail >= 0 ? idxEmail : safeIdxEmail]?.trim();
      const email = rawEmail || null;
      
      const rawCompany = row[idxCompany >= 0 ? idxCompany : safeIdxCompany]?.trim();
      const rawName = row[idxName >= 0 ? idxName : safeIdxName]?.trim();
      
      const company = rawCompany || rawName || 'Empresa Desconhecida';
      const contact = rawName || email || 'Sem Nome';
      
      const phone = row[idxPhone >= 0 ? idxPhone : safeIdxPhone]?.trim() || null;
      const rawStatus = row[idxStatus >= 0 ? idxStatus : safeIdxStatus]?.trim() || 'Novo';
      const rawValue = row[idxValue >= 0 ? idxValue : safeIdxValue]?.trim() || '0';
      const service = row[idxService >= 0 ? idxService : safeIdxService]?.trim() || 'Não especificado';

      let mappedStatus = 'Novo';
      const statusLower = rawStatus.toLowerCase();
      if (statusLower.match(/ganho|fechado|sucesso/)) mappedStatus = 'Ganho';
      else if (statusLower.match(/perdido|cancelado/)) mappedStatus = 'Perdido';
      else if (statusLower.match(/negocia/)) mappedStatus = 'Em Negociação';
      else if (statusLower.match(/qualificado/)) mappedStatus = 'Qualificado';

      const parsedValue = parseFloat(rawValue.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;

      let existingLead = null;
      
      if (email) {
        const { data } = await supabase.from('leads').select('id').eq('email', email).maybeSingle();
        existingLead = data;
      }
      if (!existingLead && company !== 'Empresa Desconhecida') {
        const { data } = await supabase.from('leads').select('id').eq('company', company).maybeSingle();
        existingLead = data;
      }

      let leadId = existingLead?.id;

      if (existingLead) {
        await supabase.from('leads').update({
          contact,
          phone,
          status: mappedStatus,
          estimated_value: parsedValue,
          origin: 'Planilha'
        }).eq('id', leadId);
      } else {
        const { data: newLead, error } = await supabase.from('leads').insert({
          user_id: adminId,
          contact,
          company,
          email,
          phone,
          status: mappedStatus,
          estimated_value: parsedValue,
          origin: 'Planilha',
          country: 'Brazil'
        }).select('id').single();
        
        if (error) console.error('Error inserting lead:', error);
        if (newLead) leadId = newLead.id;
      }

      if (!leadId) continue;

      if (['Em Negociação', 'Ganho', 'Perdido'].includes(mappedStatus)) {
        const { data: opps } = await supabase.from('opportunities').select('id').eq('lead_id', leadId);
        const opp = opps?.[0];

        let oppStatus = 'Aberta';
        if (mappedStatus === 'Ganho') oppStatus = 'Ganha';
        if (mappedStatus === 'Perdido') oppStatus = 'Perdida';

        if (opp) {
          await supabase.from('opportunities').update({
            status: oppStatus,
            value: parsedValue,
            service: service
          }).eq('id', opp.id);
        } else {
          await supabase.from('opportunities').insert({
            lead_id: leadId,
            user_id: adminId,
            type: 'Fee Mensal',
            service: service,
            value: parsedValue,
            status: oppStatus,
            quantity: 1
          });
        }
      }

      if (mappedStatus === 'Ganho') {
        const { data: existingCustomer } = await supabase.from('customers').select('id').eq('lead_id', leadId).maybeSingle();
        if (existingCustomer) {
          await supabase.from('customers').update({
            name: contact,
            company,
            email,
            phone
          }).eq('id', existingCustomer.id);
        } else {
          await supabase.from('customers').insert({
            lead_id: leadId,
            user_id: adminId,
            name: contact,
            company,
            email,
            phone
          });
        }
      }
    }

    await supabase.from('settings').upsert({
      key: 'sync_spreadsheet_last_run',
      value: { date: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ success: true, message: 'Sync process completed', count: records.length - 1 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sync Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

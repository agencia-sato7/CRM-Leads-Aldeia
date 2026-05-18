import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email } = await req.json()

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: 'User ID and Email are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error('Missing environment variables')
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Update profile tracking code by ID to prevent mismatches caused by case-sensitive emails
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ two_factor_code: code, two_factor_expires_at: expiresAt })
      .eq('id', userId)
      .select('id')

    if (updateError) {
      console.error('Error updating profile with 2FA code:', updateError)
      throw updateError
    }

    if (!updatedData || updatedData.length === 0) {
      console.warn(
        `Profile not found for user ${userId}. Attempting to insert fallback profile...`,
      )
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: email.split('@')[0] || 'Usuário',
          role: 'COMMERCIAL',
          two_factor_code: code,
          two_factor_expires_at: expiresAt,
        })

      if (insertError) {
        console.error('Error inserting fallback profile:', insertError)
        throw insertError
      }
    }

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'S7SALES <onboarding@s7sales.appsato7.com.br>',
        to: [email],
        subject: 'Código de Verificação 2FA - CRM S7SALES',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px; letter-spacing: -0.5px;">S7SALES</h1>
            </div>
            
            <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Código de Verificação</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Para acessar sua conta, utilize o código de verificação abaixo:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <div style="background-color: #f3f4f6; color: #111827; padding: 16px 32px; border-radius: 8px; font-weight: 700; font-size: 32px; letter-spacing: 4px; display: inline-block;">
                ${code}
              </div>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Este código expira em 10 minutos. Se você não solicitou este acesso, por favor ignore este e-mail.
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Resend API error: ${errorText}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

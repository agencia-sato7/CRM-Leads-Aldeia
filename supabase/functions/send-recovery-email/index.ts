import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, redirectTo } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
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

    // Generate recovery link using admin api
    const { data, error: generateError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo:
            redirectTo || 'https://s7sales.appsato7.com.br/reset-password',
        },
      })

    if (generateError) {
      throw generateError
    }

    const actionLink = data.properties.action_link

    // Send custom email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'S7SALES <onboarding@s7sales.appsato7.com.br>',
        to: [email],
        subject: 'Recuperação de Senha - CRM S7SALES',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px; letter-spacing: -0.5px;">S7SALES</h1>
            </div>
            
            <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Olá,</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Recebemos uma solicitação para redefinir a senha da sua conta no CRM S7SALES.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Para cadastrar uma nova senha, por favor, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${actionLink}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Redefinir minha senha</a>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Ou copie e cole o link abaixo no seu navegador:
              <br>
              <a href="${actionLink}" style="color: #dc2626; word-break: break-all; font-size: 14px;">${actionLink}</a>
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá a mesma.
              </p>
            </div>
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

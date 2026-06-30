import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.13'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// SMTP configuration from environment variables
const SMTP_HOST = Deno.env.get('SMTP_HOST')
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '587')
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASS = Deno.env.get('SMTP_PASS')
const SMTP_FROM = Deno.env.get('SMTP_FROM')
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

    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !SMTP_HOST ||
      !SMTP_USER ||
      !SMTP_PASS ||
      !SMTP_FROM
    ) {
      throw new Error('Missing environment variables (SMTP or Supabase)')
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

    // Generate recovery link using admin API
    const { data, error: generateError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo:
            redirectTo || 'https://crm.aldeiaacabamentos.com.br/reset-password',
        },
      })

    if (generateError) {
      throw generateError
    }

    const actionLink = data.properties.action_link

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true para 465, false para outras portas
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    // Email content (HTML)
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; background-color: #1a6b4a; padding: 32px 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; font-weight: 700;">Aldeia Acabamentos</h1>
        </div>
        
        <div style="padding: 40px 32px;">
          <h2 style="color: #111827; font-size: 22px; margin-top: 0; margin-bottom: 16px;">Olá,</h2>
          
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no CRM Aldeia Acabamentos.
          </p>
          
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 32px;">
            Para cadastrar uma nova senha, por favor, clique no botão abaixo:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionLink}" style="background-color: #2d9066; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s;">Redefinir Minha Senha</a>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-top: 32px;">
            Ou copie e cole o link abaixo no seu navegador:
            <br>
            <a href="${actionLink}" style="color: #1a6b4a; word-break: break-all; font-size: 14px; display: inline-block; margin-top: 8px;">${actionLink}</a>
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5; text-align: center;">
            Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá a mesma.
          </p>
        </div>
      </div>
    `

    // Send email via SMTP
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: 'Recuperação de Senha - CRM Aldeia Acabamentos',
      html: htmlContent,
    })

    console.log('Email sent via SMTP:', info.messageId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

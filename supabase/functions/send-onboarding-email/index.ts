import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.13'
import { corsHeaders } from '../_shared/cors.ts'

const SMTP_HOST = Deno.env.get('SMTP_HOST')
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '587')
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASS = Deno.env.get('SMTP_PASS')
const SMTP_FROM = Deno.env.get('SMTP_FROM')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid or expired token')
    }

    const { emails, onboarding } = await req.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('Lista de e-mails vazia ou inválida')
    }

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      throw new Error('Missing SMTP environment variables')
    }

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #227b50; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Novo Onboarding Registrado 🚀</h1>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            Um novo processo de onboarding foi iniciado para o cliente <strong>${onboarding.companyName}</strong>.
          </p>
          
          <h2 style="font-size: 18px; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 0;">Detalhes do Cliente</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 140px;">CNPJ:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.cnpj || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">E-mail:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.email || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Telefone:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.phone || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Site:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.site || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Data do Registro:</td>
              <td style="padding: 8px 0; color: #111827;">${new Date().toLocaleDateString('pt-BR')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Registrado por:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.registeredBy || 'Sistema'}</td>
            </tr>
          </table>

          <h2 style="font-size: 18px; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 0;">Detalhes Comerciais</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 140px;">Produtos:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.serviceName || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Quantidade:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.quantity !== undefined && onboarding.quantity !== null ? onboarding.quantity : '1'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Valor Fechado:</td>
              <td style="padding: 8px 0; color: #111827;">${onboarding.opportunityValue !== undefined && onboarding.opportunityValue !== null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(onboarding.opportunityValue) : 'Não informado'}</td>
            </tr>
          </table>

          <h2 style="font-size: 18px; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Contexto e Estratégia</h2>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #f3f4f6;">
            <h3 style="margin-top: 0; font-size: 14px; color: #4b5563; text-transform: uppercase;">Descrição do Serviço:</h3>
            <p style="color: #111827; margin-bottom: 0; white-space: pre-wrap;">${onboarding.serviceDescription || 'Não informado'}</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
            <h3 style="margin-top: 0; font-size: 14px; color: #4b5563; text-transform: uppercase;">Marketing Atual vs Expectativas:</h3>
            <p style="color: #111827; margin-bottom: 0; white-space: pre-wrap;">${onboarding.marketingContext || 'Não informado'}</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            Este é um e-mail automático gerado pelo sistema S7SALES CRM.<br/>
            Por favor, não responda diretamente a esta mensagem.
          </p>
        </div>
      </div>
    `

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: emails.join(', '),
      subject: `🚀 Novo Onboarding: ${onboarding.companyName}`,
      html: htmlTemplate,
    })

    console.log('Email sent via SMTP:', info.messageId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'E-mails processados e enviados com sucesso!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Failed to send onboarding email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

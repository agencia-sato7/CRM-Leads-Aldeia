import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { ShieldCheck, MailCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TwoFactorAuth() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { session, verify2FA, send2FA, is2FAVerified, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true })
    }
  }, [session, loading, navigate])

  useEffect(() => {
    if (!loading && session && is2FAVerified) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [session, is2FAVerified, loading, navigate, location])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setIsLoading(true)
    setError('')

    const isValid = await verify2FA(code)

    setIsLoading(false)

    if (isValid) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } else {
      setError('Código inválido ou expirado')
    }
  }

  const handleResend = async () => {
    if (!session?.user?.email || !session?.user?.id) return
    setIsResending(true)
    try {
      const { error } = await send2FA(session.user.id, session.user.email)
      if (error) throw new Error('Falha ao reenviar código')
      toast.success('Novo código enviado para seu e-mail')
      setCode('')
    } catch (err) {
      toast.error('Erro ao reenviar o código. Tente novamente.')
    } finally {
      setIsResending(false)
    }
  }

  if (loading || is2FAVerified || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
        <div className="flex justify-center text-red-600">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Autenticação 2FA
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Segurança em primeiro lugar. Confirme sua identidade.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="bg-white py-8 px-4 shadow-xl shadow-black/5 sm:rounded-2xl sm:px-10 border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <MailCheck className="w-8 h-8 text-red-600" />
          </div>

          <p className="text-sm text-gray-600 text-center mb-6">
            Enviamos um código de 6 dígitos para <br />
            <span className="font-semibold text-gray-900">
              {session.user.email}
            </span>
          </p>

          <form
            onSubmit={handleVerify}
            className="w-full flex flex-col items-center space-y-6"
          >
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm w-full border border-red-100 text-center">
                {error}
              </div>
            )}

            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>

            <Button
              type="submit"
              className="w-full h-11 text-base bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all"
              disabled={code.length !== 6 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Verificar Acesso
            </Button>

            <div className="flex flex-col items-center gap-2 mt-4">
              <span className="text-sm text-gray-500">
                Não recebeu o código?
              </span>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-auto p-2"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isResending ? 'Enviando...' : 'Reenviar código'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

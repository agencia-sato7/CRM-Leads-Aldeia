import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.functions.invoke('send-recovery-email', {
        body: {
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      })

      if (error) throw error

      setSent(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao enviar e-mail de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
        <div className="flex justify-center text-[#227b50]">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recuperar Senha
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="bg-white py-8 px-4 shadow-xl shadow-black/5 sm:rounded-2xl sm:px-10 border border-gray-100">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                Se o email existir em nossa base, enviaremos um link seguro para
                redefinição de senha.
              </p>
              <Link
                to="/login"
                className="text-[#227b50] font-medium text-sm hover:underline block"
              >
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Corporativo
                </label>
                <div className="mt-1">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-base bg-[#227b50] hover:bg-[#185e3c] text-white rounded-xl shadow-md transition-all"
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
              </div>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Voltar
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

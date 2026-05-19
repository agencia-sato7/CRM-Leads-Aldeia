import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast.error('Sessão inválida. Solicite um novo link de recuperação.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error('Erro ao atualizar a senha: ' + error.message)
    } else {
      toast.success('Senha atualizada com sucesso!')
      navigate('/')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#227b50]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
        <div className="flex justify-center text-[#227b50]">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Nova Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Digite sua nova senha abaixo.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="bg-white py-8 px-4 shadow-xl shadow-black/5 sm:rounded-2xl sm:px-10 border border-gray-100">
          {!session ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center text-amber-500">
                <AlertCircle className="w-12 h-12" />
              </div>
              <p className="text-sm text-gray-600">
                O link de recuperação parece ser inválido ou expirou.
              </p>
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-[#227b50] hover:bg-[#185e3c] text-white"
              >
                Solicitar novo link
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <div className="mt-1">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-base bg-[#227b50] hover:bg-[#185e3c] text-white rounded-xl shadow-md transition-all"
                >
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    <
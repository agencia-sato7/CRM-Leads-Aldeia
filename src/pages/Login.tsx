import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('diretor@sato7.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const [error, setError] = useState('')
  const { signIn, session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError('Credenciais inválidas.')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
        <div className="flex justify-center text-red-600">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-red-600 tracking-tighter">
          S7SALES
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesso seguro ao painel comercial e gestão B2B
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="bg-white py-8 px-4 shadow-xl shadow-black/5 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-red-600 hover:text-red-500 transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full h-11 text-base bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all"
              >
                Entrar no Sistema
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

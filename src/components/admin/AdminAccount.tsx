import { useState, useEffect } from 'react'
import { useDataStore } from '@/stores/use-data-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Save, LockKeyhole, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function AdminAccount() {
  const { currentUser, updateUser } = useDataStore()
  const { set2FAVerified } = useAuth()

  const [name, setName] = useState(currentUser?.name || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '')
      setEmail(currentUser.email || '')
      setPhone(currentUser.phone || '')

      const fetch2FA = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('id', currentUser.id)
          .single()

        if (!error && data && data.two_factor_enabled !== null) {
          setTwoFactorEnabled(data.two_factor_enabled)
        }
      }
      fetch2FA()
    }
  }, [currentUser])

  if (!currentUser) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return toast.error('Formato de e-mail inválido.')
    }

    await updateUser(currentUser.id, { name, email, phone })
    toast.success('Perfil atualizado com sucesso!')
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      return toast.error('As senhas não coincidem.')
    }
    if (newPassword.length < 6) {
      return toast.error('A senha deve ter no mínimo 6 caracteres.')
    }

    await updateUser(currentUser.id, { password: newPassword })
    toast.success('Senha atualizada com segurança!')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleToggle2FA = async (checked: boolean) => {
    setTwoFactorEnabled(checked)

    const { error } = await supabase
      .from('profiles')
      .update({ two_factor_enabled: checked })
      .eq('id', currentUser.id)

    if (error) {
      setTwoFactorEnabled(!checked)
      toast.error('Erro ao atualizar configuração.')
    } else {
      toast.success(
        `Autenticação de dois fatores ${checked ? 'ativada' : 'desativada'}.`,
      )

      sessionStorage.setItem('2fa_verified', 'true')
      if (!checked && set2FAVerified) {
        set2FAVerified(true)
      }

      if (updateUser) {
        updateUser(currentUser.id, { two_factor_enabled: checked } as any)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Autenticação de Dois Fatores (2FA)
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">
              Adicione uma camada extra de segurança à sua conta exigindo um
              código de verificação enviado por e-mail a cada login.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-gray-700">
            {twoFactorEnabled ? 'Ativado' : 'Desativado'}
          </span>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Informações Pessoais
          </h2>
          <p className="text-sm text-gray-500">
            Atualize seus dados de contato e identificação.
          </p>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Nome Completo
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium leading-none">
              Telefone
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
          >
            <Save className="w-4 h-4 mr-2" /> Salvar Alterações
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Segurança</h2>
          <p className="text-sm text-gray-500">
            Altere sua senha de acesso ao sistema.
          </p>
        </div>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="new-pass"
              className="text-sm font-medium leading-none"
            >
              Nova Senha
            </label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirm-pass"
              className="text-sm font-medium leading-none"
            >
              Confirmar Senha
            </label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" variant="destructive" className="w-full mt-2">
            <LockKeyhole className="w-4 h-4 mr-2" /> Atualizar Senha
          </Button>
        </form>
      </div>
    </div>
  )
}

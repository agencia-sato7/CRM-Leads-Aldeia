import { useEffect, useState } from 'react'
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  MoreVertical,
  Key,
  Camera,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Profile = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  is_locked: boolean | null
  created_at: string
  avatar_url?: string | null
}

export default function Team() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'COMMERCIAL',
    phone: '',
    newPassword: '',
    avatar_url: null as string | null,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro ao buscar usuários', variant: 'destructive' })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleOpenDialog = (user?: Profile) => {
    setAvatarFile(null)
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        newPassword: '',
        avatar_url: user.avatar_url || null,
      })
      setAvatarPreview(user.avatar_url || null)
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: 'COMMERCIAL',
        phone: '',
        newPassword: '',
        avatar_url: null,
      })
      setAvatarPreview(null)
    }
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    if (!editingUser && !formData.newPassword) {
      toast({
        title: 'A senha é obrigatória para novos usuários',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      let finalAvatarUrl = formData.avatar_url

      if (editingUser && avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${editingUser.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = publicUrl
      }

      if (editingUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role,
            phone: formData.phone,
            avatar_url: finalAvatarUrl,
          })
          .eq('id', editingUser.id)

        if (profileError) throw profileError

        if (formData.email !== editingUser.email || formData.newPassword) {
          const { data: rpcData, error: rpcError } = await (
            supabase.rpc as any
          )('admin_update_user_credentials', {
            user_id_to_update: editingUser.id,
            new_email:
              formData.email !== editingUser.email ? formData.email : null,
            new_password: formData.newPassword || null,
          })

          if (rpcError) throw rpcError
          if (rpcData && !rpcData.success) {
            throw new Error(rpcData.error || 'Erro ao atualizar credenciais')
          }
        }

        toast({ title: 'Usuário atualizado com sucesso' })
      } else {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          'admin_create_user',
          {
            new_email: formData.email,
            new_password: formData.newPassword,
            new_name: formData.name,
            new_role: formData.role,
            new_phone: formData.phone || null,
          },
        )

        if (rpcError) throw rpcError
        if (rpcData && !rpcData.success) {
          throw new Error(rpcData.error || 'Erro ao criar usuário')
        }

        const newUserId = rpcData.user_id

        if (avatarFile && newUserId) {
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${newUserId}-${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile)
          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from('avatars').getPublicUrl(fileName)

          await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', newUserId)
        }

        toast({ title: 'Usuário criado com sucesso' })
      }
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      toast({ title: 'E-mail de redefinição enviado com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar e-mail',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleToggleLock = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_locked: !user.is_locked })
        .eq('id', user.id)

      if (error) throw error
      toast({
        title: user.is_locked ? 'Usuário desbloqueado' : 'Usuário bloqueado',
      })
      fetchUsers()
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Usuário removido com sucesso' })
      fetchUsers()
    } catch (error: any) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Equipe
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie os acessos e permissões do sistema
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#227b50] hover:bg-[#1a5c3c]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-50/50 border-gray-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-sm font-medium text-gray-500">
                <th className="pb-3 px-4">Usuário</th>
                <th className="pb-3 px-4">Contato</th>
                <th className="pb-3 px-4">Papel</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Carregando equipe...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#227b50]/10 text-[#227b50] flex items-center justify-center text-xs font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {user.phone || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                          user.role === 'ADMIN'
                            ? 'bg-[#227b50]/10 text-[#227b50] ring-[#227b50]/20'
                            : 'bg-gray-100 text-gray-700 ring-gray-600/10',
                        )}
                      >
                        {user.role === 'ADMIN' ? (
                          <ShieldAlert className="w-3 h-3 mr-1" />
                        ) : (
                          <Shield className="w-3 h-3 mr-1" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                          user.is_locked
                            ? 'bg-red-50 text-red-700 ring-red-600/10'
                            : 'bg-green-50 text-green-700 ring-green-600/10',
                        )}
                      >
                        {user.is_locked ? (
                          <Lock className="w-3 h-3 mr-1" />
                        ) : (
                          <Unlock className="w-3 h-3 mr-1" />
                        )}
                        {user.is_locked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-48 p-1 flex flex-col gap-1"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start w-full"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start w-full"
                            onClick={() => handleToggleLock(user)}
                          >
                            {user.is_locked ? (
                              <>
                                <Unlock className="w-4 h-4 mr-2" /> Desbloquear
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" /> Bloquear
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start w-full"
                            onClick={() => handleSendPasswordReset(user.email)}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Reset de Senha
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-[#227b50] transition-colors group cursor-pointer shadow-sm">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCog className="w-8 h-8 text-gray-400 group-hover:text-[#227b50] transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
              </div>
              <span className="text-xs text-gray-500 mt-3 font-medium">
                Clique para alterar a foto
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="joao@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {editingUser ? 'Nova Senha (opcional)' : 'Senha de Acesso'}
                </label>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  placeholder={
                    editingUser
                      ? 'Deixe em branco para não alterar'
                      : 'Digite a senha'
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Papel (Nível de Acesso)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="COMMERCIAL">Comercial (Limitado)</option>
                  <option value="ADMIN">Administrador (Total)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#227b50] hover:bg-[#1a5c3c] min-w-[100px]"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

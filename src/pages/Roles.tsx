import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit2, Trash2, Key } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = {
  id: string
  name: string
  description: string
  is_system: boolean
}
type Permission = {
  id: string
  role_id: string
  resource: string
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
}

const RESOURCES = [
  { value: 'dashboard', label: 'Painel de Performance' },
  { value: 'leads', label: 'Leads' },
  { value: 'opportunities', label: 'Oportunidades' },
  { value: 'price_table', label: 'Tabela de Preços' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'resources', label: 'Materiais (Repositório)' },
  { value: 'team', label: 'Equipe' },
  { value: 'roles', label: 'Controle de Acesso' },
]

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [rolePerms, setRolePerms] = useState<
    Record<string, Partial<Permission>>
  >({})

  const fetchRoles = async () => {
    setLoading(true)
    const { data: rolesData } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true })
    const { data: permsData } = await supabase
      .from('role_permissions')
      .select('*')
    setRoles(rolesData || [])
    setPermissions(permsData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleOpenDialog = (role?: Role) => {
    setEditingRole(role || null)
    setFormData({
      name: role?.name || '',
      description: role?.description || '',
    })

    const permMap: Record<string, Partial<Permission>> = {}
    RESOURCES.forEach((res) => {
      const p = role
        ? permissions.find(
            (rp) => rp.role_id === role.id && rp.resource === res.value,
          )
        : null
      permMap[res.value] = p
        ? { ...p }
        : {
            resource: res.value,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
          }
    })
    setRolePerms(permMap)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.name)
        return toast({
          title: 'O nome do papel é obrigatório',
          variant: 'destructive',
        })
      let roleId = editingRole?.id

      if (editingRole) {
        const { error } = await supabase
          .from('roles')
          .update({ name: formData.name, description: formData.description })
          .eq('id', roleId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('roles')
          .insert({ name: formData.name, description: formData.description })
          .select()
          .single()
        if (error) throw error
        roleId = data.id
      }

      const permsToUpsert = Object.values(rolePerms).map((p) => ({
        role_id: roleId,
        resource: p.resource,
        can_create: p.can_create ?? false,
        can_read: p.can_read ?? false,
        can_update: p.can_update ?? false,
        can_delete: p.can_delete ?? false,
      }))

      const { error: permsError } = await supabase
        .from('role_permissions')
        .upsert(permsToUpsert, { onConflict: 'role_id,resource' })
      if (permsError) throw permsError

      toast({ title: 'Papel salvo com sucesso!' })
      setIsDialogOpen(false)
      fetchRoles()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este papel?')) return
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error)
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      })
    else {
      toast({ title: 'Papel excluído com sucesso!' })
      fetchRoles()
    }
  }

  const togglePerm = (
    res: string,
    act: 'can_create' | 'can_read' | 'can_update' | 'can_delete',
  ) => {
    setRolePerms((prev) => ({
      ...prev,
      [res]: { ...prev[res], [act]: !prev[res][act] },
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Controle de Acesso
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie os papéis e permissões do sistema
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#227b50] hover:bg-[#1a5c3c]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Papel
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-sm font-medium text-gray-500">
                <th className="pb-3 px-4">Papel</th>
                <th className="pb-3 px-4">Descrição</th>
                <th className="pb-3 px-4">Tipo</th>
                <th className="pb-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {role.description}
                    </td>
                    <td className="py-3 px-4">
                      {role.is_system ? (
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10">
                          Sistema
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-[#227b50]/10 text-[#227b50] ring-1 ring-inset ring-[#227b50]/20">
                          Customizado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-900 h-8 w-8"
                        onClick={() => handleOpenDialog(role)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!role.is_system && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#227b50] hover:text-[#1a5c3c] hover:bg-[#227b50]/10 h-8 w-8"
                          onClick={() => handleDelete(role.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#227b50]" />{' '}
                {editingRole ? 'Editar Papel' : 'Novo Papel'}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nome do Papel
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value.toUpperCase(),
                      })
                    }
                    className="border-gray-200 focus-visible:ring-[#227b50]"
                    disabled={editingRole?.is_system}
                    placeholder="Ex: GERENTE"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="border-gray-200 focus-visible:ring-[#227b50]"
                    placeholder="Ex: Acesso gerencial ao sistema"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-gray-100 pb-2 text-gray-900">
                  Permissões de Acesso por Módulo
                </h3>
                <div className="grid gap-3">
                  {RESOURCES.map((res) => (
                    <div
                      key={res.value}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="w-1/3">
                        <h4 className="font-medium text-gray-900">
                          {res.label}
                        </h4>
                      </div>
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <Switch
                            className="data-[state=checked]:bg-[#227b50]"
                            checked={rolePerms[res.value]?.can_read || false}
                            onCheckedChange={() =>
                              togglePerm(res.value, 'can_read')
                            }
                          />
                          <span className="text-sm text-gray-600 group-hover:text-[#227b50] transition-colors">
                            Visualizar
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <Switch
                            className="data-[state=checked]:bg-[#227b50]"
                            checked={rolePerms[res.value]?.can_create || false}
                            onCheckedChange={() =>
                              togglePerm(res.value, 'can_create')
                            }
                          />
                          <span className="text-sm text-gray-600 group-hover:text-[#227b50] transition-colors">
                            Criar
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <Switch
                            className="data-[state=checked]:bg-[#227b50]"
                            checked={rolePerms[res.value]?.can_update || false}
                            onCheckedChange={() =>
                              togglePerm(res.value, 'can_update')
                            }
                          />
                          <span className="text-sm text-gray-600 group-hover:text-[#227b50] transition-colors">
                            Editar
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <Switch
                            className="data-[state=checked]:bg-[#227b50]"
                            checked={rolePerms[res.value]?.can_delete || false}
                            onCheckedChange={() =>
                              togglePerm(res.value, 'can_delete')
                            }
                          />
                          <span className="text-sm text-gray-600 group-hover:text-[#227b50] transition-colors">
                            Excluir
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <Button
                variant="outline"
                className="bg-white hover:text-[#227b50] hover:border-[#227b50]"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-[#227b50] hover:bg-[#1a5c3c] shadow-md text-white"
                onClick={handleSave}
              >
                Salvar Papel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

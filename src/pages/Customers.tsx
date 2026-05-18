import { useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDataStore, Customer } from '@/stores/use-data-store'

export default function Customers() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    currentUser,
  } = useDataStore()
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    company: '',
    cnpj: '',
    contact: '',
    email: '',
    phone: '',
    status: 'Ativo',
    country: 'Brazil',
    city: '',
    site: '',
    facebook: '',
    instagram: '',
    notes: '',
  })

  if (!currentUser) return null

  const userCustomers = customers.filter(
    (c) => currentUser.role === 'ADMIN' || c.userId === currentUser.id,
  )

  const filteredCustomers = userCustomers.filter(
    (c) =>
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  )

  const maskPhone = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (!v) return ''
    if (v.length <= 2) return `(${v}`
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`
    if (v.length <= 10)
      return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`
  }

  const maskCNPJ = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (!v) return ''
    if (v.length <= 2) return v
    if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`
    if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`
    if (v.length <= 12)
      return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`
    return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`
  }

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        company: customer.company,
        cnpj: customer.cnpj || '',
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        country: customer.country,
        city: customer.city,
        site: customer.site || '',
        facebook: customer.facebook || '',
        instagram: customer.instagram || '',
        notes: customer.notes,
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        company: '',
        cnpj: '',
        contact: '',
        email: '',
        phone: '',
        status: 'Ativo',
        country: 'Brazil',
        city: '',
        site: '',
        facebook: '',
        instagram: '',
        notes: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.company || !formData.contact) {
      toast({
        title: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
        toast({ title: 'Cliente atualizado com sucesso' })
      } else {
        await addCustomer({
          ...formData,
          userId: currentUser.role === 'ADMIN' ? null : currentUser.id,
        })
        toast({ title: 'Cliente criado com sucesso' })
      }
      setIsDialogOpen(false)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return
    try {
      await deleteCustomer(id)
      toast({ title: 'Cliente removido com sucesso' })
    } catch (error: any) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Clientes
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie a base de clientes do sistema
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por empresa, contato ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-50/50 border-gray-200"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Nenhum cliente corresponde aos critérios de busca ou sua base está
              vazia. Adicione um novo cliente.
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cliente
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-sm font-medium text-gray-500">
                  <th className="pb-3 px-4">Empresa / Contato</th>
                  <th className="pb-3 px-4">E-mail / Telefone</th>
                  <th className="pb-3 px-4">Localização</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {customer.company.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.company}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.contact}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">
                        {customer.email || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.phone || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {customer.city ? `${customer.city}, ` : ''}
                        {customer.country}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                          customer.status === 'Ativo'
                            ? 'bg-green-50 text-green-700 ring-green-600/10'
                            : 'bg-gray-50 text-gray-700 ring-gray-600/10',
                        )}
                      >
                        {customer.status === 'Ativo' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {customer.status}
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
                            onClick={() => handleOpenDialog(customer)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Razão Social / Empresa
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Nome da Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    CNPJ
                  </label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cnpj: maskCNPJ(e.target.value),
                      })
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Contato Principal
                  </label>
                  <Input
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="Nome do Contato"
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
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: maskPhone(e.target.value),
                      })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    País
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Brazil">Brasil</option>
                    <option value="USA">USA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cidade
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Site (Opcional)
                  </label>
                  <Input
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                    placeholder="www.empresa.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Facebook (Opcional)
                  </label>
                  <Input
                    value={formData.facebook}
                    onChange={(e) =>
                      setFormData({ ...formData, facebook: e.target.value })
                    }
                    placeholder="/empresa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Instagram (Opcional)
                  </label>
                  <Input
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    placeholder="@empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notas (Opcional)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Informações adicionais..."
                />
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
                className="bg-red-600 hover:bg-red-700 min-w-[100px]"
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

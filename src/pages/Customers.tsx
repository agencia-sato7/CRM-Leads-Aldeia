import { useState, useMemo, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
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
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    cnpj: '',
  })

  const userCustomers = useMemo(() => {
    if (!currentUser) return []
    return customers.filter(
      (c) => currentUser.role === 'ADMIN' || c.userId === currentUser.id,
    )
  }, [customers, currentUser])

  const filteredCustomers = useMemo(() => {
    return userCustomers.filter(
      (c) =>
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.cnpj && c.cnpj.includes(search)),
    )
  }, [userCustomers, search])

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredCustomers.slice(start, start + itemsPerPage)
  }, [filteredCustomers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

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
        name: customer.name,
        company: customer.company,
        email: customer.email || '',
        phone: customer.phone || '',
        cnpj: customer.cnpj || '',
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        cnpj: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.company || !formData.name) {
      toast({
        title: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    if (!currentUser) return

    setIsSaving(true)
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
        toast({ title: 'Cliente atualizado com sucesso' })
      } else {
        await addCustomer({
          ...formData,
          userId: currentUser.id,
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

  if (!currentUser) return null

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
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
          className="bg-[#227b50] hover:bg-[#1a5c3c]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
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

        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#227b50]/10 text-[#227b50] rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Nenhum cliente corresponde aos critérios de busca ou sua base está
              vazia.
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              variant="outline"
              className="border-[#227b50]/30 text-[#227b50] hover:bg-[#227b50]/10 hover:text-[#1a5c3c]"
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
                  <th className="pb-3 px-4">Nome / Contato</th>
                  <th className="pb-3 px-4">E-mail</th>
                  <th className="pb-3 px-4">Telefone</th>
                  <th className="pb-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#227b50]/10 text-[#227b50] flex items-center justify-center text-xs font-bold shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {customer.email || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {customer.phone || '-'}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  até{' '}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredCustomers.length,
                    )}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">
                    {filteredCustomers.length}
                  </span>{' '}
                  resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-8"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
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
                    Nome / Contato Principal
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nome do Cliente"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Razão Social ou Fantasia"
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

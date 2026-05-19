import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  CalendarDays,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
  Users,
  Info,
  Eye,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useDataStore,
  LeadStatus,
  Country,
  LeadOrigin,
  OppType,
  Lead,
} from '@/stores/use-data-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

const formatPhone = (val: string, country: string) => {
  const digits = val.replace(/\D/g, '')
  if (country === 'Brazil') {
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  } else {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
}

export default function Leads() {
  const {
    leads,
    addLead,
    updateLead,
    addOpportunity,
    currentUser,
    opportunities,
    products,
    productCategories,
    users,
  } = useDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOrigin, setFilterOrigin] = useState<string>('all')
  const [filterProduct, setFilterProduct] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [newMeetingDate, setNewMeetingDate] = useState('')
  const [newMeetingNotes, setNewMeetingNotes] = useState('')

  const hasActiveFilters =
    filterRegion !== 'all' ||
    filterStatus !== 'all' ||
    filterOrigin !== 'all' ||
    filterProduct !== 'all' ||
    searchTerm !== ''

  const clearFilters = () => {
    setFilterRegion('all')
    setFilterStatus('all')
    setFilterOrigin('all')
    setFilterProduct('all')
    setSearchTerm('')
  }

  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null)
  const [scheduleFormData, setScheduleFormData] = useState({
    date: '',
    notes: '',
  })

  const [concludeLead, setConcludeLead] = useState<Lead | null>(null)
  const [concludeFormData, setConcludeFormData] = useState({ notes: '' })
  const [expiredToastShown, setExpiredToastShown] = useState(false)

  useEffect(() => {
    if (
      currentUser?.role === 'ADMIN' &&
      leads.length > 0 &&
      !expiredToastShown
    ) {
      const expiredCount = leads.filter(
        (lead) =>
          lead.scheduledMeetingDate &&
          new Date(lead.scheduledMeetingDate) < new Date() &&
          lead.status !== 'Ganho' &&
          lead.status !== 'Perdido',
      ).length

      if (expiredCount > 0) {
        toast.warning('Atenção: Reuniões Vencidas', {
          description: (
            <span className="text-black font-medium">
              Existem {expiredCount} reuniões com data expirada aguardando ação
              do time comercial.
            </span>
          ),
          style: {
            backgroundColor: '#fffbeb',
            color: '#b45309',
            borderColor: '#fde68a',
          },
          duration: 8000,
        })
        setExpiredToastShown(true)
      }
    }
  }, [leads, currentUser, expiredToastShown])

  const [formData, setFormData] = useState({
    contact: '',
    company: '',
    email: '',
    phone: '',
    city: '',
    status: 'Novo' as LeadStatus,
    country: 'Brazil' as Country,
    origin: 'Manual' as LeadOrigin,
    serviceType: 'Fee Mensal' as OppType,
    serviceName: '',
    oppValue: '',
    marketingStatus: '',
    objectives: '',
    notes: '',
    investsInMkt: false,
    hasAgency: false,
    product_id: '',
  })

  if (!currentUser) return null

  const filteredLeads = leads.filter((l) => {
    const matchRegion = filterRegion === 'all' || l.country === filterRegion
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    const matchOrigin = filterOrigin === 'all' || l.origin === filterOrigin
    const matchProduct =
      filterProduct === 'all' || l.product_id === filterProduct
    const matchSearch =
      searchTerm === '' ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
    return (
      matchRegion && matchStatus && matchOrigin && matchProduct && matchSearch
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.contact ||
      !formData.company ||
      !formData.email ||
      !formData.phone
    )
      return

    const payload = {
      contact: formData.contact,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      status: formData.status,
      country: formData.country,
      origin: formData.origin,
      marketingStatus: formData.marketingStatus,
      objectives: formData.objectives,
      notes: formData.notes,
      userId: currentUser.role === 'ADMIN' ? null : currentUser.id,
      investsInMkt: formData.investsInMkt,
      hasAgency: formData.hasAgency,
    } as any

    if (formData.product_id) {
      payload.product_id = formData.product_id
    }

    payload.estimatedValue = formData.oppValue ? Number(formData.oppValue) : 0

    await addLead(payload)

    setIsOpen(false)
    setFormData({
      contact: '',
      company: '',
      email: '',
      phone: '',
      city: '',
      status: 'Novo',
      country: 'Brazil',
      origin: 'Manual',
      serviceType: 'Fee Mensal',
      serviceName: '',
      oppValue: '',
      marketingStatus: '',
      objectives: '',
      notes: '',
      investsInMkt: false,
      hasAgency: false,
      product_id: '',
    })
  }

  const handleAddMeeting = () => {
    if (currentUser?.role === 'ADMIN') {
      toast.error('Ação não permitida', {
        description: (
          <span className="text-black font-medium">
            Apenas usuários comerciais podem registrar reuniões.
          </span>
        ),
        style: {
          backgroundColor: '#fef2f2',
          color: '#000000',
          borderColor: '#fecaca',
        },
      })
      return
    }
    if (!editLead || !newMeetingDate) return
    const updatedMeetings = [
      {
        id: Math.random().toString(),
        date: new Date(newMeetingDate).toISOString(),
        notes: newMeetingNotes,
      },
      ...editLead.meetings,
    ]

    const newStatus =
      editLead.status === 'Novo' ? 'Qualificado' : editLead.status

    updateLead(editLead.id, {
      meetings: updatedMeetings,
      scheduledMeetingDate: '',
      status: newStatus,
      ...(currentUser?.role === 'COMMERCIAL' ? { userId: currentUser.id } : {}),
    }) // Clear schedule after meeting happens

    setEditLead({
      ...editLead,
      meetings: updatedMeetings,
      scheduledMeetingDate: '',
      status: newStatus,
      ...(currentUser?.role === 'COMMERCIAL' ? { userId: currentUser.id } : {}),
    })
    setNewMeetingDate('')
    setNewMeetingNotes('')
  }

  const handleScheduleMeeting = async () => {
    if (!scheduleLead || !scheduleFormData.date) return

    const updatePayload: Partial<Lead> = {
      scheduledMeetingDate: scheduleFormData.date,
      notes: scheduleFormData.notes,
    }

    if (
      currentUser?.role === 'COMMERCIAL' &&
      (!scheduleLead.userId || scheduleLead.userId !== currentUser.id)
    ) {
      updatePayload.userId = currentUser.id
    }

    await updateLead(scheduleLead.id, updatePayload)
    setScheduleLead(null)
    setScheduleFormData({ date: '', notes: '' })
    toast.success('Reunião agendada com sucesso!')
  }

  const handleConcludeMeeting = async () => {
    if (!concludeLead) return

    const updatedMeetings = [
      {
        id: Math.random().toString(),
        date: concludeLead.scheduledMeetingDate || new Date().toISOString(),
        notes: concludeFormData.notes,
      },
      ...concludeLead.meetings,
    ]

    await updateLead(concludeLead.id, {
      meetings: updatedMeetings,
      scheduledMeetingDate: '',
      status:
        concludeLead.status === 'Novo' ? 'Qualificado' : concludeLead.status,
      ...(currentUser?.role === 'COMMERCIAL' ? { userId: currentUser.id } : {}),
    })

    setConcludeLead(null)
    setConcludeFormData({ notes: '' })
    toast.success('Reunião concluída com sucesso!')
  }

  const handleCancelMeeting = async (lead: Lead) => {
    if (currentUser?.role === 'ADMIN') {
      toast.error('Ação não permitida', {
        description: (
          <span className="text-black font-medium">
            Apenas usuários comerciais podem cancelar reuniões.
          </span>
        ),
        style: {
          backgroundColor: '#fef2f2',
          color: '#000000',
          borderColor: '#fecaca',
        },
      })
      return
    }
    await updateLead(lead.id, {
      scheduledMeetingDate: '',
    })
    toast.success('Reunião cancelada.')
  }

  const getStatusColor = (status: LeadStatus) => {
    const colors: Record<string, string> = {
      Novo: 'bg-blue-100 text-blue-700',
      Qualificado: 'bg-yellow-100 text-yellow-700',
      'Em Negociação': 'bg-purple-100 text-purple-700',
      Ganho: 'bg-green-100 text-green-700',
      Perdido: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pipeline de Leads Avançado
            </h1>
            <p className="text-muted-foreground text-sm">
              Gestão de prospecção, reuniões e funil inicial
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#227b50] hover:bg-[#1a5c3c] text-white rounded-full px-6 shadow-md shadow-[#227b50]/20">
              <Plus className="w-4 h-4 mr-2" /> Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastro de Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-sm font-medium">
                    Razão Social / Empresa
                  </label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-sm font-medium">Nome do Contato</label>
                  <Input
                    required
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    type="tel"
                    required
                    value={formData.phone}
                    placeholder={
                      formData.country === 'Brazil'
                        ? '(00) 00000-0000'
                        : '(000) 000-0000'
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: formatPhone(e.target.value, formData.country),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">País</label>
                  <Select
                    value={formData.country}
                    onValueChange={(v: Country) =>
                      setFormData({
                        ...formData,
                        country: v,
                        phone: formatPhone(formData.phone, v),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Brazil">Brasil</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Produto de Interesse
                  </label>
                  <Select
                    value={formData.product_id || undefined}
                    onValueChange={(v) => {
                      const prod = products.find((p) => p.id === v)
                      setFormData({
                        ...formData,
                        product_id: v,
                        oppValue: prod
                          ? prod.price.toString()
                          : formData.oppValue,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((cat) => {
                        const catProducts = products.filter(
                          (p) => p.categoryId === cat.id,
                        )
                        if (catProducts.length === 0) return null
                        return (
                          <SelectGroup key={cat.id}>
                            <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                              {cat.name}
                            </SelectLabel>
                            {catProducts.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                      {products.filter((p) => !p.categoryId).length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                            Outros
                          </SelectLabel>
                          {products
                            .filter((p) => !p.categoryId)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Valor Estimado (R$)
                  </label>
                  <Input
                    type="number"
                    value={formData.oppValue}
                    onChange={(e) =>
                      setFormData({ ...formData, oppValue: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={!formData.product_id}
                  />
                </div>
                <div className="col-span-2 flex gap-6 mt-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-[#227b50] focus:ring-[#227b50] w-4 h-4"
                      checked={formData.investsInMkt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          investsInMkt: e.target.checked,
                        })
                      }
                    />
                    Já investe em MKT?
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-[#227b50] focus:ring-[#227b50] w-4 h-4"
                      checked={formData.hasAgency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hasAgency: e.target.checked,
                        })
                      }
                    />
                    Já possui agência?
                  </label>
                </div>
              </div>
              <DialogFooter className="mt-6 pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  className="bg-[#227b50] hover:bg-[#1a5c3c] text-white w-full"
                  disabled={
                    !formData.company.trim() ||
                    !formData.contact.trim() ||
                    !formData.email.trim() ||
                    !formData.phone.trim() ||
                    !formData.product_id ||
                    formData.oppValue === ''
                  }
                >
                  Salvar Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar leads..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Qualificado">Qualificado</SelectItem>
              <SelectItem value="Em Negociação">Em Negociação</SelectItem>
              <SelectItem value="Ganho">Ganho</SelectItem>
              <SelectItem value="Perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Regiões</SelectItem>
              <SelectItem value="Brazil">Brasil</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOrigin} onValueChange={setFilterOrigin}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              <SelectItem value="Site">Site</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Indicação">Indicação</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Produto/Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Produtos</SelectItem>
              {productCategories.map((cat) => {
                const catProducts = products.filter(
                  (p) => p.categoryId === cat.id,
                )
                if (catProducts.length === 0) return null
                return (
                  <SelectGroup key={cat.id}>
                    <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                      {cat.name}
                    </SelectLabel>
                    {catProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )
              })}
              {products.filter((p) => !p.categoryId).length > 0 && (
                <SelectGroup>
                  <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                    Outros
                  </SelectLabel>
                  {products
                    .filter((p) => !p.categoryId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-900"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#227b50]/10 text-[#227b50] rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nenhum lead encontrado
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Nenhum lead corresponde aos critérios de busca ou sua base está
              vazia. Adicione um novo lead.
            </p>
            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              className="border-[#227b50]/30 text-[#227b50] hover:bg-[#227b50]/10 hover:text-[#1a5c3c]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Lead
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Empresa / Cliente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Objetivo Principal / Produtos</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      Status
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-900 text-white max-w-xs text-xs font-normal">
                          <p>
                            Altere o status do lead rapidamente por aqui. Note
                            que algumas transições exigem reuniões concluídas ou
                            oportunidades associadas.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>Próxima Reunião</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.slice(0, 50).map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50 group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900">
                          {lead.company}
                        </div>
                        {lead.meetings.length > 0 &&
                        opportunities.some((o) => o.leadId === lead.id) &&
                        lead.investsInMkt &&
                        lead.hasAgency ? (
                          <Badge
                            variant="default"
                            className="bg-orange-500 hover:bg-orange-600 text-[10px] px-1.5 py-0 h-4"
                          >
                            QUENTE
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-[10px] px-1.5 py-0 h-4 shadow-none border-0"
                          >
                            ESFRIANDO
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <span className="text-sm">
                          {lead.country === 'USA' ? '🇺🇸' : '🇧🇷'}
                        </span>
                        {lead.city || lead.country} • {lead.contact}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.userId ? (
                        <div className="text-sm font-medium text-gray-700">
                          {users.find((u) => u.id === lead.userId)?.name || '-'}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-600 font-normal"
                      >
                        {lead.origin}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] text-sm text-gray-600">
                      <div className="flex flex-col gap-1 items-start">
                        {lead.product_id &&
                          products.find((p) => p.id === lead.product_id) && (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-600 font-normal"
                            >
                              {(() => {
                                const prod = products.find(
                                  (p) => p.id === lead.product_id,
                                )
                                const cat = productCategories.find(
                                  (c) => c.id === prod?.categoryId,
                                )
                                return cat
                                  ? `${prod?.name} / ${cat.name}`
                                  : prod?.name
                              })()}
                            </Badge>
                          )}
                        {lead.objectives &&
                          lead.objectives !== 'Não informado' && (
                            <span
                              className="truncate w-full text-xs text-gray-500"
                              title={lead.objectives}
                            >
                              {lead.objectives}
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="inline-block"
                        onClick={() => {
                          if (
                            currentUser.role !== 'ADMIN' &&
                            lead.userId &&
                            lead.userId !== currentUser.id
                          ) {
                            toast.error('Ação Bloqueada', {
                              description:
                                'Apenas o responsável ou um administrador pode alterar o status deste lead.',
                            })
                          }
                        }}
                      >
                        <Select
                          value={lead.status}
                          disabled={
                            lead.status === 'Perdido' ||
                            lead.status === 'Ganho' ||
                            !(
                              currentUser.role === 'ADMIN' ||
                              lead.userId === currentUser.id ||
                              !lead.userId
                            )
                          }
                          onValueChange={async (v) => {
                            if (
                              lead.status === 'Em Negociação' &&
                              v === 'Qualificado'
                            ) {
                              toast.error('Operação não permitida', {
                                description: (
                                  <span className="text-black font-medium">
                                    Não é possível retroceder um lead "Em
                                    Negociação" para "Qualificado".
                                  </span>
                                ),
                                style: {
                                  backgroundColor: '#fef2f2',
                                  color: '#000000',
                                  borderColor: '#fecaca',
                                },
                              })
                              return
                            }
                            if (
                              [
                                'Qualificado',
                                'Em Negociação',
                                'Ganho',
                              ].includes(v) &&
                              lead.meetings.length === 0
                            ) {
                              toast.error('Reunião pendente', {
                                description: (
                                  <span className="text-black font-medium">
                                    É necessário ter pelo menos uma reunião
                                    concluída para avançar o lead para esta
                                    etapa.
                                  </span>
                                ),
                                style: {
                                  backgroundColor: '#fef2f2',
                                  color: '#000000',
                                  borderColor: '#fecaca',
                                },
                              })
                              return
                            }
                            if (['Em Negociação', 'Ganho'].includes(v)) {
                              const hasOpp = opportunities.some(
                                (o) => o.leadId === lead.id,
                              )
                              if (!hasOpp) {
                                toast.error('Oportunidade pendente', {
                                  description: (
                                    <span className="text-black font-medium">
                                      É necessário criar uma oportunidade para
                                      este lead antes de avançá-lo para Em
                                      Negociação.
                                    </span>
                                  ),
                                  style: {
                                    backgroundColor: '#fef2f2',
                                    color: '#000000',
                                    borderColor: '#fecaca',
                                  },
                                })
                                return
                              }
                            }
                            if (
                              lead.status === 'Em Negociação' &&
                              ['Ganho', 'Perdido'].includes(v)
                            ) {
                              const opp = opportunities.find(
                                (o) => o.leadId === lead.id,
                              )
                              if (
                                opp &&
                                !['Ganha', 'Perdida'].includes(opp.status)
                              ) {
                                toast.error('Oportunidade em andamento', {
                                  description: (
                                    <span className="text-black font-medium">
                                      Não é possível avançar o status do lead
                                      para Ganho ou Perdido enquanto a
                                      oportunidade não for concluída.
                                    </span>
                                  ),
                                  style: {
                                    backgroundColor: '#fef2f2',
                                    color: '#000000',
                                    borderColor: '#fecaca',
                                  },
                                })
                                return
                              }
                            }
                            const updatePayload: any = {
                              status: v as LeadStatus,
                            }
                            if (
                              v === 'Em Negociação' &&
                              currentUser.role !== 'ADMIN'
                            ) {
                              updatePayload.userId = currentUser.id
                            }
                            await updateLead(lead.id, updatePayload)
                            if (v === 'Ganho') {
                              toast.success(
                                'Parabéns! Cliente criado com sucesso a partir do lead ganho',
                              )
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'w-[140px] h-8 text-xs font-semibold border-0',
                              getStatusColor(lead.status),
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              'Novo',
                              'Qualificado',
                              'Em Negociação',
                              'Ganho',
                              'Perdido',
                            ].map((s) => (
                              <SelectItem
                                key={s}
                                value={s}
                                disabled={
                                  (s === 'Novo' && lead.status !== 'Novo') ||
                                  (lead.status === 'Em Negociação' &&
                                    s === 'Qualificado')
                                }
                              >
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.status === 'Perdido' ? (
                        <span className="text-gray-400 text-xs">-</span>
                      ) : !lead.scheduledMeetingDate ? (
                        lead.status === 'Novo' &&
                        currentUser.role !== 'ADMIN' &&
                        (lead.userId === currentUser.id || !lead.userId) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 px-2"
                            onClick={() => {
                              setScheduleLead(lead)
                              setScheduleFormData({
                                date: '',
                                notes: lead.notes || '',
                              })
                            }}
                          >
                            <CalendarDays className="w-3 h-3 mr-1" />
                            Agendar
                          </Button>
                        ) : (lead.status === 'Em Negociação' ||
                            lead.status === 'Qualificado') &&
                          lead.meetings.length > 0 ? (
                          <Badge
                            variant="outline"
                            className="flex w-max gap-1 items-center shadow-none text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {format(
                              new Date(
                                [...lead.meetings].sort(
                                  (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime(),
                                )[0].date,
                              ),
                              'dd/MM/yy HH:mm',
                            )}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'flex w-max gap-1 items-center shadow-none text-[10px] px-1.5 py-0',
                              new Date(lead.scheduledMeetingDate) < new Date()
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-orange-50 text-orange-700 border-orange-200',
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {format(
                              new Date(lead.scheduledMeetingDate),
                              'dd/MM/yy HH:mm',
                            )}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {new Date(lead.scheduledMeetingDate) < new Date() &&
                            currentUser.role !== 'ADMIN' &&
                            (lead.userId === currentUser.id || !lead.userId) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  setScheduleLead(lead)
                                  setScheduleFormData({
                                    date:
                                      lead.scheduledMeetingDate?.substring(
                                        0,
                                        16,
                                      ) || '',
                                    notes: lead.notes || '',
                                  })
                                }}
                              >
                                Reagendar
                              </Button>
                            ) : null}
                            {currentUser.role !== 'ADMIN' &&
                              (lead.userId === currentUser.id ||
                                !lead.userId) &&
                              new Date(lead.scheduledMeetingDate) >=
                                new Date() && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0 bg-white text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => {
                                      setConcludeLead(lead)
                                      setConcludeFormData({ notes: '' })
                                    }}
                                    title="Concluir"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0 bg-white text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleCancelMeeting(lead)}
                                    title="Cancelar"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(currentUser.role === 'ADMIN' ||
                          lead.userId === currentUser.id ||
                          !lead.userId) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewLead(lead)}
                            className="text-blue-500 hover:text-blue-700 h-8 px-2"
                            title="Informações"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {lead.status !== 'Ganho' &&
                          lead.status !== 'Perdido' &&
                          (currentUser.role === 'ADMIN' ||
                            lead.userId === currentUser.id ||
                            !lead.userId) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditLead(lead)}
                              className="text-gray-500 hover:text-[#227b50] h-8 px-2"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={!!scheduleLead}
        onOpenChange={(open) => !open && setScheduleLead(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scheduleLead?.scheduledMeetingDate &&
              new Date(scheduleLead.scheduledMeetingDate) < new Date()
                ? 'Reagendar Reunião'
                : 'Agendar Reunião'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Data e Hora</label>
              <Input
                type="datetime-local"
                value={scheduleFormData.date}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    date: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                value={scheduleFormData.notes}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    notes: e.target.value,
                  })
                }
                placeholder="Observações iniciais para a reunião..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setScheduleLead(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#227b50] hover:bg-[#1a5c3c] text-white"
              onClick={handleScheduleMeeting}
              disabled={!scheduleFormData.date}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!concludeLead}
        onOpenChange={(open) => !open && setConcludeLead(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">
                Resumo / Notas da Reunião
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                value={concludeFormData.notes}
                onChange={(e) =>
                  setConcludeFormData({
                    ...concludeFormData,
                    notes: e.target.value,
                  })
                }
                placeholder="O que foi discutido?"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setConcludeLead(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConcludeMeeting}
            >
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewLead}
        onOpenChange={(open) => !open && setViewLead(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Detalhes do Lead
              {viewLead && (
                <Badge
                  className={cn(
                    'border-0 font-medium px-2.5 py-0.5 text-xs shadow-none',
                    getStatusColor(viewLead.status),
                  )}
                >
                  {viewLead.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Empresa
                  </span>
                  <span className="text-gray-900">{viewLead.company}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Contato
                  </span>
                  <span className="text-gray-900">{viewLead.contact}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    E-mail
                  </span>
                  <span className="text-gray-900">{viewLead.email || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Telefone
                  </span>
                  <span className="text-gray-900">{viewLead.phone || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    País/Cidade
                  </span>
                  <span className="text-gray-900">
                    {viewLead.country}{' '}
                    {viewLead.city ? `- ${viewLead.city}` : ''}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Origem
                  </span>
                  <span className="text-gray-900">{viewLead.origin}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Status
                  </span>
                  <span className="text-gray-900 font-medium">
                    {viewLead.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Produto de Interesse
                  </span>
                  <span className="text-gray-900">
                    {products.find((p) => p.id === viewLead.product_id)?.name ||
                      '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Valor Estimado
                  </span>
                  <span className="text-gray-900">
                    {viewLead.estimatedValue
                      ? new Intl.NumberFormat(
                          viewLead.country === 'USA' ? 'en-US' : 'pt-BR',
                          {
                            style: 'currency',
                            currency:
                              viewLead.country === 'USA' ? 'USD' : 'BRL',
                          },
                        ).format(viewLead.estimatedValue)
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Marketing & Agência
                  </span>
                  <div className="flex flex-col gap-1 text-gray-900">
                    <span>
                      Investe em Mkt:{' '}
                      <span className="font-medium">
                        {viewLead.investsInMkt ? 'Sim' : 'Não'}
                      </span>
                    </span>
                    <span>
                      Possui Agência:{' '}
                      <span className="font-medium">
                        {viewLead.hasAgency ? 'Sim' : 'Não'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-500 block mb-1">
                    Objetivos
                  </span>
                  <p className="whitespace-pre-wrap text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {viewLead.objectives || 'Nenhum objetivo registrado.'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-500 block mb-1">
                    Notas Adicionais
                  </span>
                  <p className="whitespace-pre-wrap text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {viewLead.notes || 'Nenhuma nota registrada.'}
                  </p>
                </div>
              </div>

              {viewLead.meetings && viewLead.meetings.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" /> Histórico
                    de Reuniões
                  </h4>
                  <div className="space-y-3">
                    {viewLead.meetings.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                      >
                        <div className="font-semibold text-gray-900 text-xs mb-1.5 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          {format(new Date(m.date), 'dd/MM/yyyy HH:mm')}
                        </div>
                        <div className="text-gray-600 pl-5">
                          {m.notes || 'Sem anotações.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editLead}
        onOpenChange={(open) => !open && setEditLead(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Informações & Reuniões</DialogTitle>
          </DialogHeader>
          {editLead && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Razão Social / Empresa
                  </label>
                  <Input
                    value={editLead.company}
                    disabled
                    onChange={(e) =>
                      setEditLead({ ...editLead, company: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Agendar Nova (Data)
                  </label>
                  <Input
                    type="datetime-local"
                    value={
                      editLead.scheduledMeetingDate?.substring(0, 16) || ''
                    }
                    onChange={(e) => {
                      if (currentUser?.role === 'ADMIN') {
                        toast.error('Ação não permitida', {
                          description: (
                            <span className="text-black font-medium">
                              Apenas usuários comerciais podem agendar reuniões.
                            </span>
                          ),
                          style: {
                            backgroundColor: '#fef2f2',
                            color: '#000000',
                            borderColor: '#fecaca',
                          },
                        })
                        return
                      }
                      setEditLead({
                        ...editLead,
                        scheduledMeetingDate: e.target.value,
                        ...(currentUser?.role === 'COMMERCIAL'
                          ? { userId: currentUser.id }
                          : {}),
                      })
                    }}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium">
                    Produto de Interesse
                  </label>
                  <Select
                    value={editLead.product_id || undefined}
                    disabled
                    onValueChange={(v) => {
                      const prod = products.find((p) => p.id === v)
                      setEditLead({
                        ...editLead,
                        product_id: v,
                        estimatedValue: prod
                          ? prod.price
                          : editLead.estimatedValue,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((cat) => {
                        const catProducts = products.filter(
                          (p) => p.categoryId === cat.id,
                        )
                        if (catProducts.length === 0) return null
                        return (
                          <SelectGroup key={cat.id}>
                            <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                              {cat.name}
                            </SelectLabel>
                            {catProducts.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                      {products.filter((p) => !p.categoryId).length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                            Outros
                          </SelectLabel>
                          {products
                            .filter((p) => !p.categoryId)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium">
                    Valor Estimado (R$)
                  </label>
                  <Input
                    type="number"
                    value={editLead.estimatedValue || ''}
                    onChange={(e) =>
                      setEditLead({
                        ...editLead,
                        estimatedValue: Number(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    disabled={!editLead.product_id}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={editLead.email || ''}
                      disabled
                      className="pr-10"
                      onChange={(e) =>
                        setEditLead({ ...editLead, email: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700 hover:bg-transparent"
                      onClick={() => {
                        if (editLead.email) {
                          navigator.clipboard.writeText(editLead.email)
                          toast.success('E-mail copiado!')
                        }
                      }}
                      title="Copiar e-mail"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      value={editLead.phone || ''}
                      disabled
                      className="pr-10"
                      onChange={(e) =>
                        setEditLead({ ...editLead, phone: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700 hover:bg-transparent"
                      onClick={() => {
                        if (editLead.phone) {
                          navigator.clipboard.writeText(editLead.phone)
                          toast.success('Telefone copiado!')
                        }
                      }}
                      title="Copiar telefone"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">
                    Objetivos com a agência
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    value={editLead.objectives}
                    onChange={(e) =>
                      setEditLead({ ...editLead, objectives: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 flex gap-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-gray-600">Já investe em MKT?</span>
                    {editLead.investsInMkt ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none px-2 py-0 border-0"
                      >
                        Sim
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-gray-200 text-gray-700 hover:bg-gray-200 shadow-none px-2 py-0 border-0"
                      >
                        Não
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-gray-600">Já possui agência?</span>
                    {editLead.hasAgency ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none px-2 py-0 border-0"
                      >
                        Sim
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-gray-200 text-gray-700 hover:bg-gray-200 shadow-none px-2 py-0 border-0"
                      >
                        Não
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Histórico de Reuniões
                </h4>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {editLead.meetings?.length > 0 ? (
                    editLead.meetings.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 bg-white border border-gray-200 rounded text-sm shadow-sm"
                      >
                        <div className="font-semibold text-gray-900 text-xs mb-1">
                          {format(new Date(m.date), 'dd/MM/yyyy HH:mm')}
                        </div>
                        <div className="text-gray-600">{m.notes}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">
                      Nenhuma reunião registrada.
                    </p>
                  )}
                </div>
                {editLead.meetings?.length > 0 ? (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2.5 rounded-md border border-green-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">
                        Reunião concluída em{' '}
                        {format(
                          new Date(
                            [...editLead.meetings].sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime(),
                            )[0].date,
                          ),
                          'dd/MM/yyyy HH:mm',
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h5 className="font-medium text-xs text-gray-700">
                      Registrar Reunião Concluída
                    </h5>
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        className="flex-1 text-xs h-8"
                        value={newMeetingDate}
                        onChange={(e) => setNewMeetingDate(e.target.value)}
                      />
                      <Input
                        placeholder="Notas da reunião..."
                        className="flex-2 text-xs h-8"
                        value={newMeetingNotes}
                        onChange={(e) => setNewMeetingNotes(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-gray-900 text-white hover:bg-black"
                        onClick={handleAddMeeting}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  updateLead(editLead.id, editLead)
                  setEditLead(null)
                }}
                className="w-full bg-[#227b50] hover:bg-[#1a5c3c] text-white"
                disabled={
                  !editLead.company.trim() ||
                  !editLead.email.trim() ||
                  !editLead.phone.trim() ||
                  !editLead.product_id ||
                  editLead.estimatedValue === null ||
                  editLead.estimatedValue === undefined
                }
              >
                Salvar Alterações Gerais
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useToast } from '@/components/ui/use-toast'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast: shadcnToast } = useToast()
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
    interestMappings,
  } = useDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const filterRegion = searchParams.get('region') || 'all'
  const filterStatus = searchParams.get('status') || 'all'
  const filterOrigin = searchParams.get('origin') || 'all'
  const filterProduct = searchParams.get('product') || 'all'
  const filterUser = searchParams.get('user') || 'all'
  const filterStartDate = searchParams.get('start_date') || ''
  const filterEndDate = searchParams.get('end_date') || ''

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    searchParams.get('search') || '',
  )
  const [newMeetingDate, setNewMeetingDate] = useState('')
  const [newMeetingNotes, setNewMeetingNotes] = useState('')

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const [totalCount, setTotalCount] = useState(0)
  const [paginatedLeads, setPaginatedLeads] = useState<Lead[]>([])
  const [isFetchingLeads, setIsFetchingLeads] = useState(false)
  const itemsPerPage = 10

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'all') {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set('page', '1')
      return next
    })
  }

  const setFilterRegion = (val: string) => updateFilter('region', val)
  const setFilterStatus = (val: string) => updateFilter('status', val)
  const setFilterOrigin = (val: string) => updateFilter('origin', val)
  const setFilterProduct = (val: string) => updateFilter('product', val)
  const setFilterUser = (val: string) => updateFilter('user', val)
  const setFilterStartDate = (val: string) => updateFilter('start_date', val)
  const setFilterEndDate = (val: string) => updateFilter('end_date', val)
  const setCurrentPage = (val: number | ((p: number) => number)) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', newPage.toString())
      return next
    })
  }

  const hasActiveFilters =
    filterRegion !== 'all' ||
    filterStatus !== 'all' ||
    filterOrigin !== 'all' ||
    filterProduct !== 'all' ||
    filterUser !== 'all' ||
    filterStartDate !== '' ||
    filterEndDate !== '' ||
    debouncedSearchTerm !== ''

  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('region')
      next.delete('status')
      next.delete('origin')
      next.delete('product')
      next.delete('user')
      next.delete('search')
      next.delete('start_date')
      next.delete('end_date')
      next.set('page', '1')
      return next
    })
  }

  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) {
        setDebouncedSearchTerm(searchTerm)
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (searchTerm) {
              next.set('search', searchTerm)
            } else {
              next.delete('search')
            }
            next.set('page', '1')
            return next
          },
          { replace: true },
        )
      }
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm, debouncedSearchTerm, setSearchParams])

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    if (searchFromUrl !== debouncedSearchTerm) {
      setSearchTerm(searchFromUrl)
      setDebouncedSearchTerm(searchFromUrl)
    }
  }, [searchParams, debouncedSearchTerm])

  const fetchLeads = useCallback(async () => {
    setIsFetchingLeads(true)
    try {
      let query = supabase
        .from('leads')
        .select('*, meetings(*), lead_products(*)', { count: 'exact' })

      if (filterRegion !== 'all') query = query.eq('country', filterRegion)
      if (filterStatus !== 'all') query = query.eq('status', filterStatus)
      if (filterOrigin !== 'all') query = query.eq('origin', filterOrigin)
      if (filterUser !== 'all') query = query.eq('user_id', filterUser)
      if (filterProduct !== 'all') query = query.eq('product_id', filterProduct)
      if (filterStartDate)
        query = query.gte('created_at', `${filterStartDate}T00:00:00.000Z`)
      if (filterEndDate)
        query = query.lte('created_at', `${filterEndDate}T23:59:59.999Z`)
      if (debouncedSearchTerm) {
        query = query.or(
          `contact.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`,
        )
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      query = query
        .order('status_priority', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, count, error } = await query

      if (error) throw error

      if (data) {
        const mappedLeads: Lead[] = data.map((lead: any) => ({
          id: lead.id,
          userId: lead.user_id,
          contact: lead.contact,
          company: lead.company,
          email: lead.email || '',
          phone: lead.phone || '',
          status: lead.status as LeadStatus,
          country: lead.country as Country,
          city: lead.city || '',
          origin: lead.origin as LeadOrigin,
          marketingStatus: lead.marketing_status || '',
          objectives: lead.objectives || '',
          notes: lead.notes || '',
          scheduledMeetingDate: lead.scheduled_meeting_date || undefined,
          quantity: Number(lead.quantity) || 1,
          responded: lead.responded || false,
          product_id: lead.product_id || undefined,
          estimatedValue: lead.estimated_value
            ? Number(lead.estimated_value)
            : undefined,
          cnpj: lead.cnpj || '',
          website: lead.website || '',
          instagram: lead.instagram || '',
          facebook: lead.facebook || '',
          createdAt: lead.created_at,
          categoryId: lead.category_id || undefined,
          leadProducts: (lead.lead_products || []).map((lp: any) => ({
            id: lp.id,
            leadId: lp.lead_id,
            productId: lp.product_id,
          })),
          meetings: (lead.meetings || [])
            .map((m: any) => ({
              id: m.id,
              date: m.date,
              notes: m.notes || '',
            }))
            .sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            ),
        }))

        setPaginatedLeads(mappedLeads)
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setIsFetchingLeads(false)
    }
  }, [
    currentPage,
    filterRegion,
    filterStatus,
    filterOrigin,
    filterUser,
    filterProduct,
    filterStartDate,
    filterEndDate,
    debouncedSearchTerm,
  ])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])
  const [scheduleFormData, setScheduleFormData] = useState({
    date: '',
    notes: '',
  })

  const [concludeLead, setConcludeLead] = useState<Lead | null>(null)
  const [concludeFormData, setConcludeFormData] = useState({ notes: '' })
  const [expiredToastShown, setExpiredToastShown] = useState(false)

  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam && leads.length > 0) {
      const targetLead = leads.find((l) => l.id === idParam)
      if (targetLead) {
        setViewLead(targetLead)
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('id')
            return next
          },
          { replace: true },
        )
      }
    }
  }, [searchParams, leads, setSearchParams])

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
    quantity: 1,
    product_id: '',
    responded: false,
  })

  if (!currentUser) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.contact || !formData.email || !formData.phone) return

    const payload = {
      contact: formData.contact,
      company: formData.contact,
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
      quantity: formData.quantity,
      responded: formData.responded,
    } as any

    if (formData.product_id) {
      payload.product_id = formData.product_id
    }

    payload.estimatedValue = formData.oppValue
      ? Number(formData.oppValue.replace(/\D/g, '')) / 100
      : 0

    try {
      await addLead(payload)
      setIsOpen(false)
      toast.success('Lead salvo com sucesso!')
      fetchLeads()
      setFormData({
        contact: '',
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
        quantity: 1,
        product_id: '',
        responded: false,
      })
    } catch (err: any) {
      toast.error('Erro ao salvar lead', {
        description: err.message || 'Verifique os campos e tente novamente.',
      })
    }
  }

  const handleAddMeeting = async () => {
    if (currentUser?.role === 'ADMIN') {
      shadcnToast({
        title:
          'Acesso restrito: apenas um usuário comercial pode agendar uma visita.',
        variant: 'destructive',
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

    await updateLead(editLead.id, {
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
    fetchLeads()
  }

  const handleScheduleMeeting = async () => {
    if (currentUser?.role === 'ADMIN') {
      shadcnToast({
        title:
          'Acesso restrito: apenas um usuário comercial pode agendar uma visita.',
        variant: 'destructive',
      })
      return
    }
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
    fetchLeads()
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
    fetchLeads()
  }

  const handleCancelMeeting = async (lead: Lead) => {
    await updateLead(lead.id, {
      scheduledMeetingDate: '',
    })
    toast.success('Reunião cancelada.')
    fetchLeads()
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
                <div className="col-span-2">
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
                      <SelectItem value="USA">Internacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Interesse</label>
                  <Select
                    value={formData.product_id || undefined}
                    onValueChange={(v) => {
                      const prod = products.find((p) => p.id === v)
                      setFormData({
                        ...formData,
                        product_id: v,
                        oppValue: prod
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(prod.price * formData.quantity)
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
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1
                      const prod = products.find(
                        (p) => p.id === formData.product_id,
                      )
                      setFormData({
                        ...formData,
                        quantity: qty,
                        oppValue: prod
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(prod.price * qty)
                          : formData.oppValue,
                      })
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Estimado</label>
                  <Input
                    type="text"
                    value={formData.oppValue}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '')
                      const num = Number(digits) / 100
                      if (!isNaN(num)) {
                        setFormData({
                          ...formData,
                          oppValue: new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(num),
                        })
                      }
                    }}
                    placeholder="R$ 0,00"
                    disabled={!formData.product_id}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="responded-checkbox"
                    checked={formData.responded}
                    onChange={(e) =>
                      setFormData({ ...formData, responded: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#227b50] focus:ring-[#227b50]"
                  />
                  <label
                    htmlFor="responded-checkbox"
                    className="text-sm font-medium text-gray-700"
                  >
                    Lead já foi respondido / contatado?
                  </label>
                </div>
              </div>
              <DialogFooter className="mt-6 pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  className="bg-[#227b50] hover:bg-[#1a5c3c] text-white w-full"
                  disabled={
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
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-10 shadow-sm flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-transparent text-sm outline-none w-auto text-gray-700 font-medium cursor-pointer"
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-transparent text-sm outline-none w-auto text-gray-700 font-medium cursor-pointer"
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
              <SelectItem value="USA">Internacional</SelectItem>
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
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Responsáveis</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
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

        {paginatedLeads.length === 0 && !isFetchingLeads ? (
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Objetivo Principal / Interesse</TableHead>
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
                  <TableHead className="text-center">Respondido</TableHead>
                  <TableHead>Próxima Reunião</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50 group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900">
                          {lead.contact}
                        </div>
                        {lead.meetings.length > 0 &&
                        opportunities.some((o) => o.leadId === lead.id) ? (
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
                        {lead.city || lead.country}
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
                          const isTerminal =
                            lead.status === 'Ganho' || lead.status === 'Perdido'
                          const notOwnerBlock =
                            currentUser.role !== 'ADMIN' &&
                            lead.userId &&
                            lead.userId !== currentUser.id

                          if (isTerminal) {
                            toast.error('Ação Bloqueada', {
                              description:
                                'Leads ganhos ou perdidos não podem ter seu status alterado.',
                            })
                          } else if (notOwnerBlock) {
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
                            fetchLeads()
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
                    <TableCell className="text-center">
                      <button
                        onClick={async () => {
                          await updateLead(lead.id, {
                            responded: !lead.responded,
                          })
                          fetchLeads()
                        }}
                        className="focus:outline-none"
                        title="Clique para alternar o status de resposta"
                      >
                        {lead.responded ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 shadow-none px-2 py-0 font-medium hover:bg-green-100 cursor-pointer"
                          >
                            Sim
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-500 border-gray-200 shadow-none px-2 py-0 font-medium hover:bg-gray-100 cursor-pointer"
                          >
                            Não
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {lead.status === 'Perdido' ? (
                        <span className="text-gray-400 text-xs">-</span>
                      ) : !lead.scheduledMeetingDate ? (
                        (currentUser.role === 'ADMIN' ||
                          lead.userId === currentUser.id ||
                          !lead.userId) &&
                        lead.status !== 'Ganho' ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            {lead.meetings.length > 0 && (
                              <Badge
                                variant="outline"
                                className="flex w-max gap-1 items-center shadow-none text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700 border-gray-200"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Última:{' '}
                                {format(
                                  new Date(
                                    [...lead.meetings].sort(
                                      (a, b) =>
                                        new Date(b.date).getTime() -
                                        new Date(a.date).getTime(),
                                    )[0].date,
                                  ),
                                  'dd/MM/yyyy HH:mm',
                                )}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-7 bg-[#227b50]/5 text-[#227b50] border-[#227b50]/20 hover:bg-[#227b50]/10 px-2"
                              onClick={() => {
                                if (currentUser?.role === 'ADMIN') {
                                  shadcnToast({
                                    title:
                                      'Acesso restrito: apenas um usuário comercial pode agendar uma visita.',
                                    variant: 'destructive',
                                  })
                                  return
                                }
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
                          </div>
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
                                : 'bg-[#227b50]/10 text-[#227b50] border-[#227b50]/20',
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {format(
                              new Date(lead.scheduledMeetingDate),
                              'dd/MM/yyyy HH:mm',
                            )}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {new Date(lead.scheduledMeetingDate) < new Date() &&
                            (currentUser.role === 'ADMIN' ||
                              lead.userId === currentUser.id ||
                              !lead.userId) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  if (currentUser?.role === 'ADMIN') {
                                    shadcnToast({
                                      title:
                                        'Acesso restrito: apenas um usuário comercial pode agendar uma visita.',
                                      variant: 'destructive',
                                    })
                                    return
                                  }
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
                                    className="h-6 w-6 p-0 bg-white text-[#227b50] border-[#227b50]/30 hover:bg-[#227b50]/10"
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

            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-500">
                Mostrando{' '}
                <span className="font-medium">
                  {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{' '}
                de <span className="font-medium">{totalCount}</span> leads
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isFetchingLeads}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <div className="text-sm font-medium text-gray-700 px-2">
                  Página {currentPage} de{' '}
                  {Math.max(1, Math.ceil(totalCount / itemsPerPage))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(totalCount / itemsPerPage), p + 1),
                    )
                  }
                  disabled={
                    currentPage ===
                      Math.max(1, Math.ceil(totalCount / itemsPerPage)) ||
                    isFetchingLeads
                  }
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
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
              className="bg-[#227b50] hover:bg-[#1a5c3c] text-white"
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
                    Interesse
                  </span>
                  <span className="text-gray-900">
                    {products.find((p) => p.id === viewLead.product_id)?.name ||
                      '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Produtos Relacionados
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewLead.leadProducts &&
                    viewLead.leadProducts.length > 0 ? (
                      viewLead.leadProducts.map((lp) => {
                        const p = products.find(
                          (prod) => prod.id === lp.productId,
                        )
                        return p ? (
                          <Badge
                            key={lp.id}
                            variant="outline"
                            className="bg-gray-50 text-gray-700 font-normal"
                          >
                            {p.name}
                          </Badge>
                        ) : null
                      })
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-500 block mb-1">
                    Produtos Recomendados
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(() => {
                      const recommended = new Set<string>()

                      if (viewLead.categoryId) {
                        products
                          .filter((p) => p.categoryId === viewLead.categoryId)
                          .forEach((p) => recommended.add(p.id))
                      }

                      const textToSearch =
                        `${viewLead.notes || ''} ${viewLead.objectives || ''}`.toLowerCase()
                      const matches = interestMappings
                        .filter((im) => {
                          if (!im.termPattern) return false
                          try {
                            const regex = new RegExp(im.termPattern, 'i')
                            return regex.test(textToSearch)
                          } catch (e) {
                            return textToSearch.includes(
                              im.termPattern.toLowerCase(),
                            )
                          }
                        })
                        .sort((a, b) => b.priority - a.priority)

                      matches.forEach((m) => {
                        if (m.productId) recommended.add(m.productId)
                        if (m.categoryId) {
                          products
                            .filter((p) => p.categoryId === m.categoryId)
                            .forEach((p) => recommended.add(p.id))
                        }
                      })

                      if (viewLead.product_id)
                        recommended.delete(viewLead.product_id)
                      if (viewLead.leadProducts) {
                        viewLead.leadProducts.forEach((lp) =>
                          recommended.delete(lp.productId),
                        )
                      }

                      if (recommended.size === 0) {
                        return (
                          <span className="text-gray-400 text-sm">
                            Nenhuma recomendação no momento.
                          </span>
                        )
                      }

                      return Array.from(recommended)
                        .slice(0, 5)
                        .map((id) => {
                          const p = products.find((prod) => prod.id === id)
                          return p ? (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm cursor-default"
                            >
                              ✨ {p.name}
                            </Badge>
                          ) : null
                        })
                    })()}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Valor Estimado
                  </span>
                  <span className="text-gray-900">
                    {viewLead.estimatedValue
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(viewLead.estimatedValue)
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Quantidade
                  </span>
                  <span className="text-gray-900">{viewLead.quantity}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-500 block mb-1">
                    Respondido
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="checkbox"
                      id={`view-responded-${viewLead.id}`}
                      checked={viewLead.responded || false}
                      onChange={async (e) => {
                        const val = e.target.checked
                        await updateLead(viewLead.id, { responded: val })
                        setViewLead({ ...viewLead, responded: val })
                        fetchLeads()
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#227b50] focus:ring-[#227b50] cursor-pointer"
                    />
                    <label
                      htmlFor={`view-responded-${viewLead.id}`}
                      className="text-sm text-gray-900 font-medium cursor-pointer select-none"
                    >
                      {viewLead.responded ? 'Sim' : 'Não'}
                    </label>
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
                  <label className="text-sm font-medium">Nome do Contato</label>
                  <Input
                    value={editLead.contact}
                    onChange={(e) =>
                      setEditLead({ ...editLead, contact: e.target.value })
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
                        shadcnToast({
                          title:
                            'Acesso restrito: apenas um usuário comercial pode agendar uma visita.',
                          variant: 'destructive',
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
                  <label className="text-sm font-medium">Interesse</label>
                  <Select
                    value={editLead.product_id || undefined}
                    disabled
                    onValueChange={(v) => {
                      const prod = products.find((p) => p.id === v)
                      setEditLead({
                        ...editLead,
                        product_id: v,
                        estimatedValue: prod
                          ? prod.price * (editLead.quantity || 1)
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
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={editLead.quantity || 1}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1
                      const prod = products.find(
                        (p) => p.id === editLead.product_id,
                      )
                      setEditLead({
                        ...editLead,
                        quantity: qty,
                        estimatedValue: prod
                          ? prod.price * qty
                          : editLead.estimatedValue,
                      })
                    }}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium">Valor Estimado</label>
                  <Input
                    type="text"
                    value={
                      editLead.estimatedValue !== undefined &&
                      editLead.estimatedValue !== null
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(editLead.estimatedValue)
                        : ''
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '')
                      const num = Number(digits) / 100
                      if (!isNaN(num)) {
                        setEditLead({
                          ...editLead,
                          estimatedValue: num,
                        })
                      }
                    }}
                    placeholder="R$ 0,00"
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
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="edit-responded-checkbox"
                    checked={editLead.responded || false}
                    onChange={(e) =>
                      setEditLead({ ...editLead, responded: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#227b50] focus:ring-[#227b50]"
                  />
                  <label
                    htmlFor="edit-responded-checkbox"
                    className="text-sm font-medium text-gray-700"
                  >
                    Lead já foi respondido / contatado?
                  </label>
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
                    <div className="flex items-center gap-2 text-sm text-[#227b50] bg-[#227b50]/5 p-2.5 rounded-md border border-[#227b50]/20">
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
                onClick={async () => {
                  await updateLead(editLead.id, editLead)
                  setEditLead(null)
                  fetchLeads()
                }}
                className="w-full bg-[#227b50] hover:bg-[#1a5c3c] text-white"
                disabled={
                  !editLead.contact.trim() ||
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

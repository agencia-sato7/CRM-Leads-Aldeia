import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Inbox,
  Handshake,
  Edit3,
  Filter,
  XCircle,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { useDataStore, OppType, OppStatus } from '@/stores/use-data-store'
import { toast } from 'sonner'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export default function Opportunities() {
  const {
    opportunities,
    leads,
    products,
    productCategories,
    brands,
    users,
    addOpportunity,
    updateOpportunityStatus,
    updateOpportunity,
    updateLead,
    interestMappings,
    currentUser,
    fetchOpportunities,
  } = useDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const startDateParam = searchParams.get('startDate') || ''
  const endDateParam = searchParams.get('endDate') || ''

  useEffect(() => {
    fetchOpportunities(startDateParam || undefined, endDateParam || undefined)
  }, [startDateParam, endDateParam, fetchOpportunities])

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      if (type === 'start') newParams.set('startDate', value)
      if (type === 'end') newParams.set('endDate', value)
    } else {
      if (type === 'start') newParams.delete('startDate')
      if (type === 'end') newParams.delete('endDate')
    }
    setSearchParams(newParams)
  }
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProduct, setFilterProduct] = useState<string>('all')
  const [searchLead, setSearchLead] = useState('')

  const [viewLead, setViewLead] = useState<any | null>(null)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Novo: 'bg-blue-100 text-blue-700',
      Qualificado: 'bg-yellow-100 text-yellow-700',
      'Em Negociação': 'bg-purple-100 text-purple-700',
      Ganho: 'bg-green-100 text-green-700',
      Perdido: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const [formData, setFormData] = useState({
    leadId: '',
    categoryId: 'all',
    brandId: 'all',
    productId: '',
    value: '',
    unitPrice: '',
    quantity: 1,
    status: 'Aguardando' as OppStatus,
    leadNeeds: '',
    userId: '',
  })

  const [editOpp, setEditOpp] = useState<any | null>(null)
  const lastProcessedLeadId = useRef<string>('')

  useEffect(() => {
    if (formData.leadId && formData.leadId !== lastProcessedLeadId.current) {
      const selectedLead = leads.find((l) => l.id === formData.leadId)

      if (selectedLead) {
        lastProcessedLeadId.current = formData.leadId
        let baseVal = selectedLead.estimatedValue?.toString() || ''
        let lUserId = selectedLead.userId || ''
        let lQtd = selectedLead.quantity || 1

        if (selectedLead.product_id) {
          const prod = products?.find((p) => p.id === selectedLead.product_id)
          if (prod) {
            baseVal = prod.price.toString()
            setFormData((prev) => ({
              ...prev,
              productId: prod.id,
              categoryId: prod.categoryId || 'all',
              brandId: prod.brandId || 'all',
              unitPrice: baseVal,
              quantity: lQtd,
              value: (Number(baseVal) * lQtd).toString(),
              userId: prev.userId || lUserId,
            }))
            return
          }
        }
        setFormData((prev) => ({
          ...prev,
          unitPrice: baseVal,
          quantity: lQtd,
          value: baseVal ? (Number(baseVal) * lQtd).toString() : prev.value,
          userId: prev.userId || lUserId,
        }))
      }
    }
  }, [formData.leadId, leads, products])

  if (!currentUser) return null

  const userLeads = leads.filter(
    (l) =>
      currentUser.role === 'ADMIN' || l.userId === currentUser.id || !l.userId,
  )
  const qualifiedLeads = userLeads.filter((l) => l.status === 'Qualificado')
  const visibleOpps = opportunities.filter(
    (opp) =>
      currentUser.role === 'ADMIN' ||
      opp.userId === currentUser.id ||
      !opp.userId,
  )

  const uniqueServices = Array.from(
    new Set(opportunities.map((o) => o.service).filter(Boolean)),
  ).sort()

  const hasActiveFilters =
    filterUserId !== 'all' ||
    filterStatus !== 'all' ||
    filterProduct !== 'all' ||
    searchLead !== '' ||
    startDateParam !== '' ||
    endDateParam !== ''

  const clearFilters = () => {
    setFilterUserId('all')
    setFilterStatus('all')
    setFilterProduct('all')
    setSearchLead('')
    setSearchParams(new URLSearchParams())
  }

  const filteredOpps = visibleOpps.filter((opp) => {
    const lead = leads.find((l) => l.id === opp.leadId)
    const matchUser = filterUserId === 'all' || opp.userId === filterUserId
    const matchStatus = filterStatus === 'all' || opp.status === filterStatus
    const matchProduct =
      filterProduct === 'all' ||
      opp.service.toLowerCase().includes(filterProduct.toLowerCase())
    const matchLead =
      searchLead === '' ||
      (lead &&
        (lead.company.toLowerCase().includes(searchLead.toLowerCase()) ||
          lead.contact.toLowerCase().includes(searchLead.toLowerCase())))

    const oppDate = opp.createdAt ? opp.createdAt.substring(0, 10) : ''
    const matchStartDate = !startDateParam || oppDate >= startDateParam
    const matchEndDate = !endDateParam || oppDate <= endDateParam

    return (
      matchUser &&
      matchStatus &&
      matchProduct &&
      matchLead &&
      matchStartDate &&
      matchEndDate
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.leadId || !formData.productId || !formData.value) return
    const prod = products?.find((p) => p.id === formData.productId)
    await addOpportunity({
      leadId: formData.leadId,
      type: 'Job', // Compatibilidade
      service: prod ? prod.name : '',
      value: Number(formData.value),
      quantity: formData.quantity,
      status: formData.status,
      userId:
        formData.userId ||
        (currentUser.role === 'ADMIN' ? null : currentUser.id),
    } as any)
    setIsOpen(false)
    setFormData({
      leadId: '',
      categoryId: 'all',
      brandId: 'all',
      productId: '',
      value: '',
      unitPrice: '',
      quantity: 1,
      status: 'Aguardando',
      leadNeeds: '',
      userId: '',
    })
    lastProcessedLeadId.current = ''
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pipeline de Vendas
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie propostas e negociações de produtos
            </p>
          </div>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
              setFormData({
                leadId: '',
                categoryId: 'all',
                brandId: 'all',
                productId: '',
                value: '',
                unitPrice: '',
                quantity: 1,
                status: 'Aguardando',
                leadNeeds: '',
                userId: '',
              })
              lastProcessedLeadId.current = ''
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#227b50] hover:bg-[#1a5c3c] text-white rounded-full px-6 shadow-md shadow-[#227b50]/20">
              <Plus className="w-4 h-4 mr-2" /> Nova Oportunidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Oportunidade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-1 block">
                  QUEM É O LEAD?
                </label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal text-left h-10 bg-gray-50"
                    >
                      {formData.leadId
                        ? userLeads.find((l) => l.id === formData.leadId)
                            ?.company
                        : 'Busque e selecione o lead...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[460px] p-0" align="start">
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 border-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                      {qualifiedLeads
                        .filter((l) =>
                          l.company
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((l) => (
                          <div
                            key={l.id}
                            className="px-3 py-2 hover:bg-[#227b50]/10 rounded cursor-pointer text-sm transition-colors"
                            onClick={() => {
                              let value = l.estimatedValue?.toString() || ''
                              let pId = ''
                              let cId = 'all'
                              let bId = 'all'

                              let baseVal = value
                              let lQtd = l.quantity || 1

                              if (l.product_id) {
                                const prod = products?.find(
                                  (p) => p.id === l.product_id,
                                )
                                if (prod) {
                                  pId = prod.id
                                  cId = prod.categoryId || 'all'
                                  bId = prod.brandId || 'all'
                                  baseVal = prod.price.toString()
                                  value = (Number(baseVal) * lQtd).toString()
                                }
                              } else {
                                value = baseVal
                                  ? (Number(baseVal) * lQtd).toString()
                                  : value
                              }

                              setFormData((prev) => ({
                                ...prev,
                                leadId: l.id,
                                productId: pId,
                                categoryId: cId,
                                brandId: bId,
                                unitPrice: baseVal,
                                quantity: lQtd,
                                value: value,
                                leadNeeds: l.notes || prev.leadNeeds,
                                userId: l.userId || prev.userId,
                              }))
                              setComboboxOpen(false)
                            }}
                          >
                            <span className="font-semibold text-gray-900">
                              {l.company}
                            </span>{' '}
                            <span className="text-gray-500 text-xs">
                              ({l.contact})
                            </span>
                          </div>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-1 block">
                  Descrição / Necessidades Específicas
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.leadNeeds}
                  onChange={(e) =>
                    setFormData({ ...formData, leadNeeds: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder="Ex: Cliente precisa de tráfego para E-commerce..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Responsável</label>
                  <Select
                    value={formData.userId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, userId: v })
                    }
                  >
                    <SelectTrigger className="bg-gray-50 h-10">
                      <SelectValue placeholder="Selecione um responsável..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        ?.filter(
                          (u) =>
                            u.role === 'COMMERCIAL' || u.role === 'COMERCIAL',
                        )
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, categoryId: v, productId: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {productCategories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Marca</label>
                  <Select
                    value={formData.brandId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, brandId: v, productId: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {brands?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Produto</label>
                  <Select
                    value={formData.productId || undefined}
                    onValueChange={(v) => {
                      const prod = products?.find((p) => p.id === v)
                      const newUnit = prod
                        ? prod.price.toString()
                        : formData.unitPrice
                      setFormData({
                        ...formData,
                        productId: v,
                        unitPrice: newUnit,
                        value: newUnit
                          ? (Number(newUnit) * formData.quantity).toString()
                          : formData.value,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        ?.filter(
                          (p) =>
                            (formData.categoryId === 'all' ||
                              p.categoryId === formData.categoryId) &&
                            (formData.brandId === 'all' ||
                              p.brandId === formData.brandId),
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => {
                      const q = parseInt(e.target.value) || 1
                      setFormData({
                        ...formData,
                        quantity: q,
                        value: formData.unitPrice
                          ? (Number(formData.unitPrice) * q).toString()
                          : formData.value,
                      })
                    }}
                    className="h-11 text-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">
                    Valor Estimado de Fechamento
                  </label>
                  <Input
                    type="text"
                    required
                    value={
                      formData.value
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(formData.value))
                        : ''
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '')
                      if (!digits) {
                        setFormData({ ...formData, value: '', unitPrice: '' })
                        return
                      }
                      const num = Number(digits) / 100
                      if (!isNaN(num)) {
                        setFormData({
                          ...formData,
                          value: num.toString(),
                          unitPrice: (num / formData.quantity).toString(),
                        })
                      }
                    }}
                    placeholder="R$ 0,00"
                    className="h-11 text-lg font-semibold"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-[#227b50] text-white w-full hover:bg-[#1a5c3c] h-11 text-base"
                >
                  Salvar Oportunidade
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap items-center">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 h-10 w-full md:w-auto shrink-0">
            <CalendarDays className="w-4 h-4 text-gray-500 shrink-0" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0 w-[110px]"
                value={startDateParam}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0 w-[110px]"
                value={endDateParam}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>
          <div className="relative flex-1 min-w-[200px] w-full md:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por empresa ou contato..."
              className="pl-9 h-10"
              value={searchLead}
              onChange={(e) => setSearchLead(e.target.value)}
            />
          </div>
          <Select value={filterUserId} onValueChange={setFilterUserId}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Responsáveis</SelectItem>
              {users
                .filter((u) => u.role === 'COMMERCIAL' || u.role === 'ADMIN')
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Aguardando">Aguardando</SelectItem>
              <SelectItem value="Aberta">Aberta</SelectItem>
              <SelectItem value="Ganha">Ganha</SelectItem>
              <SelectItem value="Perdida">Perdida</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-[180px] h-10">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Produto/Serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Produtos</SelectItem>
              {uniqueServices.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
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

        {filteredOpps.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#227b50]/10 text-[#227b50] rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nenhuma oportunidade encontrada
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Nenhuma oportunidade corresponde aos critérios de busca ou sua
              base está vazia. Adicione uma nova oportunidade.
            </p>
            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              className="border-[#227b50]/30 text-[#227b50] hover:bg-[#227b50]/10 hover:text-[#1a5c3c]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Oportunidade
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead className="w-16 text-center">Qtd</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Fechamento</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpps.map((opp) => {
                const lead = leads.find((l) => l.id === opp.leadId)
                if (!lead) return null
                return (
                  <TableRow key={opp.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      <button
                        onClick={async () => {
                          setViewLead(lead)
                          const { data } = await supabase
                            .from('leads')
                            .select('*, meetings(*), lead_products(*)')
                            .eq('id', lead.id)
                            .single()
                          if (data) {
                            setViewLead((prev: any) => {
                              if (!prev || prev.id !== data.id) return prev
                              return {
                                ...prev,
                                leadProducts: (data.lead_products || []).map(
                                  (lp: any) => ({
                                    id: lp.id,
                                    leadId: lp.lead_id,
                                    productId: lp.product_id,
                                  }),
                                ),
                                meetings: (data.meetings || [])
                                  .map((m: any) => ({
                                    id: m.id,
                                    date: m.date,
                                    notes: m.notes || '',
                                  }))
                                  .sort(
                                    (a: any, b: any) =>
                                      new Date(b.date).getTime() -
                                      new Date(a.date).getTime(),
                                  ),
                              }
                            })
                          }
                        }}
                        className="text-left hover:text-[#227b50] hover:underline focus:outline-none"
                        title="Ver detalhes do lead"
                      >
                        {lead.company} {lead.contact ? `/ ${lead.contact}` : ''}
                      </button>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-gray-600">
                      {opp.quantity || 1}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 font-medium">
                        {opp.service}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {users.find((u) => u.id === opp.userId)?.name || '-'}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 text-right text-base">
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(opp.value)}</span>
                        {opp.amountPaid !== undefined && opp.amountPaid > 0 && (
                          <span className="text-[10px] text-green-600 font-medium whitespace-nowrap">
                            Pago: {formatCurrency(opp.amountPaid)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500">
                      {opp.closedDate
                        ? new Date(opp.closedDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className="inline-block"
                        onClick={() => {
                          const notOwnerBlock =
                            opp.userId &&
                            opp.userId !== currentUser.id &&
                            currentUser.role !== 'ADMIN'
                          const terminalBlock =
                            opp.status === 'Ganha' ||
                            opp.status === 'Perdida' ||
                            (opp.status as string) === 'Fechado'

                          if (terminalBlock) {
                            toast.error('Ação Bloqueada', {
                              description:
                                'Oportunidades ganhas ou perdidas não podem ter seu status alterado.',
                            })
                          } else if (notOwnerBlock) {
                            toast.error('Ação Bloqueada', {
                              description:
                                'Apenas o responsável ou um administrador pode alterar esta oportunidade.',
                            })
                          }
                        }}
                      >
                        <Select
                          value={opp.status}
                          disabled={
                            (!!opp.userId &&
                              opp.userId !== currentUser.id &&
                              currentUser.role !== 'ADMIN') ||
                            opp.status === 'Ganha' ||
                            opp.status === 'Perdida' ||
                            (opp.status as string) === 'Fechado'
                          }
                          onValueChange={async (v) => {
                            await updateOpportunityStatus(
                              opp.id,
                              v as OppStatus,
                            )
                            if (v === 'Ganha') {
                              toast.success(
                                'Parabéns! Cliente criado com sucesso a partir da oportunidade ganha',
                              )
                            } else if (v === 'Perdida') {
                              toast.info(
                                'Oportunidade marcada como perdida e lead atualizado para Perdido.',
                              )
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-8 text-[10px] font-bold uppercase tracking-wide border-0 focus:ring-0 w-32 mx-auto',
                              opp.status === 'Ganha' &&
                                'bg-green-100 text-green-700',
                              opp.status === 'Aberta' &&
                                'bg-blue-100 text-blue-700',
                              opp.status === 'Aguardando' &&
                                'bg-yellow-100 text-yellow-700',
                              opp.status === 'Perdida' &&
                                'bg-red-100 text-red-700',
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aguardando">
                              Aguardando
                            </SelectItem>
                            <SelectItem value="Aberta">Aberta</SelectItem>
                            <SelectItem value="Ganha">Ganha</SelectItem>
                            <SelectItem value="Perdida">Perdida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditOpp({
                            ...opp,
                            amountPaidStr: opp.amountPaid
                              ? (opp.amountPaid * 100).toString()
                              : '',
                            closedDateStr: opp.closedDate
                              ? opp.closedDate.substring(0, 10)
                              : '',
                          })
                        }
                        className="text-gray-500 hover:text-[#227b50]"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

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
                    {products?.find((p) => p.id === viewLead.product_id)
                      ?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">
                    Produtos Relacionados
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewLead.leadProducts &&
                    viewLead.leadProducts.length > 0 ? (
                      viewLead.leadProducts.map((lp: any) => {
                        const p = products?.find(
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
                          ?.filter((p) => p.categoryId === viewLead.categoryId)
                          .forEach((p) => recommended.add(p.id))
                      }

                      const textToSearch =
                        `${viewLead.notes || ''} ${viewLead.objectives || ''}`.toLowerCase()
                      const matches = (interestMappings || [])
                        .filter((im: any) => {
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
                        .sort((a: any, b: any) => b.priority - a.priority)

                      matches.forEach((m: any) => {
                        if (m.productId) recommended.add(m.productId)
                        if (m.categoryId) {
                          products
                            ?.filter((p) => p.categoryId === m.categoryId)
                            .forEach((p) => recommended.add(p.id))
                        }
                      })

                      if (viewLead.product_id)
                        recommended.delete(viewLead.product_id)
                      if (viewLead.leadProducts) {
                        viewLead.leadProducts.forEach((lp: any) =>
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
                          const p = products?.find((prod) => prod.id === id)
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
                    {viewLead.meetings.map((m: any) => (
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
        open={!!editOpp}
        onOpenChange={(open) => !open && setEditOpp(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
          </DialogHeader>
          {editOpp && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">
                  Data de Fechamento
                </label>
                <Input
                  type="date"
                  value={editOpp.closedDateStr}
                  onChange={(e: any) =>
                    setEditOpp({ ...editOpp, closedDateStr: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Valor Pago</label>
                <Input
                  type="text"
                  value={
                    editOpp.amountPaidStr
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(editOpp.amountPaidStr) / 100)
                      : ''
                  }
                  onChange={(e: any) => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setEditOpp({ ...editOpp, amountPaidStr: digits })
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <DialogFooter className="mt-6">
                <Button variant="ghost" onClick={() => setEditOpp(null)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-[#227b50] text-white hover:bg-[#1a5c3c]"
                  onClick={async () => {
                    await updateOpportunity(editOpp.id, {
                      closedDate: editOpp.closedDateStr
                        ? new Date(editOpp.closedDateStr).toISOString()
                        : undefined,
                      amountPaid: editOpp.amountPaidStr
                        ? Number(editOpp.amountPaidStr) / 100
                        : 0,
                    })
                    setEditOpp(null)
                    toast.success('Oportunidade atualizada com sucesso!')
                  }}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

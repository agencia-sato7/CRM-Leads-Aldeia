import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Inbox, Handshake } from 'lucide-react'
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
    services,
    categories,
    users,
    addOpportunity,
    updateOpportunityStatus,
    currentUser,
  } = useDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    leadId: '',
    type: 'Fee Mensal' as OppType,
    service: '',
    value: '',
    status: 'Aguardando' as OppStatus,
    leadNeeds: '',
  })

  const lastProcessedLeadId = useRef<string>('')

  useEffect(() => {
    if (formData.leadId && formData.leadId !== lastProcessedLeadId.current) {
      const selectedLead = leads.find((l) => l.id === formData.leadId)

      if (selectedLead) {
        if (selectedLead.service_id) {
          const svc = services.find((s) => s.id === selectedLead.service_id)
          if (svc) {
            // Service found, apply it and mark lead as processed
            lastProcessedLeadId.current = formData.leadId

            let oppType: OppType = 'Fee Mensal'
            const cat = categories.find((c) => c.id === svc.categoryId)
            if (
              cat &&
              (cat.name.toLowerCase().includes('pontual') ||
                cat.name.toLowerCase().includes('job'))
            ) {
              oppType = 'Job'
            }
            setFormData((prev) => ({
              ...prev,
              type: oppType,
              service: svc.name,
              value:
                prev.value ||
                selectedLead.estimatedValue?.toString() ||
                svc.baseValue.toString(),
            }))
          }
          // If svc not found yet (e.g. services not loaded), we DO NOT mark it as processed.
          // It will re-run when services array changes.
        } else {
          // Lead has no service, mark as processed so we don't keep checking
          lastProcessedLeadId.current = formData.leadId
        }
      }
    }
  }, [formData.leadId, leads, services, categories])

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

  const dbAvailableServices = services.filter((s) => {
    const cat = categories.find((c) => c.id === s.categoryId)
    const isJob =
      cat &&
      (cat.name.toLowerCase().includes('pontual') ||
        cat.name.toLowerCase().includes('job'))
    if (formData.type === 'Job') return isJob
    return !isJob
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.leadId || !formData.service || !formData.value) return
    await addOpportunity({
      leadId: formData.leadId,
      type: formData.type,
      service: formData.service,
      value: Number(formData.value),
      status: formData.status,
      userId: currentUser.role === 'ADMIN' ? null : currentUser.id,
    })
    setIsOpen(false)
    setFormData({
      leadId: '',
      type: 'Fee Mensal',
      service: '',
      value: '',
      status: 'Aguardando',
      leadNeeds: '',
    })
    lastProcessedLeadId.current = ''
  }

  const formatCurrency = (val: number, isUSA: boolean) =>
    new Intl.NumberFormat(isUSA ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency: isUSA ? 'USD' : 'BRL',
      maximumFractionDigits: 0,
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
              Gerencie propostas e negociações (JOB / Fee Mensal)
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
                type: 'Fee Mensal',
                service: '',
                value: '',
                status: 'Aguardando',
                leadNeeds: '',
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
              <DialogTitle>Nova Oportunidade S7SALES</DialogTitle>
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
                              let serviceName = ''
                              let oppType: OppType = 'Fee Mensal'
                              let value = l.estimatedValue?.toString() || ''

                              if (l.service_id) {
                                const svc = services.find(
                                  (s) => s.id === l.service_id,
                                )
                                if (svc) {
                                  serviceName = svc.name
                                  if (!value) value = svc.baseValue.toString()

                                  const cat = categories.find(
                                    (c) => c.id === svc.categoryId,
                                  )
                                  if (
                                    cat &&
                                    (cat.name
                                      .toLowerCase()
                                      .includes('pontual') ||
                                      cat.name.toLowerCase().includes('job'))
                                  ) {
                                    oppType = 'Job'
                                  }
                                }
                              }

                              setFormData((prev) => ({
                                ...prev,
                                leadId: l.id,
                                service: serviceName,
                                type: oppType,
                                value: value,
                                leadNeeds: l.notes || prev.leadNeeds,
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
                <div>
                  <label className="text-sm font-medium">
                    Modelo de Negócio
                  </label>
                  <Select
                    value={formData.type || undefined}
                    onValueChange={(v: OppType) =>
                      setFormData({ ...formData, type: v, service: '' })
                    }
                    disabled={!!formData.leadId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fee Mensal">
                        Fee Mensal (Recorrente)
                      </SelectItem>
                      <SelectItem value="Job">JOB (Pontual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Serviço Específico
                  </label>
                  <Select
                    value={formData.service || undefined}
                    onValueChange={(v) => {
                      const svc = services.find((s) => s.name === v)
                      setFormData({
                        ...formData,
                        service: v,
                        value: svc ? svc.baseValue.toString() : formData.value,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Catálogo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => {
                        const catServices = dbAvailableServices.filter(
                          (s) => s.categoryId === cat.id,
                        )
                        if (catServices.length === 0) return null
                        return (
                          <SelectGroup key={cat.id}>
                            <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                              {cat.name}
                            </SelectLabel>
                            {catServices.map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                      {dbAvailableServices.filter((s) => !s.categoryId).length >
                        0 && (
                        <SelectGroup>
                          <SelectLabel className="bg-gray-50 text-gray-500 font-semibold">
                            Outros
                          </SelectLabel>
                          {dbAvailableServices
                            .filter((s) => !s.categoryId)
                            .map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      )}
                      {formData.service &&
                        !dbAvailableServices.some(
                          (s) => s.name === formData.service,
                        ) && (
                          <SelectItem value={formData.service}>
                            {formData.service}
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Valor Estimado de Fechamento
                </label>
                <Input
                  type="number"
                  required
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="Ex: 5000"
                  className="h-11 text-lg font-semibold"
                />
                {(() => {
                  const dbService = services.find(
                    (s) => s.name === formData.service,
                  )
                  const min = dbService?.baseValue
                  const max = dbService?.ceilingValue

                  if (min !== undefined && max !== undefined) {
                    return (
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>{' '}
                        Range de Tabela: R$ {min.toLocaleString()} a{' '}
                        {max === 100000 ? 'R$ ∞' : `R$ ${max.toLocaleString()}`}
                      </p>
                    )
                  }
                  return null
                })()}
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
        {visibleOpps.length === 0 ? (
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
                <TableHead>Serviço / Modelo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOpps.map((opp) => {
                const lead = leads.find((l) => l.id === opp.leadId)
                if (!lead) return null
                return (
                  <TableRow key={opp.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      {lead.company}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 font-medium">
                        {opp.service}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {opp.type}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {users.find((u) => u.id === opp.userId)?.name || '-'}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 text-right text-base">
                      {formatCurrency(opp.value, lead.country === 'USA')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className="inline-block"
                        onClick={() => {
                          if (opp.userId && opp.userId !== currentUser.id) {
                            toast.error('Ação Bloqueada', {
                              description:
                                'Apenas o responsável pode alterar esta oportunidade.',
                            })
                          }
                        }}
                      >
                        <Select
                          value={opp.status}
                          disabled={
                            !!opp.userId && opp.userId !== currentUser.id
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
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

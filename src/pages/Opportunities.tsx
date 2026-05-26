import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Inbox, Handshake, Edit3 } from 'lucide-react'
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
    currentUser,
  } = useDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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
              {visibleOpps.map((opp) => {
                const lead = leads.find((l) => l.id === opp.leadId)
                if (!lead) return null
                return (
                  <TableRow key={opp.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      {lead.company}
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

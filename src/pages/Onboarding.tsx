import { useState, useEffect } from 'react'
import {
  Rocket,
  CheckCircle2,
  Plus,
  Trash2,
  Mail,
  FileDown,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDataStore } from '@/stores/use-data-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Onboarding() {
  const {
    opportunities,
    leads,
    customers,
    currentUser,
    onboardings,
    users,
    addOnboarding,
    fetchInitialData,
  } = useDataStore()
  const [selectedOppId, setSelectedOppId] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [onboardingToDelete, setOnboardingToDelete] = useState<string | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>(['diretoria@sato7.com.br'])
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('settings' as any)
          .select('value')
          .eq('key', 'onboarding_emails')
          .single()

        if (data && data.value) {
          setEmails(data.value as string[])
        }
      } catch (err) {
        console.error('Failed to load emails:', err)
      }
    }
    fetchEmails()
  }, [])

  const updateEmailsInDB = async (newEmails: string[]) => {
    try {
      const { error } = await supabase
        .from('settings' as any)
        .upsert(
          { key: 'onboarding_emails', value: newEmails },
          { onConflict: 'key' },
        )

      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar e-mails no banco de dados.')
    }
  }

  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
    email: '',
    site: '',
    instagram: '',
    facebook: '',
    serviceDescription: '',
    marketingContext: '',
    opportunityValue: 0,
    serviceName: '',
  })

  const wonOpps = opportunities.filter(
    (o) =>
      o.status === 'Ganha' &&
      (currentUser?.role === 'ADMIN' || o.userId === currentUser?.id),
  )

  const visibleOnboardings = onboardings.filter(
    (o) =>
      currentUser?.role === 'ADMIN' ||
      (o as any).userId === currentUser?.id ||
      (o as any).user_id === currentUser?.id,
  )

  const handleOppChange = (oppId: string) => {
    setSelectedOppId(oppId)
    const opp = opportunities.find((o) => o.id === oppId)
    if (opp) {
      const lead = leads.find((l) => l.id === opp.leadId)
      const customer = customers.find(
        (c) =>
          (lead && c.company.toLowerCase() === lead.company.toLowerCase()) ||
          (c.email &&
            lead?.email &&
            c.email.toLowerCase() === lead.email.toLowerCase()),
      )

      setFormData((prev) => ({
        ...prev,
        companyName: customer?.company || lead?.company || '',
        phone: customer?.phone || lead?.phone || '',
        email: customer?.email || lead?.email || '',
        cnpj: customer?.cnpj || '',
        site: customer?.site || '',
        instagram: customer?.instagram || '',
        facebook: customer?.facebook || '',
        serviceDescription: opp.service || '',
        marketingContext: lead?.objectives || '',
        opportunityValue: opp.value || 0,
        serviceName: opp.service || '',
      }))
    }
  }

  const handleReset = () => {
    setIsDialogOpen(false)
    setSelectedOppId('')
    setFormData({
      companyName: '',
      cnpj: '',
      phone: '',
      email: '',
      site: '',
      instagram: '',
      facebook: '',
      serviceDescription: '',
      marketingContext: '',
      opportunityValue: 0,
      serviceName: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOppId) {
      toast.error('Selecione um contrato fechado primeiro.')
      return
    }

    setIsSubmitting(true)
    try {
      await addOnboarding({
        opportunityId: selectedOppId,
        companyName: formData.companyName,
        cnpj: formData.cnpj,
        phone: formData.phone,
        email: formData.email,
        site: formData.site,
        instagram: formData.instagram,
        facebook: formData.facebook,
        serviceDescription: formData.serviceDescription,
        marketingContext: formData.marketingContext,
      })

      try {
        const { data, error } = await supabase.functions.invoke(
          'send-onboarding-email',
          {
            body: {
              emails,
              onboarding: {
                ...formData,
                registeredBy: currentUser?.name || 'Sistema',
              },
            },
          },
        )

        if (error) {
          throw new Error(error.message || 'Erro na execução da Edge Function.')
        }

        if (data && data.success === false) {
          throw new Error(
            data.error || 'Erro no serviço de disparo de e-mails.',
          )
        }

        toast.success('Onboarding finalizado com sucesso!', {
          description:
            'Notificações automatizadas enviadas para os e-mails configurados.',
        })
      } catch (emailError: any) {
        console.error('Erro ao enviar e-mails de notificação:', emailError)
        toast.warning('Onboarding registrado!', {
          description: `Porém as notificações por e-mail falharam: ${emailError.message}`,
        })
      }

      handleReset()
    } catch (error) {
      toast.error('Erro ao registrar onboarding.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onboardingToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('onboardings')
        .delete()
        .eq('id', onboardingToDelete)
      if (error) throw error
      toast.success('Onboarding removido com sucesso!')
      await fetchInitialData()
    } catch (error) {
      toast.error('Erro ao remover onboarding.')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setOnboardingToDelete(null)
    }
  }

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (newEmail && !emails.includes(newEmail)) {
      const updated = [...emails, newEmail]
      setEmails(updated)
      updateEmailsInDB(updated)
      setNewEmail('')
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    const updated = emails.filter((e) => e !== emailToRemove)
    setEmails(updated)
    updateEmailsInDB(updated)
  }

  const handleExportPdf = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#227b50] text-white rounded-xl shadow-lg shadow-[#227b50]/20">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Fluxo de Onboarding
            </h1>
            <p className="text-muted-foreground text-sm">
              Handover: Transição Oficial de Comercial para Operação SATO7.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExportPdf}
            variant="outline"
            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          {currentUser?.role === 'ADMIN' && (
            <Button
              onClick={() => setIsEmailModalOpen(true)}
              variant="outline"
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Gerenciar E-mails
            </Button>
          )}
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#227b50] hover:bg-[#1a5d3c] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Onboarding
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Relatório de Onboardings
        </h1>
        <p className="text-gray-500">
          Gerado em: {new Date().toLocaleDateString()}
        </p>
      </div>

      {visibleOnboardings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center print:hidden">
          <div className="w-16 h-16 bg-[#227b50]/10 text-[#227b50] rounded-full flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Nenhum onboarding registrado
          </h3>
          <p className="text-gray-500 max-w-sm mb-6">
            Nenhum histórico recente encontrado. Para iniciar uma transição de
            contrato fechado para a operação, inicie um novo onboarding.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            className="border-[#227b50]/20 text-[#227b50] hover:bg-[#227b50]/10 hover:text-[#1a5d3c]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Onboarding
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-semibold text-gray-900">
                  Cliente
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  CNPJ
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Contato
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Descrição do Serviço
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  Responsável
                </TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">
                  Data de Registro
                </TableHead>
                <TableHead className="font-semibold text-gray-900 text-right print:hidden">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOnboardings.map((o) => (
                <TableRow
                  key={o.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{o.companyName}</span>
                      {o.site && (
                        <a
                          href={o.site}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline print:text-black print:no-underline"
                        >
                          {o.site}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {o.cnpj || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-900">{o.email || '-'}</span>
                      <span className="text-gray-500">{o.phone || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-sm text-gray-600 max-w-[300px] truncate print:max-w-none print:whitespace-normal"
                      title={o.serviceDescription || ''}
                    >
                      {o.serviceDescription || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-xs shrink-0">
                        {users
                          .find((u) => u.id === o.userId)
                          ?.name?.substring(0, 2)
                          .toUpperCase() || 'U'}
                      </div>
                      <span
                        className="text-sm font-medium text-gray-900 truncate max-w-[120px]"
                        title={users.find((u) => u.id === o.userId)?.name}
                      >
                        {users.find((u) => u.id === o.userId)?.name ||
                          'Usuário Desconhecido'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right print:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#227b50] hover:text-[#1a5d3c] hover:bg-[#227b50]/10 h-8 w-8"
                      onClick={() => {
                        setOnboardingToDelete(o.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900">
              Novo Onboarding
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="text-sm font-bold text-gray-800 mb-2 block">
                  Vincular Contrato Fechado (Gatilho de Automação)
                </label>
                <Select value={selectedOppId} onValueChange={handleOppChange}>
                  <SelectTrigger className="bg-white h-10 w-full">
                    <SelectValue placeholder="Selecione a oportunidade ganha..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wonOpps.map((o) => {
                      const l = leads.find((x) => x.id === o.leadId)
                      return (
                        <SelectItem key={o.id} value={o.id}>
                          {l?.company} - {o.service} (R${' '}
                          {o.value.toLocaleString()})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {selectedOppId && (
                  <div className="mt-3 flex gap-4 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="font-semibold text-gray-800 block">
                        Serviço:
                      </span>
                      {formData.serviceName || '-'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block">
                        Valor Fechado:
                      </span>
                      {formData.opportunityValue !== undefined &&
                      formData.opportunityValue !== null
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(formData.opportunityValue)
                        : '-'}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Razão Social / Nome do Cliente
                  </label>
                  <Input
                    required
                    placeholder="Ex: Global Tech Ltda"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    CNPJ (Para faturamento)
                  </label>
                  <Input
                    required
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Telefone / WhatsApp (Financeiro)
                  </label>
                  <Input
                    required
                    placeholder="+55 11 99999-9999"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    E-mail (Financeiro/Acesso)
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Site
                  </label>
                  <Input
                    placeholder="https://"
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Instagram Oficial
                  </label>
                  <Input
                    placeholder="@empresa"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Facebook
                  </label>
                  <Input
                    placeholder="/empresa"
                    value={formData.facebook}
                    onChange={(e) =>
                      setFormData({ ...formData, facebook: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">
                  Contexto e Estratégia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Descrição do Serviço Vendido
                    </label>
                    <textarea
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[80px]"
                      placeholder="Escopo resumido acordado..."
                      required
                      value={formData.serviceDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceDescription: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Marketing Atual vs Expectativas
                    </label>
                    <textarea
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[80px]"
                      placeholder="Onde o cliente está e onde quer chegar com a SATO7?"
                      required
                      value={formData.marketingContext}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marketingContext: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white"
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Registrando...' : 'Registrar Onboarding'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95">
            <h2 className="text-xl font-semibold text-gray-900">
              Remover Onboarding
            </h2>
            <p className="text-gray-600 text-sm">
              Tem certeza que deseja remover este onboarding? Esta ação não pode
              ser desfeita e os dados serão excluídos permanentemente.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setOnboardingToDelete(null)
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-[#227b50] hover:bg-[#1a5d3c] text-white"
              >
                {isDeleting ? 'Removendo...' : 'Sim, remover'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95">
            <h2 className="text-xl font-semibold text-gray-900">
              E-mails de Notificação
            </h2>
            <p className="text-gray-600 text-sm">
              Configure os e-mails que receberão as notificações quando um novo
              onboarding for criado.
            </p>

            <form onSubmit={handleAddEmail} className="flex gap-2">
              <Input
                type="email"
                placeholder="novo@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary">
                Adicionar
              </Button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emails.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum e-mail configurado.
                </p>
              ) : (
                emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                  >
                    <span className="text-sm text-gray-700">{email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#227b50] hover:text-[#1a5d3c] hover:bg-[#227b50]/10"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setIsEmailModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

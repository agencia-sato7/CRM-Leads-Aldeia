import { useState } from 'react'
import { Metrics } from '@/components/dashboard/Metrics'
import { FunnelChartWidget } from '@/components/dashboard/FunnelChartWidget'
import { HighTicketLeads } from '@/components/dashboard/HighTicketLeads'
import { LeadOriginsChartWidget } from '@/components/dashboard/LeadOriginsChartWidget'
import { MonthlyLeadsChartWidget } from '@/components/dashboard/MonthlyLeadsChartWidget'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDataStore } from '@/stores/use-data-store'
import {
  Globe,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { format, isAfter, subDays } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function Index() {
  const {
    currentUser,
    users,
    leads,
    opportunities,
    messages,
    markMessageRead,
  } = useDataStore()

  const [region, setRegion] = useState<'all' | 'Brazil'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('all')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const [startDate, setStartDate] = useState(startOfMonth)
  const [endDate, setEndDate] = useState(endOfMonth)

  if (!currentUser) return null

  const commercialUsers = users.filter((u) => u.role === 'COMMERCIAL')
  const relevantUserId =
    currentUser.role === 'ADMIN' ? selectedUserId : currentUser.id

  // Seller specific logic
  const sellerLeads = leads.filter((l) => l.userId === currentUser.id)
  const upcomingMeetings = sellerLeads
    .filter(
      (l) =>
        l.scheduledMeetingDate &&
        isAfter(new Date(l.scheduledMeetingDate), new Date()),
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledMeetingDate!).getTime() -
        new Date(b.scheduledMeetingDate!).getTime(),
    )

  const aguardandoOpps = opportunities
    .filter((o) => {
      const isAguardando = o.status === 'Aguardando'
      const isRelevantUser =
        currentUser.role === 'ADMIN'
          ? selectedUserId === 'all'
            ? true
            : o.userId === selectedUserId
          : o.userId === currentUser.id
      return isAguardando && isRelevantUser
    })
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    )

  const myMessages = messages
    .filter((m) => m.toId === currentUser.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Painel de Performance
          </h1>
          <p className="text-muted-foreground text-sm">
            Visão Comercial e Funil de Vendas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-10 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm outline-none w-auto text-gray-700 font-medium cursor-pointer"
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm outline-none w-auto text-gray-700 font-medium cursor-pointer"
            />
          </div>

          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[160px] font-medium bg-gray-50 h-10 shadow-sm border-gray-200">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Equipe Total</SelectItem>
                  {commercialUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name.replace(' (Comercial)', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <Select value={region} onValueChange={(v: any) => setRegion(v)}>
              <SelectTrigger className="w-[160px] font-medium bg-gray-50 h-10 shadow-sm border-gray-200">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Regiões</SelectItem>
                <SelectItem value="Brazil">Brasil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Metrics
        region={region}
        userId={relevantUserId}
        startDate={startDate}
        endDate={endDate}
      />

      {(currentUser.role === 'COMMERCIAL' ||
        (currentUser.role === 'ADMIN' && aguardandoOpps.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {currentUser.role === 'COMMERCIAL' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Próximas Reuniões
                </h2>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {upcomingMeetings.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma reunião agendada.
                  </p>
                ) : (
                  upcomingMeetings.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex flex-col gap-1"
                    >
                      <span className="font-semibold text-gray-900">
                        {l.company}
                      </span>
                      <span className="text-sm text-gray-600">
                        {format(
                          new Date(l.scheduledMeetingDate!),
                          "dd/MM 'às' HH:mm",
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Oportunidades que merecem atenção
              </h2>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {aguardandoOpps.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Tudo em dia! Sem propostas aguardando.
                </p>
              ) : (
                aguardandoOpps.map((o) => {
                  const lead = leads.find((l) => l.id === o.leadId)
                  return (
                    <div
                      key={o.id}
                      className="p-3 bg-red-50 rounded-lg border border-red-100 flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-900">
                          {lead?.company || 'Lead não encontrado'}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white text-red-600 border-red-200"
                        >
                          AGUARDANDO
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600 truncate">
                        {o.service}
                      </span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(o.value)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Atualizado:{' '}
                          {format(new Date(o.updatedAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {currentUser.role === 'COMMERCIAL' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Mensagens do Admin
                </h2>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {myMessages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Sem mensagens no momento.
                  </p>
                ) : (
                  myMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-lg border flex flex-col gap-2 transition-colors ${m.read ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-200 shadow-sm'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500">
                          {format(new Date(m.createdAt), 'dd/MM HH:mm')}
                        </span>
                        {!m.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 text-xs"
                            onClick={() => markMessageRead(m.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Marcar Lida
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">{m.text}</p>
                      {m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline mt-1 w-max"
                        >
                          <ExternalLink className="w-3 h-3" /> Abrir Anexo
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[420px]">
        <div className="lg:col-span-1 h-full">
          <FunnelChartWidget
            region={region}
            userId={relevantUserId}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
        <div className="lg:col-span-2 h-full">
          <HighTicketLeads
            region={region}
            userId={relevantUserId}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[420px]">
        <div className="lg:col-span-1 h-full">
          <LeadOriginsChartWidget
            region={region}
            userId={relevantUserId}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
        <div className="lg:col-span-2 h-full">
          <MonthlyLeadsChartWidget
            region={region}
            userId={relevantUserId}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
    </div>
  )
}

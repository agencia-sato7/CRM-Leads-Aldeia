import { useState, useMemo } from 'react'
import { useDataStore } from '@/stores/use-data-store'
import {
  Calendar,
  TrendingUp,
  Handshake,
  Target,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function MonthlyResults() {
  const { opportunities, leads } = useDataStore()
  const now = new Date()
  const [startDate, setStartDate] = useState(
    format(startOfMonth(now), 'yyyy-MM-dd'),
  )
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))

  const filteredOpps = useMemo(() => {
    return opportunities.filter((opp) => {
      const date = opp.closedDate
        ? new Date(opp.closedDate)
        : new Date(opp.createdAt)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })
  }, [opportunities, startDate, endDate])

  const wonOpps = filteredOpps.filter((o) => o.status === 'Ganha')
  const totalValue = wonOpps.reduce((acc, o) => acc + o.value, 0)
  const totalPaid = wonOpps.reduce((acc, o) => acc + (o.amountPaid || 0), 0)
  const pendingPayment = totalValue - totalPaid

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const date = new Date(lead.createdAt)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })
  }, [leads, startDate, endDate])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Resultado Mensal
            </h1>
            <p className="text-muted-foreground text-sm">
              Análise de performance e fechamentos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer"
          />
          <span className="text-gray-400 text-sm">até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-lg bg-green-100">
              <Handshake className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{wonOpps.length}</p>
            <p className="text-sm font-medium text-gray-500">
              Negócios Fechados
            </p>
            <p className="text-xs text-gray-400 mt-1">No período selecionado</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-sm font-medium text-gray-500">
              Valor Total Fechado
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Soma das oportunidades ganhas
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-lg bg-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-sm font-medium text-gray-500">
              Valor Efetivamente Pago
            </p>
            <p className="text-xs text-gray-400 mt-1">Receita garantida</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-lg bg-orange-100">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(pendingPayment)}
            </p>
            <p className="text-sm font-medium text-gray-500">
              Pagamento Pendente
            </p>
            <p className="text-xs text-gray-400 mt-1">
              A receber das oportunidades fechadas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-gray-400" />
          Detalhamento de Fechamentos
        </h2>
        {wonOpps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma oportunidade fechada (Ganha) encontrada neste período.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Produto/Serviço</TableHead>
                  <TableHead className="text-center">Data Fechamento</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wonOpps.map((opp) => {
                  const lead = leads.find((l) => l.id === opp.leadId)
                  return (
                    <TableRow key={opp.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">
                        {lead?.company || 'Desconhecido'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {opp.service}
                      </TableCell>
                      <TableCell className="text-center text-gray-500">
                        {opp.closedDate
                          ? format(new Date(opp.closedDate), 'dd/MM/yyyy')
                          : format(new Date(opp.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(opp.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {opp.amountPaid && opp.amountPaid > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 shadow-none"
                          >
                            {formatCurrency(opp.amountPaid)}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Pendente
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

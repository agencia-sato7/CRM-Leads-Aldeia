import { useDataStore } from '@/stores/use-data-store'
import { DollarSign, Target, CalendarDays, ArrowDownRight } from 'lucide-react'

export function Metrics({
  region,
  userId,
  startDate,
  endDate,
}: {
  region: string
  userId: string
  startDate: string
  endDate: string
}) {
  const { leads, opportunities } = useDataStore()

  const relevantLeads = leads.filter(
    (l) =>
      (userId === 'all' || l.userId === userId) &&
      (region === 'all' || l.country === region) &&
      l.createdAt.substring(0, 10) >= startDate &&
      l.createdAt.substring(0, 10) <= endDate,
  )
  const leadIds = relevantLeads.map((l) => l.id)

  const relevantOpps = opportunities.filter(
    (o) =>
      leadIds.includes(o.leadId) ||
      (o.createdAt.substring(0, 10) >= startDate &&
        o.createdAt.substring(0, 10) <= endDate &&
        (userId === 'all' || o.userId === userId)),
  )

  const wonOpps = relevantOpps.filter((o) => o.status === 'Ganha')
  const lostOpps = relevantOpps.filter((o) => o.status === 'Perdida')

  const wonVal = wonOpps.reduce((acc, o) => acc + o.value, 0)
  const lostVal = lostOpps.reduce((acc, o) => acc + o.value, 0)
  const totalMeetings = relevantLeads.reduce(
    (acc, l) => acc + l.meetings.length,
    0,
  )

  const formatValue = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  const cards = [
    {
      title: 'Valor Fechado',
      value: formatValue(wonVal),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: 'Receita garantida',
    },
    {
      title: 'Total de Oportunidades',
      value: relevantOpps.length.toString(),
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: 'Pipeline em movimento',
    },
    {
      title: 'Reuniões Realizadas',
      value: totalMeetings.toString(),
      icon: CalendarDays,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: 'Interações diretas',
    },
    {
      title: 'Budget Perdido (Aprox.)',
      value: formatValue(lostVal),
      icon: ArrowDownRight,
      color: 'text-red-600',
      bg: 'bg-red-100',
      trend: 'Oportunidades perdidas',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 transition-transform hover:-translate-y-1 duration-300"
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-lg ${c.bg}`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
          </div>
          <div>
            <p
              className="text-2xl font-bold text-gray-900 truncate"
              title={c.value}
            >
              {c.value}
            </p>
            <p className="text-sm font-medium text-gray-500">{c.title}</p>
            <p className="text-xs text-gray-400 mt-1">{c.trend}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

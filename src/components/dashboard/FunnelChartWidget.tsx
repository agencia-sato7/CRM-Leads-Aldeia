import { useDataStore } from '@/stores/use-data-store'

export function FunnelChartWidget({ region, userId, startDate, endDate }: any) {
  const { leads, opportunities } = useDataStore()

  const relevantLeads = leads.filter((l) => {
    if (userId !== 'all' && l.userId !== userId) return false
    if (region !== 'all' && l.country !== region) return false
    const dateStr = l.createdAt.substring(0, 10)
    return dateStr >= startDate && dateStr <= endDate
  })

  const leadIds = new Set(relevantLeads.map((l) => l.id))

  const relevantOpps = opportunities.filter((o) => {
    if (!leadIds.has(o.leadId)) return false
    if (userId !== 'all' && o.userId !== userId) return false
    const lead = leads.find((l) => l.id === o.leadId)
    if (!lead) return false
    if (region !== 'all' && lead.country !== region) return false
    return true
  })

  const wonOpps = relevantOpps.filter((o) => {
    if (o.status !== 'Ganha') return false
    const dateToCheck = o.closedDate || o.createdAt
    const dateStr = dateToCheck.substring(0, 10)
    return dateStr >= startDate && dateStr <= endDate
  })

  const lostOpps = relevantOpps.filter((o) => {
    if (o.status !== 'Perdida') return false
    const dateToCheck = o.closedDate || o.createdAt
    const dateStr = dateToCheck.substring(0, 10)
    return dateStr >= startDate && dateStr <= endDate
  })

  const funnelData = [
    {
      label: 'Leads Totais',
      value: relevantLeads.length,
      color: 'bg-blue-500',
    },
    {
      label: 'Qualificados',
      value: relevantLeads.filter((l) =>
        ['Qualificado', 'Em Negociação', 'Ganho'].includes(l.status),
      ).length,
      color: 'bg-indigo-500',
    },
    {
      label: 'Em Negociação',
      value: relevantLeads.filter((l) => l.status === 'Em Negociação').length,
      color: 'bg-purple-500',
    },
    {
      label: 'Vendas Ganhas',
      value: wonOpps.length,
      color: 'bg-emerald-500',
    },
    {
      label: 'Vendas Perdidas',
      value: lostOpps.length,
      color: 'bg-red-500',
    },
  ]

  const maxVal = Math.max(...funnelData.map((d) => d.value), 1)

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-6">
        Funil do Pipeline de Vendas
      </h2>
      <div className="flex-1 flex flex-col justify-center space-y-4 max-w-full overflow-hidden">
        {funnelData.map((step, i) => {
          const width = Math.max((step.value / maxVal) * 100, 15)
          return (
            <div key={i} className="flex flex-col items-center group w-full">
              <div
                className={`h-10 ${step.color} rounded-md flex items-center justify-center text-white font-bold text-sm transition-all duration-500 hover:scale-[1.02] cursor-default relative shadow-sm max-w-full`}
                style={{ width: `${width}%` }}
              >
                <span className="absolute left-full ml-4 text-gray-600 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block">
                  {step.label}
                </span>
                {step.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{step.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

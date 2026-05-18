import { useDataStore } from '@/stores/use-data-store'

export function FunnelChartWidget({ region, userId, startDate, endDate }: any) {
  const { leads, opportunities } = useDataStore()

  const relevantLeads = leads.filter(
    (l) =>
      (userId === 'all' || l.userId === userId) &&
      (region === 'all' || l.country === region) &&
      l.createdAt.substring(0, 10) >= startDate &&
      l.createdAt.substring(0, 10) <= endDate,
  )
  const relevantOpps = opportunities.filter((o) =>
    relevantLeads.some((l) => l.id === o.leadId),
  )

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
      label: 'Oportunidades',
      value: relevantOpps.length,
      color: 'bg-purple-500',
    },
    {
      label: 'Vendas Ganhas',
      value: relevantOpps.filter((o) => o.status === 'Ganha').length,
      color: 'bg-emerald-500',
    },
    {
      label: 'Vendas Perdidas',
      value: relevantOpps.filter((o) => o.status === 'Perdida').length,
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

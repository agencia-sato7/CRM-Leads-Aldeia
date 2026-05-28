import { useDataStore } from '@/stores/use-data-store'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'

export function HighTicketLeads({ region, userId, startDate, endDate }: any) {
  const { leads, opportunities } = useDataStore()

  const relevantOpps = opportunities.filter(
    (o) =>
      o.status === 'Aberta' &&
      (userId === 'all' || o.userId === userId) &&
      o.createdAt.substring(0, 10) >= startDate &&
      o.createdAt.substring(0, 10) <= endDate,
  )

  const topOpps = [...relevantOpps]
    .filter((o) => {
      const l = leads.find((x) => x.id === o.leadId)
      return l && (region === 'all' || l.country === region)
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">
          Top 5 Leads High Ticket da Semana
        </h2>
        <div className="p-2 bg-red-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-red-600" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {topOpps.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Nenhuma oportunidade aberta no período selecionado.
          </div>
        ) : (
          topOpps.map((opp) => {
            const lead = leads.find((l) => l.id === opp.leadId)
            if (!lead) return null
            return (
              <div
                key={opp.id}
                className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700 shadow-sm">
                    {lead.contact.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {lead.contact}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                      {opp.service} • {opp.type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 text-base">
                    {new Intl.NumberFormat('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(opp.value)}
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-1 bg-green-50 text-green-700 border-green-200 text-[10px] uppercase font-bold tracking-wider"
                  >
                    Potencial
                  </Badge>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

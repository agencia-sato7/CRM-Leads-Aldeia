import { useState, useMemo } from 'react'
import { useDataStore } from '@/stores/use-data-store'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  format,
  subDays,
  subMonths,
  isAfter,
  startOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type Timeframe = 'mensal' | 'semestral' | 'anual'

export function RevenueChart({ userId = 'all' }: { userId?: string }) {
  const { opportunities } = useDataStore()
  const [timeframe, setTimeframe] = useState<Timeframe>('mensal')

  const chartData = useMemo(() => {
    const wonOpps = opportunities.filter(
      (o) => o.status === 'Ganha' && (userId === 'all' || o.userId === userId),
    )
    const now = new Date()

    if (timeframe === 'mensal') {
      const startDate = subDays(now, 29)
      const days = eachDayOfInterval({ start: startDate, end: now })

      const grouped = wonOpps.reduce(
        (acc, opp) => {
          const dateStr = format(new Date(opp.createdAt), 'dd/MM/yyyy')
          acc[dateStr] = (acc[dateStr] || 0) + opp.value
          return acc
        },
        {} as Record<string, number>,
      )

      return days.map((day) => {
        const key = format(day, 'dd/MM/yyyy')
        return {
          date: format(day, 'dd/MM'),
          value: grouped[key] || 0,
        }
      })
    }

    if (timeframe === 'semestral') {
      const startDate = startOfMonth(subMonths(now, 5))
      const months = eachMonthOfInterval({ start: startDate, end: now })

      const grouped = wonOpps.reduce(
        (acc, opp) => {
          const dateStr = format(new Date(opp.createdAt), 'MM/yyyy')
          acc[dateStr] = (acc[dateStr] || 0) + opp.value
          return acc
        },
        {} as Record<string, number>,
      )

      return months.map((month) => {
        const key = format(month, 'MM/yyyy')
        return {
          date: format(month, 'MMM/yy', { locale: ptBR }),
          value: grouped[key] || 0,
        }
      })
    }

    if (timeframe === 'anual') {
      const startDate = startOfMonth(subMonths(now, 11))
      const months = eachMonthOfInterval({ start: startDate, end: now })

      const grouped = wonOpps.reduce(
        (acc, opp) => {
          const dateStr = format(new Date(opp.createdAt), 'MM/yyyy')
          acc[dateStr] = (acc[dateStr] || 0) + opp.value
          return acc
        },
        {} as Record<string, number>,
      )

      return months.map((month) => {
        const key = format(month, 'MM/yyyy')
        return {
          date: format(month, 'MMM/yy', { locale: ptBR }),
          value: grouped[key] || 0,
        }
      })
    }
    return []
  }, [opportunities, timeframe, userId])

  const chartConfig = {
    value: {
      label: 'Faturamento',
      color: 'hsl(var(--primary))',
    },
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Gráfico de Faturamento
          </h2>
          <p className="text-sm text-gray-500">
            Receita gerada por orçamentos fechados
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setTimeframe('mensal')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-all',
              timeframe === 'mensal'
                ? 'bg-white shadow-sm font-medium text-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setTimeframe('semestral')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-all',
              timeframe === 'semestral'
                ? 'bg-white shadow-sm font-medium text-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Semestral
          </button>
          <button
            onClick={() => setTimeframe('anual')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-all',
              timeframe === 'anual'
                ? 'bg-white shadow-sm font-medium text-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(val) =>
                  new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(val)
                }
                dx={-10}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                content={
                  <ChartTooltipContent
                    formatter={(val: number) => formatCurrency(val)}
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}

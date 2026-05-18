import { useMemo } from 'react'
import { useDataStore } from '@/stores/use-data-store'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  format,
  subMonths,
  isAfter,
  isBefore,
  startOfMonth,
  endOfMonth,
  parseISO,
  eachMonthOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MonthlyLeadsChartWidget({
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
  const { leads } = useDataStore()

  const chartData = useMemo(() => {
    let filtered = leads

    if (region !== 'all') {
      filtered = filtered.filter((l) => l.country === region)
    }

    if (userId !== 'all') {
      filtered = filtered.filter((l) => l.userId === userId)
    }

    const start = startDate ? parseISO(startDate) : subMonths(new Date(), 5)
    const end = endDate ? parseISO(endDate) : new Date()

    const safeStart = isAfter(start, end) ? end : start
    const safeEnd = isAfter(start, end) ? start : end

    const intervalMonths = eachMonthOfInterval({
      start: safeStart,
      end: safeEnd,
    })

    const months = intervalMonths.map((d) => {
      return {
        label: format(d, 'MMM/yy', { locale: ptBR }),
        start: startOfMonth(d),
        end: endOfMonth(d),
        count: 0,
      }
    })

    filtered.forEach((lead) => {
      const date = new Date(lead.createdAt)
      for (const m of months) {
        if (!isBefore(date, m.start) && !isAfter(date, m.end)) {
          m.count++
          break
        }
      }
    })

    return months
  }, [leads, region, userId, startDate, endDate])

  const chartConfig = {
    count: {
      label: 'Leads',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Quantidade de Leads Mensal
        </h2>
        <p className="text-sm text-gray-500">
          Evolução de novos leads no período
        </p>
      </div>
      <div className="flex-1 min-h-[250px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}

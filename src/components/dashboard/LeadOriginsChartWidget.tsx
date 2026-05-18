import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDataStore } from '@/stores/use-data-store'
import { PieChart, Pie, Cell } from 'recharts'
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export function LeadOriginsChartWidget({
  region,
  userId,
  startDate,
  endDate,
}: {
  region: 'all' | 'Brazil' | 'USA'
  userId: string
  startDate: string
  endDate: string
}) {
  const { leads } = useDataStore()

  const { dataWithFill, chartConfig } = useMemo(() => {
    let filtered = leads

    if (userId !== 'all') {
      filtered = filtered.filter((l) => l.userId === userId)
    }

    if (region !== 'all') {
      filtered = filtered.filter((l) => l.country === region)
    }

    if (startDate && endDate) {
      const start = startOfDay(parseISO(startDate))
      const end = endOfDay(parseISO(endDate))
      filtered = filtered.filter((l) => {
        const date = parseISO(l.createdAt)
        return isWithinInterval(date, { start, end })
      })
    }

    const grouped = filtered.reduce(
      (acc, lead) => {
        const origin = lead.origin || 'Desconhecida'
        acc[origin] = (acc[origin] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const sortedData = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const sanitizeKey = (name: string) =>
      name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'other'

    const processedData = sortedData.map((item, index) => {
      const key = `${sanitizeKey(item.name)}_${index}`
      return {
        ...item,
        key,
        fill: `var(--color-${key})`,
      }
    })

    const config: Record<string, { label: string; color: string }> = {
      value: { label: 'Leads', color: 'hsl(var(--primary))' },
    }

    processedData.forEach((item, index) => {
      config[item.key] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }
    })

    return { dataWithFill: processedData, chartConfig: config }
  }, [leads, region, userId, startDate, endDate])

  return (
    <Card className="h-full flex flex-col shadow-sm border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900">
          Origens dos Leads
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4 px-4 min-h-[300px]">
        {dataWithFill.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Nenhum lead no período.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full h-full min-h-[300px]"
          >
            <PieChart>
              <Pie
                data={dataWithFill}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {dataWithFill.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent />}
                className="flex-wrap gap-2 mt-4"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

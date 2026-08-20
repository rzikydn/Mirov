"use client"

import React, { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { HistoryEntry, useHistory } from "../../context/HistoryContext"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "../ui/chart"

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const chartConfig = {
  total: {
    label: "All Contributions",
    color: "#8B5CF6",
  },
  created: {
    label: "Created",
    color: "#10B981",
  },
  edited: {
    label: "Edited & Updated",
    color: "#3B82F6",
  },
  deleted: {
    label: "Deleted",
    color: "#F43F5E",
  },
} satisfies ChartConfig

import { motion } from "framer-motion"

const CustomAnimatedBar = (props: any) => {
  const { x, y, width, height, fill, radius, index } = props
  if (height === undefined || height === null || isNaN(height)) return null

  const barHeight = Math.max(height, 0)
  const r = Array.isArray(radius) ? radius[0] : (radius || 2)
  const delay = (index || 0) * 0.008

  return (
    <motion.rect
      key={`bar-${index}`}
      x={x}
      y={y}
      width={Math.max(width, 1)}
      height={barHeight}
      fill={fill}
      rx={r}
      ry={r}
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{
        duration: 0.35,
        delay: delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        originY: 1,
      }}
    />
  )
}

const CustomChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]?.payload
  if (!data) return null

  const d = new Date(data.date)
  const dateStr = `${d.getDate()} ${BULAN_FULL[d.getMonth()]} ${d.getFullYear()}`

  return (
    <div className="rounded-xl border bg-[#18181b] text-white p-3 shadow-xl backdrop-blur-sm text-xs min-w-[200px] border-gray-800 space-y-2">
      <div className="font-bold text-gray-200 border-b border-gray-800 pb-1.5 flex items-center justify-between gap-2">
        <span>{dateStr}</span>
        <span className="text-[10px] text-violet-400 font-semibold px-2 py-0.5 rounded-full bg-violet-500/15">
          {data.total} total
        </span>
      </div>

      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center gap-1.5 text-gray-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            Created
          </span>
          <span className="font-bold text-emerald-400">{data.created} items</span>
        </div>

        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center gap-1.5 text-gray-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
            Edited
          </span>
          <span className="font-bold text-blue-400">{data.edited} items</span>
        </div>

        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center gap-1.5 text-gray-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
            Deleted
          </span>
          <span className="font-bold text-rose-400">{data.deleted} items</span>
        </div>
      </div>
    </div>
  )
}

export function ChartBarInteractive({
  darkMode,
  historyOverride,
  dateFilter,
}: {
  darkMode?: boolean
  historyOverride?: HistoryEntry[]
  dateFilter?: { startDate: Date | null; endDate: Date | null }
}) {
  const { history: contextHistory } = useHistory()
  const history = historyOverride || contextHistory || []

  const [activeChart, setActiveChart] = useState<"total" | "created" | "edited" | "deleted">("total")

  // Dynamically calculate start/end date and filter history
  const { chartData, dateRangeText, startYear } = useMemo(() => {
    const today = new Date()
    let startDate = new Date(today.getFullYear(), 0, 1)
    let endDate = today

    if (dateFilter?.startDate && dateFilter?.endDate) {
      startDate = new Date(dateFilter.startDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateFilter.endDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (history && history.length > 0) {
      const timestamps = history
        .map((h) => new Date(h.createdAt).getTime())
        .filter((t) => !isNaN(t))

      if (timestamps.length > 0) {
        const minTimestamp = Math.min(...timestamps)
        const earliestDate = new Date(minTimestamp)
        startDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), earliestDate.getDate())
      }
    }

    const result: Array<{
      date: string // YYYY-MM-DD
      month: string // 22 Jul
      fullDate: string // 22 Juli 2026
      total: number
      created: number
      edited: number
      deleted: number
    }> = []

    const mapByDate = new Map<string, { total: number; created: number; edited: number; deleted: number }>()

    history.forEach((entry) => {
      const d = new Date(entry.createdAt)
      if (d >= startDate && d <= endDate) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!mapByDate.has(key)) {
          mapByDate.set(key, { total: 0, created: 0, edited: 0, deleted: 0 })
        }
        const item = mapByDate.get(key)!
        item.total++
        const action = (entry.action || '').toLowerCase()
        const desc = (entry.description || '').toLowerCase()

        if (action === 'create' || action === 'added' || desc.includes('created') || desc.includes('added')) {
          item.created++
        } else if (action === 'edit' || action === 'update' || desc.includes('updated') || desc.includes('changed')) {
          item.edited++
        } else if (action === 'delete' || action === 'remove' || desc.includes('deleted') || desc.includes('removed')) {
          item.deleted++
        }
      }
    })

    // Loop from startDate to endDate
    const curr = new Date(startDate)
    curr.setHours(0, 0, 0, 0)
    const endBound = new Date(endDate)
    endBound.setHours(23, 59, 59, 999)

    while (curr <= endBound) {
      const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`
      const stats = mapByDate.get(key) || { total: 0, created: 0, edited: 0, deleted: 0 }

      result.push({
        date: key,
        month: `${curr.getDate()} ${BULAN_SHORT[curr.getMonth()]}`,
        fullDate: `${curr.getDate()} ${BULAN_FULL[curr.getMonth()]} ${curr.getFullYear()}`,
        total: stats.total,
        created: stats.created,
        edited: stats.edited,
        deleted: stats.deleted,
      })

      curr.setDate(curr.getDate() + 1)
    }

    const sYear = startDate.getFullYear()
    const eYear = endDate.getFullYear()
    const yearLabel = sYear === eYear ? `${sYear}` : `${sYear} - ${eYear}`
    const rangeLabel = dateFilter?.startDate
      ? `Showing daily activity metrics from ${startDate.getDate()} ${BULAN_SHORT[startDate.getMonth()]} ${sYear} to ${endDate.getDate()} ${BULAN_SHORT[endDate.getMonth()]} ${eYear}`
      : `Showing daily activity metrics from ${startDate.getDate()} ${BULAN_SHORT[startDate.getMonth()]} ${sYear} to present`

    return {
      chartData: result,
      startYear: yearLabel,
      dateRangeText: rangeLabel,
    }
  }, [history, dateFilter])

  // Summary Metrics for Total, Created, Edited, and Deleted
  const summaryMetrics = useMemo(() => {
    return {
      total: chartData.reduce((acc, curr) => acc + curr.total, 0),
      created: chartData.reduce((acc, curr) => acc + curr.created, 0),
      edited: chartData.reduce((acc, curr) => acc + curr.edited, 0),
      deleted: chartData.reduce((acc, curr) => acc + curr.deleted, 0),
    }
  }, [chartData])

  const barColor =
    activeChart === 'total'
      ? '#8B5CF6'
      : activeChart === 'created'
      ? '#10B981'
      : activeChart === 'edited'
      ? '#3B82F6'
      : '#F43F5E'

  return (
    <Card className={`py-0 overflow-hidden border transition-colors shadow-sm h-full flex flex-col ${
      darkMode ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <CardHeader className={`flex flex-col items-stretch border-b p-0 h-auto min-h-[80px] sm:h-20 space-y-0 sm:flex-row ${
        darkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 sm:px-6 py-3.5">
          <CardTitle className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Activity Breakdown ({startYear})
          </CardTitle>
          <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {dateRangeText}
          </CardDescription>
        </div>
        
        {/* Continuous unbroken vertical divider container */}
        <div className={`grid grid-cols-2 sm:flex self-stretch border-t sm:border-t-0 sm:border-l ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {/* Box 1: All Contributions */}
          <button
            data-active={activeChart === "total"}
            className={`relative z-30 flex flex-1 flex-col justify-center gap-1 border-r border-b sm:border-b-0 px-3.5 py-2.5 sm:px-4 sm:py-0 text-left transition-all ${
              darkMode
                ? 'border-gray-800 data-[active=true]:bg-gray-800/60 text-white'
                : 'border-gray-200 data-[active=true]:bg-gray-100/80 text-gray-900'
            }`}
            onClick={() => setActiveChart("total")}
          >
            <span className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              All Contributions
            </span>
            <span className={`text-lg leading-none font-bold sm:text-2xl tracking-tight ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              {summaryMetrics.total.toLocaleString()}
            </span>
          </button>

          {/* Box 2: Created */}
          <button
            data-active={activeChart === "created"}
            className={`relative z-30 flex flex-1 flex-col justify-center gap-1 border-r sm:border-r border-b sm:border-b-0 px-3.5 py-2.5 sm:px-4 sm:py-0 text-left transition-all ${
              darkMode
                ? 'border-gray-800 data-[active=true]:bg-gray-800/60 text-white'
                : 'border-gray-200 data-[active=true]:bg-gray-100/80 text-gray-900'
            }`}
            onClick={() => setActiveChart("created")}
          >
            <span className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Created
            </span>
            <span className="text-lg leading-none font-bold sm:text-2xl tracking-tight text-emerald-400">
              {summaryMetrics.created.toLocaleString()}
            </span>
          </button>

          {/* Box 3: Edited */}
          <button
            data-active={activeChart === "edited"}
            className={`relative z-30 flex flex-1 flex-col justify-center gap-1 border-r px-3.5 py-2.5 sm:px-4 sm:py-0 text-left transition-all ${
              darkMode
                ? 'border-gray-800 data-[active=true]:bg-gray-800/60 text-white'
                : 'border-gray-200 data-[active=true]:bg-gray-100/80 text-gray-900'
            }`}
            onClick={() => setActiveChart("edited")}
          >
            <span className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Edited
            </span>
            <span className="text-lg leading-none font-bold sm:text-2xl tracking-tight text-blue-400">
              {summaryMetrics.edited.toLocaleString()}
            </span>
          </button>

          {/* Box 4: Deleted */}
          <button
            data-active={activeChart === "deleted"}
            className={`relative z-30 flex flex-1 flex-col justify-center gap-1 px-3.5 py-2.5 sm:px-4 sm:py-0 text-left transition-all ${
              darkMode
                ? 'data-[active=true]:bg-gray-800/60 text-white'
                : 'data-[active=true]:bg-gray-100/80 text-gray-900'
            }`}
            onClick={() => setActiveChart("deleted")}
          >
            <span className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Deleted
            </span>
            <span className="text-lg leading-none font-bold sm:text-xl tracking-tight text-rose-400">
              {summaryMetrics.deleted.toLocaleString()}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6 pt-4 flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            key={`${activeChart}-${dateFilter?.startDate?.getTime() || 0}-${dateFilter?.endDate?.getTime() || 0}`}
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke={darkMode ? "#27272a" : "#e2e8f0"} strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={40}
              tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getDate()} ${BULAN_SHORT[date.getMonth()]}`
              }}
            />
            <ChartTooltip content={<CustomChartTooltip />} />
            {activeChart === 'total' ? (
              <>
                <Bar
                  key={`created-stacked-${dateFilter?.startDate?.getTime() || 0}`}
                  dataKey="created"
                  stackId="all"
                  fill="#10B981"
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={false}
                  shape={<CustomAnimatedBar />}
                />
                <Bar
                  key={`edited-stacked-${dateFilter?.startDate?.getTime() || 0}`}
                  dataKey="edited"
                  stackId="all"
                  fill="#3B82F6"
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={false}
                  shape={<CustomAnimatedBar />}
                />
                <Bar
                  key={`deleted-stacked-${dateFilter?.startDate?.getTime() || 0}`}
                  dataKey="deleted"
                  stackId="all"
                  fill="#F43F5E"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                  shape={<CustomAnimatedBar />}
                />
              </>
            ) : (
              <Bar
                key={`${activeChart}-${dateFilter?.startDate?.getTime() || 0}-${dateFilter?.endDate?.getTime() || 0}`}
                dataKey={activeChart}
                fill={barColor}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
                shape={<CustomAnimatedBar />}
              />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default React.memo(ChartBarInteractive);

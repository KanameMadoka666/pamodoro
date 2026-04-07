import React, { useEffect, useState, useCallback } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

dayjs.extend(isoWeek)

/* ─────────── types ─────────── */
interface DayStat { date: string; count: number }
interface CategoryStat { task_type: string; count: number; total_pomodoros: number }
interface WeeklyStat { date: string; total_pomodoros: number }
interface HeatCell { date: string; count: number }
interface Summary { todayCount: number; weekCount: number; totalCount: number }

type RangeKey = '7d' | '30d' | '90d'

/* ─────────── helpers ─────────── */
function fillDays(from: string, to: string, data: DayStat[]): DayStat[] {
  const map = Object.fromEntries(data.map(d => [d.date, d.count]))
  const result: DayStat[] = []
  let cur = dayjs(from)
  const end = dayjs(to)
  while (!cur.isAfter(end)) {
    const k = cur.format('YYYY-MM-DD')
    result.push({ date: k, count: map[k] ?? 0 })
    cur = cur.add(1, 'day')
  }
  return result
}

const PIE_COLORS = ['var(--color-timer-ring)', 'var(--color-timer-break)', 'var(--color-secondary)', 'var(--color-accent)']

/* ─────────── Heatmap ─────────── */
const HeatmapGrid = ({ data, primaryColor }: { data: HeatCell[]; primaryColor: string }): React.JSX.Element => {
  const map = Object.fromEntries(data.map(d => [d.date, d.count]))
  const max = Math.max(1, ...data.map(d => d.count))
  const today = dayjs()
  const startDate = today.subtract(364, 'day').startOf('isoWeek')
  const weeks: { date: string; count: number }[][] = []
  let currentWeek: { date: string; count: number }[] = []
  let cur = startDate
  while (!cur.isAfter(today)) {
    const k = cur.format('YYYY-MM-DD')
    currentWeek.push({ date: k, count: map[k] ?? 0 })
    if (cur.isoWeekday() === 7) { weeks.push(currentWeek); currentWeek = [] }
    cur = cur.add(1, 'day')
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-0.5 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(cell => {
              const opacity = cell.count === 0 ? 0 : 0.2 + 0.8 * (cell.count / max)
              return (
                <div
                  key={cell.date}
                  title={`${cell.date}: ${cell.count} 🍅`}
                  className="w-3 h-3 rounded-sm transition-opacity"
                  style={{
                    background: cell.count === 0 ? 'var(--color-progress-track)' : primaryColor,
                    opacity: cell.count === 0 ? 1 : opacity
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────── main ─────────── */
const AnalyticsPage = (): React.JSX.Element => {
  const [range, setRange] = useState<RangeKey>('30d')
  const [lineSeries, setLineSeries] = useState<DayStat[]>([])
  const [barSeries, setBarSeries] = useState<WeeklyStat[]>([])
  const [pieSeries, setPieSeries] = useState<CategoryStat[]>([])
  const [heatData, setHeatData] = useState<HeatCell[]>([])
  const [summary, setSummary] = useState<Summary>({ todayCount: 0, weekCount: 0, totalCount: 0 })

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-timer-ring').trim() || '#e07b54'
  const breakColor = getComputedStyle(document.documentElement).getPropertyValue('--color-timer-break').trim() || '#2a9d8f'
  const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#8a8078'
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#e8e0d8'

  const getRange = useCallback((): { from: string; to: string } => {
    const to = dayjs().format('YYYY-MM-DD')
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    return { from: dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD'), to }
  }, [range])

  const load = useCallback(async () => {
    const { from, to } = getRange()
    const today = dayjs().format('YYYY-MM-DD')
    const weekFrom = dayjs().startOf('isoWeek').format('YYYY-MM-DD')
    const yearFrom = dayjs().subtract(364, 'day').format('YYYY-MM-DD')

    const [statsRaw, weeklyRaw, catRaw, heatRaw, sumRaw] = await Promise.all([
      window.api.getPomodoroStats(from, to) as Promise<DayStat[]>,
      window.api.getWeeklyStats(weekFrom, to) as Promise<WeeklyStat[]>,
      window.api.getWorkLogStats(from, to) as Promise<CategoryStat[]>,
      window.api.getPomodoroHeatmap(yearFrom, today) as Promise<HeatCell[]>,
      window.api.getPomodoroSummary(today, weekFrom)
    ])

    setLineSeries(fillDays(from, to, statsRaw))
    setBarSeries(weeklyRaw)
    setPieSeries((catRaw as CategoryStat[]).filter(c => c.task_type))
    setHeatData(heatRaw as HeatCell[])
    setSummary(sumRaw)
  }, [getRange])

  useEffect(() => { void load() }, [load])

  const labelStyle = { fill: mutedColor, fontSize: 11 }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>数据分析</h1>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as RangeKey[]).map(k => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
              style={{
                background: range === k ? primaryColor : 'var(--color-bg-sidebar)',
                color: range === k ? '#fff' : 'var(--color-text-muted)',
                border: `1px solid ${range === k ? primaryColor : borderColor}`
              }}
            >
              {k === '7d' ? '7天' : k === '30d' ? '30天' : '90天'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '今日番茄', value: summary.todayCount, icon: '🍅' },
          { label: '本周番茄', value: summary.weekCount, icon: '📅' },
          { label: '累计番茄', value: summary.totalCount, icon: '🏆' }
        ].map(card => (
          <div key={card.label} className="card p-4 flex items-center gap-3">
            <span className="text-3xl">{card.icon}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{card.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart — trend */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>📈 每日番茄完成趋势</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
            <XAxis
              dataKey="date"
              tick={labelStyle}
              tickFormatter={v => dayjs(v).format('MM/DD')}
              interval={range === '7d' ? 0 : Math.floor(lineSeries.length / 7)}
            />
            <YAxis tick={labelStyle} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-bg-card)', border: `1px solid ${borderColor}`, borderRadius: 8 }}
              labelStyle={{ color: mutedColor, fontSize: 12 }}
              itemStyle={{ color: primaryColor }}
              formatter={(v: unknown) => [`${v} 🍅`, '完成']}
              labelFormatter={(l) => dayjs(String(l)).format('YYYY-MM-DD')}
            />
            <Line type="monotone" dataKey="count" stroke={primaryColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar + Pie row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bar Chart — weekly work hours */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>📊 本周每日番茄数</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis dataKey="date" tick={labelStyle} tickFormatter={v => dayjs(v).format('ddd')} />
              <YAxis tick={labelStyle} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-card)', border: `1px solid ${borderColor}`, borderRadius: 8 }}
                labelStyle={{ color: mutedColor, fontSize: 12 }}
                itemStyle={{ color: breakColor }}
                formatter={(v: unknown) => [`${v} 🍅`, '番茄']}
                labelFormatter={(l) => dayjs(String(l)).format('MM/DD ddd')}
              />
              <Bar dataKey="total_pomodoros" fill={breakColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — category */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>🥧 任务类型分布</h2>
          {pieSeries.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              该时间段内暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieSeries}
                  dataKey="total_pomodoros"
                  nameKey="task_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={36}
                  labelLine={false}
                  label={(props) => {
                    const pct = props.percent ?? 0
                    const name = (props as unknown as { task_type?: string }).task_type ?? (props.name ?? '')
                    return pct > 0.08 ? `${name} ${(pct * 100).toFixed(0)}%` : ''
                  }}
                >
                  {pieSeries.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-card)', border: `1px solid ${borderColor}`, borderRadius: 8 }}
                  formatter={(v: unknown, _: unknown, props: { payload?: { task_type?: string } }) =>
                    [`${v} 🍅`, props.payload?.task_type ?? '']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: mutedColor }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>🗓 年度番茄热力图</h2>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>少</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map(op => (
              <div key={op} className="w-3 h-3 rounded-sm" style={{ background: primaryColor, opacity: op }} />
            ))}
            <span>多</span>
          </div>
        </div>
        <HeatmapGrid data={heatData} primaryColor={primaryColor} />
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          过去 365 天 · 累计 {heatData.reduce((s, d) => s + d.count, 0)} 个番茄
        </p>
      </div>
    </div>
  )
}

export default AnalyticsPage

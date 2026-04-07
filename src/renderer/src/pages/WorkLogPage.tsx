import React, { useEffect, useState, useCallback } from 'react'
import Papa from 'papaparse'
import dayjs from 'dayjs'

interface WorkLog {
  id: number
  date: string
  start_time: string
  end_time?: string
  task_id?: number | null
  task_type?: string
  task_description?: string
  pomodoro_count?: number
  notes?: string
}

type RangePreset = 'today' | 'week' | 'month' | 'all' | 'custom'

const CATEGORIES = ['工作', '学习', '生活', '其他']

const rangePresets: { key: RangePreset; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
  { key: 'custom', label: '自定义' }
]

function getPresetRange(preset: RangePreset): { from: string; to: string } {
  const today = dayjs().format('YYYY-MM-DD')
  if (preset === 'today') return { from: today, to: today }
  if (preset === 'week') return { from: dayjs().startOf('week').format('YYYY-MM-DD'), to: today }
  if (preset === 'month') return { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: today }
  return { from: '2020-01-01', to: '2099-12-31' }
}

function formatTime(iso?: string): string {
  if (!iso) return '—'
  return dayjs(iso).format('HH:mm')
}

const emptyForm = (): Partial<WorkLog> => ({
  date: dayjs().format('YYYY-MM-DD'),
  start_time: dayjs().startOf('hour').toISOString(),
  end_time: dayjs().toISOString(),
  task_type: '工作',
  task_description: '',
  pomodoro_count: 1,
  notes: ''
})

const WorkLogPage = (): React.JSX.Element => {
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [preset, setPreset] = useState<RangePreset>('week')
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [showModal, setShowModal] = useState(false)
  const [editLog, setEditLog] = useState<Partial<WorkLog>>(emptyForm())
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const getRange = useCallback((): { from: string; to: string } => {
    if (preset === 'custom') return { from: customFrom, to: customTo }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const { from, to } = getRange()
    const data = await window.api.getWorkLogs(from, to) as WorkLog[]
    setLogs(data)
    setLoading(false)
  }, [getRange])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  const handleOpenAdd = (): void => {
    setEditLog(emptyForm())
    setIsEditing(false)
    setShowModal(true)
  }

  const handleOpenEdit = (log: WorkLog): void => {
    setEditLog({ ...log })
    setIsEditing(true)
    setShowModal(true)
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('确定删除这条记录吗？')) return
    await window.api.deleteWorkLog(id)
    void loadLogs()
  }

  const handleSave = async (): Promise<void> => {
    const data = {
      date: editLog.date ?? dayjs().format('YYYY-MM-DD'),
      start_time: editLog.start_time ?? dayjs().toISOString(),
      end_time: editLog.end_time ?? undefined,
      task_type: editLog.task_type ?? '',
      task_description: editLog.task_description ?? '',
      pomodoro_count: Number(editLog.pomodoro_count ?? 1),
      notes: editLog.notes ?? ''
    }
    if (isEditing && editLog.id) {
      await window.api.updateWorkLog(editLog.id, data)
    } else {
      await window.api.createWorkLog(data)
    }
    setShowModal(false)
    void loadLogs()
  }

  const handleExportCSV = (): void => {
    const rows = logs.map(l => ({
      日期: l.date,
      开始时间: formatTime(l.start_time),
      结束时间: formatTime(l.end_time),
      分类: l.task_type ?? '',
      任务描述: l.task_description ?? '',
      番茄数: l.pomodoro_count ?? 0,
      备注: l.notes ?? ''
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工作记录_${getRange().from}_${getRange().to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPomodoros = logs.reduce((s, l) => s + (l.pomodoro_count ?? 0), 0)
  const primaryColor = 'var(--color-timer-ring)'

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>工作记录</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            共 {logs.length} 条记录 · {totalPomodoros} 🍅
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            ↓ 导出 CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: primaryColor, color: '#fff' }}
          >
            + 手动添加
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-3 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {rangePresets.map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
              style={{
                background: preset === p.key ? primaryColor : 'var(--color-bg-sidebar)',
                color: preset === p.key ? '#fff' : 'var(--color-text-muted)',
                border: `1px solid ${preset === p.key ? primaryColor : 'var(--color-border)'}`
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-2 py-1 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>—</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-2 py-1 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            加载中...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-4xl">📭</span>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>该时间段内暂无记录</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['日期', '开始', '结束', '分类', '任务描述', '🍅', '备注', '操作'].map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left font-semibold whitespace-nowrap"
                    style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-sidebar)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr
                  key={log.id}
                  className="transition-colors hover:opacity-80"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--color-text)' }}>{log.date}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--color-text)' }}>{formatTime(log.start_time)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--color-text)' }}>{formatTime(log.end_time)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'var(--color-progress-track)', color: primaryColor }}
                    >
                      {log.task_type || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 max-w-xs truncate" style={{ color: 'var(--color-text)' }}>
                    {log.task_description || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center font-medium" style={{ color: 'var(--color-timer-ring)' }}>
                    {log.pomodoro_count ?? 0}
                  </td>
                  <td className="px-3 py-2.5 max-w-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {log.notes || '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(log)}
                        className="px-2 py-0.5 rounded text-xs transition-all hover:opacity-80"
                        style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => void handleDelete(log.id)}
                        className="px-2 py-0.5 rounded text-xs transition-all hover:opacity-80"
                        style={{ background: 'var(--color-bg-sidebar)', color: '#ef4444', border: '1px solid #ef444440' }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="card p-6 w-full max-w-md flex flex-col gap-4"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {isEditing ? '编辑记录' : '手动添加记录'}
            </h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>日期</span>
                <input
                  type="date"
                  value={editLog.date ?? ''}
                  onChange={e => setEditLog(v => ({ ...v, date: e.target.value }))}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>开始时间</span>
                  <input
                    type="time"
                    value={editLog.start_time ? dayjs(editLog.start_time).format('HH:mm') : ''}
                    onChange={e => {
                      const [h, m] = e.target.value.split(':')
                      const d = dayjs(editLog.date).hour(Number(h)).minute(Number(m)).second(0)
                      setEditLog(v => ({ ...v, start_time: d.toISOString() }))
                    }}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>结束时间</span>
                  <input
                    type="time"
                    value={editLog.end_time ? dayjs(editLog.end_time).format('HH:mm') : ''}
                    onChange={e => {
                      const [h, m] = e.target.value.split(':')
                      const d = dayjs(editLog.date).hour(Number(h)).minute(Number(m)).second(0)
                      setEditLog(v => ({ ...v, end_time: d.toISOString() }))
                    }}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>分类</span>
                <select
                  value={editLog.task_type ?? '工作'}
                  onChange={e => setEditLog(v => ({ ...v, task_type: e.target.value }))}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>任务描述</span>
                <input
                  type="text"
                  value={editLog.task_description ?? ''}
                  onChange={e => setEditLog(v => ({ ...v, task_description: e.target.value }))}
                  placeholder="描述这次工作内容..."
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>番茄数</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={editLog.pomodoro_count ?? 1}
                  onChange={e => setEditLog(v => ({ ...v, pomodoro_count: Number(e.target.value) }))}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>备注</span>
                <textarea
                  value={editLog.notes ?? ''}
                  onChange={e => setEditLog(v => ({ ...v, notes: e.target.value }))}
                  rows={2}
                  placeholder="可选备注..."
                  className="px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              >
                取消
              </button>
              <button
                onClick={() => void handleSave()}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-timer-ring)', color: '#fff' }}
              >
                {isEditing ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkLogPage

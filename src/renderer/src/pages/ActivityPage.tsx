import React, { useEffect, useState, useCallback } from 'react'
import ActivityForm, { PRIORITIES, type ActivityFormData } from '../components/Activity/ActivityForm'
import dayjs from 'dayjs'

interface Activity {
  id: number
  title: string
  description?: string
  category?: string
  priority?: number
  estimated_pomodoros?: number
  status?: string
  created_at?: string
}

interface TodayTaskMinimal {
  activity_id?: number | null
}

const priorityLabel = ['', '高', '中', '低']
const priorityColor = ['', '#ef4444', '#f59e0b', '#6b7280']

const ActivityPage = (): React.JSX.Element => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Activity | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterPri, setFilterPri] = useState(0)
  const [toast, setToast] = useState('')
  const [todayActivityIds, setTodayActivityIds] = useState<Set<number>>(new Set())

  const today = dayjs().format('YYYY-MM-DD')

  const load = useCallback(async () => {
    const data = await window.api.getActivities('active') as Activity[]
    setActivities(data)
    const todayTasks = await window.api.getTodayTasks(today) as TodayTaskMinimal[]
    setTodayActivityIds(new Set(todayTasks.map(t => t.activity_id).filter((id): id is number => id != null)))
  }, [today])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string): void => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleAdd = async (data: ActivityFormData): Promise<void> => {
    await window.api.createActivity(data)
    setShowForm(false)
    await load()
    showToast('已添加任务')
  }

  const handleEdit = async (data: ActivityFormData): Promise<void> => {
    if (!editTarget) return
    await window.api.updateActivity(editTarget.id, data)
    setEditTarget(null)
    await load()
    showToast('已更新任务')
  }

  const handleArchive = async (id: number): Promise<void> => {
    await window.api.archiveActivity(id)
    await load()
    showToast('已归档')
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.api.deleteActivity(id)
    await load()
    showToast('已删除')
  }

  const handleAddToToday = async (a: Activity): Promise<void> => {
    if (todayActivityIds.has(a.id)) return
    const today = dayjs().format('YYYY-MM-DD')
    await window.api.createTodayTask({
      activity_id: a.id,
      date: today,
      estimated_pomodoros: a.estimated_pomodoros ?? 1
    })
    setTodayActivityIds(prev => new Set(prev).add(a.id))
    showToast('已加入今日计划 ✅')
  }

  const filtered = activities.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || a.category === filterCat
    const matchPri = !filterPri || a.priority === filterPri
    return matchSearch && matchCat && matchPri
  })

  const categories = [...new Set(activities.map(a => a.category).filter(Boolean))] as string[]

  return (
    <div className="h-full flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>活动清单</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {activities.length} 个待办任务
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditTarget(null) }} className="btn-primary">
          + 新建任务
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="input-base flex-1 min-w-40"
          placeholder="🔍 搜索任务..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input-base w-28"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="">全部分类</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input-base w-28"
          value={filterPri}
          onChange={e => setFilterPri(Number(e.target.value))}
        >
          <option value={0}>全部优先级</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}优先</option>)}
        </select>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>新建任务</h3>
          <ActivityForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            <div className="text-4xl mb-3">📋</div>
            <p>{search || filterCat || filterPri ? '没有匹配的任务' : '还没有任务，点击「新建任务」开始'}</p>
          </div>
        )}

        {filtered.map(a => (
          <div
            key={a.id}
            className="card px-4 py-3 flex items-start gap-3 group transition-all duration-200 hover:shadow-card-hover"
          >
            {/* Priority dot */}
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
              style={{ background: priorityColor[a.priority ?? 2] }}
              title={`${priorityLabel[a.priority ?? 2]}优先级`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editTarget?.id === a.id ? (
                <ActivityForm
                  initial={editTarget}
                  onSubmit={handleEdit}
                  onCancel={() => setEditTarget(null)}
                  submitLabel="保存"
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>{a.title}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
                    >
                      {a.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      🍅 ×{a.estimated_pomodoros ?? 1}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {a.description}
                    </p>
                  )}
                  {a.created_at && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {dayjs(a.created_at).format('M月D日')} 创建
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            {editTarget?.id !== a.id && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => void handleAddToToday(a)}
                  disabled={todayActivityIds.has(a.id)}
                  className="px-2 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
                  style={{
                    background: todayActivityIds.has(a.id) ? 'var(--color-bg-sidebar)' : 'var(--color-primary)',
                    color: todayActivityIds.has(a.id) ? 'var(--color-text-muted)' : '#fff',
                    cursor: todayActivityIds.has(a.id) ? 'default' : 'pointer'
                  }}
                  title={todayActivityIds.has(a.id) ? '今日已加入' : '加入今日计划'}
                >
                  {todayActivityIds.has(a.id) ? '已加入' : '今日 +'}
                </button>
                <button
                  onClick={() => setEditTarget(a)}
                  className="p-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleArchive(a.id)}
                  className="p-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                  style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
                  title="归档"
                >
                  📦
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                  style={{ background: 'var(--color-bg-sidebar)', color: '#ef4444' }}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium shadow-card"
          style={{ background: 'var(--color-primary)', color: '#fff', zIndex: 100 }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

export default ActivityPage

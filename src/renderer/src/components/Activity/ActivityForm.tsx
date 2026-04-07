import React, { useState } from 'react'

interface ActivityFormData {
  title: string
  description: string
  category: string
  priority: number
  estimated_pomodoros: number
}

interface ActivityFormProps {
  initial?: Partial<ActivityFormData>
  onSubmit: (data: ActivityFormData) => void
  onCancel: () => void
  submitLabel?: string
}

const CATEGORIES = ['工作', '学习', '生活', '其他']
const PRIORITIES = [
  { value: 1, label: '高', color: '#ef4444' },
  { value: 2, label: '中', color: '#f59e0b' },
  { value: 3, label: '低', color: '#6b7280' }
]

const ActivityForm = ({ initial, onSubmit, onCancel, submitLabel = '添加' }: ActivityFormProps): React.JSX.Element => {
  const [form, setForm] = useState<ActivityFormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? '工作',
    priority: initial?.priority ?? 2,
    estimated_pomodoros: initial?.estimated_pomodoros ?? 1
  })

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
          任务标题 *
        </label>
        <input
          className="input-base"
          placeholder="输入任务名称..."
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
          maxLength={100}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
          描述
        </label>
        <textarea
          className="input-base resize-none"
          placeholder="详细描述（可选）..."
          rows={2}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          maxLength={500}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>分类</label>
          <select
            className="input-base"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>优先级</label>
          <select
            className="input-base"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
          >
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div style={{ width: 90 }}>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
            预估🍅
          </label>
          <input
            type="number"
            className="input-base text-center"
            min={1}
            max={20}
            value={form.estimated_pomodoros}
            onChange={e => setForm(f => ({ ...f, estimated_pomodoros: Math.max(1, Number(e.target.value)) }))}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          取消
        </button>
      </div>
    </form>
  )
}

export default ActivityForm
export { PRIORITIES, CATEGORIES }
export type { ActivityFormData }

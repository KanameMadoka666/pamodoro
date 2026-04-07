import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTimerStore } from '../../stores/timerStore'

interface TodayTask {
  id: number
  title: string
  category?: string
  priority?: number
  estimated_pomodoros?: number
  actual_pomodoros?: number
  status?: string
  notes?: string
}

interface TaskCardProps {
  task: TodayTask
  onStart: (id: number) => void
  onComplete: (id: number) => void
  onIncomplete: (id: number) => void
  onDelete: (id: number) => void
  isActive?: boolean
}

const priorityColor = ['', '#ef4444', '#f59e0b', '#6b7280']

const SortableTaskCard = ({
  task, onStart, onComplete, onIncomplete, onDelete, isActive = false
}: TaskCardProps): React.JSX.Element => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const currentTaskId = useTimerStore(s => s.currentTaskId)
  const isSelected = currentTaskId === task.id

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined
  }

  const pomCount = task.actual_pomodoros ?? 0
  const pomEstimate = task.estimated_pomodoros ?? 1
  const progress = Math.min(1, pomCount / pomEstimate)

  const statusStyles: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'var(--color-bg-sidebar)', text: 'var(--color-text-muted)' },
    in_progress: { bg: 'var(--color-primary)', text: '#fff' },
    completed: { bg: '#22c55e20', text: '#22c55e' },
    incomplete: { bg: '#ef444420', text: '#ef4444' }
  }

  const statusLabel: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    incomplete: '未完成'
  }

  const s = task.status ?? 'pending'
  const isDone = s === 'completed' || s === 'incomplete'

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        outline: isSelected ? `2px solid var(--color-primary)` : undefined,
        outlineOffset: isSelected ? '2px' : undefined
      }}
      className="card px-4 py-3 flex gap-3 items-start transition-all duration-200 group"
      {...(isActive ? {} : {})}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-base cursor-grab active:cursor-grabbing shrink-0 opacity-30 group-hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-text-muted)', touchAction: 'none' }}
      >
        ⠿
      </button>

      {/* Priority dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
        style={{ background: priorityColor[task.priority ?? 2] }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-medium"
            style={{
              color: 'var(--color-text)',
              textDecoration: isDone ? 'line-through' : 'none',
              opacity: isDone ? 0.5 : 1
            }}
          >
            {task.title}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: statusStyles[s].bg, color: statusStyles[s].text }}
          >
            {statusLabel[s]}
          </span>
          {task.category && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {task.category}
            </span>
          )}
        </div>

        {/* Pomodoro progress bar */}
        <div className="flex items-center gap-2 mt-2">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--color-progress-track)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, background: 'var(--color-timer-ring)' }}
            />
          </div>
          <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            {pomCount}/{pomEstimate} 🍅
          </span>
        </div>
      </div>

      {/* Actions */}
      {!isDone && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStart(task.id)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-sidebar)',
              color: isSelected ? '#fff' : 'var(--color-text)'
            }}
            title={isSelected ? '当前任务' : '选择并开始'}
          >
            {isSelected ? '✓ 已选' : '▶ 开始'}
          </button>
          <button
            onClick={() => onComplete(task.id)}
            className="p-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'var(--color-bg-sidebar)', color: '#22c55e' }}
            title="标记完成"
          >
            ✓
          </button>
          <button
            onClick={() => onIncomplete(task.id)}
            className="p-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'var(--color-bg-sidebar)', color: '#ef4444' }}
            title="标记未完成"
          >
            ✗
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
            title="移出今日计划"
          >
            ✕
          </button>
        </div>
      )}

      {isDone && (
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all shrink-0"
          style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
          title="移除"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default SortableTaskCard
export type { TodayTask }

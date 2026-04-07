import React, { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableTaskCard, { type TodayTask } from '../components/TodayPlan/SortableTaskCard'
import { useTimerStore } from '../stores/timerStore'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const TodayPage = (): React.JSX.Element => {
  const [tasks, setTasks] = useState<TodayTask[]>([])
  const [toast, setToast] = useState('')
  const navigate = useNavigate()
  const { setTask, currentTaskId } = useTimerStore()

  const today = dayjs().format('YYYY-MM-DD')

  const load = useCallback(async () => {
    const data = await window.api.getTodayTasks(today) as TodayTask[]
    setTasks(data)
  }, [today])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string): void => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)
    const newTasks = arrayMove(tasks, oldIndex, newIndex)
    setTasks(newTasks)
    await window.api.reorderTodayTasks(
      newTasks.map((t, i) => ({ id: t.id!, sort_order: i }))
    )
  }

  const handleStart = (id: number): void => {
    setTask(id)
    navigate('/')
    showToast('已选择任务，前往番茄钟开始')
  }

  const handleComplete = async (id: number): Promise<void> => {
    await window.api.updateTodayTask(id, { status: 'completed' })
    await load()
    showToast('✅ 已标记完成')
  }

  const handleIncomplete = async (id: number): Promise<void> => {
    await window.api.updateTodayTask(id, { status: 'incomplete' })
    await load()
    showToast('已标记未完成')
  }

  const handleDelete = async (id: number): Promise<void> => {
    // If this was the selected task, deselect
    if (currentTaskId === id) setTask(null)
    await window.api.deleteTodayTask(id)
    await load()
  }

  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'incomplete')
  const done = tasks.filter(t => t.status === 'completed' || t.status === 'incomplete')

  const totalEstimated = tasks.reduce((s, t) => s + (t.estimated_pomodoros ?? 1), 0)
  const totalActual = tasks.reduce((s, t) => s + (t.actual_pomodoros ?? 0), 0)
  const completedCount = done.filter(t => t.status === 'completed').length

  return (
    <div className="h-full flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            今日计划
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {dayjs().format('YYYY年M月D日')} · {tasks.length} 项任务
          </p>
        </div>
        {/* Summary cards */}
        <div className="flex gap-3">
          <div className="card px-3 py-2 text-center min-w-[72px]">
            <div className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
              {completedCount}/{tasks.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>已完成</div>
          </div>
          <div className="card px-3 py-2 text-center min-w-[72px]">
            <div className="text-lg font-bold" style={{ color: 'var(--color-timer-ring)' }}>
              {totalActual}/{totalEstimated}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>🍅</div>
          </div>
        </div>
      </div>

      {/* Pending tasks with drag */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
        {pending.length === 0 && done.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <div className="text-5xl">📅</div>
            <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
              今日计划为空<br />
              <span className="text-sm">前往「活动清单」将任务加入今日计划</span>
            </p>
            <button
              onClick={() => navigate('/activities')}
              className="btn-primary px-6"
            >
              前往活动清单
            </button>
          </div>
        )}

        {pending.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={pending.map(t => t.id!)} strategy={verticalListSortingStrategy}>
              {pending.map(task => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onIncomplete={handleIncomplete}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Done section — wrap in DndContext+SortableContext so useSortable doesn't throw */}
        {done.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
              已结束 ({done.length})
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
              <SortableContext items={done.map(t => t.id!)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {done.map(task => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onStart={handleStart}
                      onComplete={handleComplete}
                      onIncomplete={handleIncomplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
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

export default TodayPage

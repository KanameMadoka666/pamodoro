import React, { useEffect, useRef, useState, useCallback } from 'react'
import CircleProgress from '../components/Timer/CircleProgress'
import { useTimerStore, type TimerPhase } from '../stores/timerStore'
import { useSettingsStore } from '../stores/settingsStore'

const phaseColors: Record<TimerPhase, string> = {
  work: 'var(--color-timer-ring)',
  short_break: 'var(--color-timer-break)',
  long_break: 'var(--color-timer-break)'
}

const phaseNames: Record<TimerPhase, string> = {
  work: '专注时间',
  short_break: '短休息',
  long_break: '长休息'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface CurrentTask {
  id: number
  title: string
  category?: string
  estimated_pomodoros?: number
  actual_pomodoros?: number
}

const TimerPage = (): React.JSX.Element => {
  const {
    phase, status, remaining, totalSeconds, currentTaskId, pomodoroCount,
    setTask, startWork, startBreak, pause, resume, reset, skip
  } = useTimerStore()
  const { workDuration, shortBreak, longBreak, longBreakInterval, loaded, saveSettings } = useSettingsStore()

  const cfg = { workDuration, shortBreak, longBreak, longBreakInterval }

  const [todayTasks, setTodayTasks] = useState<CurrentTask[]>([])
  const [currentTask, setCurrentTask] = useState<CurrentTask | null>(null)
  const [showDurationPicker, setShowDurationPicker] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')

  const pickerRef = useRef<HTMLDivElement | null>(null)

  const phasePresets: Record<TimerPhase, number[]> = {
    work: [15, 20, 25, 30, 45, 50, 60],
    short_break: [3, 5, 10, 15],
    long_break: [10, 15, 20, 30]
  }

  const currentPhaseDuration = phase === 'work' ? workDuration : phase === 'short_break' ? shortBreak : longBreak

  const applyDuration = async (minutes: number): Promise<void> => {
    if (minutes < 1 || minutes > 180) return
    const key = phase === 'work' ? 'workDuration' : phase === 'short_break' ? 'shortBreak' : 'longBreak'
    await saveSettings({ [key]: minutes })
    useTimerStore.setState({ remaining: minutes * 60, totalSeconds: minutes * 60 })
    setShowDurationPicker(false)
    setCustomMinutes('')
  }

  // Close picker when clicking outside
  useEffect(() => {
    if (!showDurationPicker) return
    const handler = (e: MouseEvent): void => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDurationPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDurationPicker])

  // Load today tasks
  const loadTodayTasks = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const tasks = await window.api.getTodayTasks(today) as CurrentTask[]
    setTodayTasks(tasks.filter(t => (t as unknown as { status: string }).status !== 'completed'))
  }, [])

  useEffect(() => {
    if (loaded) loadTodayTasks()
  }, [loaded, loadTodayTasks])

  // Reload task list whenever a pomodoro completes (pomodoroCount bumps)
  useEffect(() => {
    if (loaded) loadTodayTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroCount])

  // Update current task when taskId changes
  useEffect(() => {
    if (currentTaskId) {
      const t = todayTasks.find(t => t.id === currentTaskId) ?? null
      setCurrentTask(t)
    } else {
      setCurrentTask(null)
    }
  }, [currentTaskId, todayTasks])

  const handleStart = async (): Promise<void> => {
    if (phase === 'work') {
      await startWork(cfg)
    } else {
      startBreak(phase === 'long_break', cfg)
    }
  }

  const handleSelectTask = (taskId: number | null): void => {
    const title = taskId ? (todayTasks.find(t => t.id === taskId)?.title ?? null) : null
    setTask(taskId, title)
  }

  const isWork = phase === 'work'
  const primaryColor = phaseColors[phase]

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 select-none">
      {/* Phase Pills */}
      <div className="flex gap-2">
        {(['work', 'short_break', 'long_break'] as TimerPhase[]).map(p => (
          <button
            key={p}
            onClick={() => {
              if (status === 'idle') {
                const secs = p === 'work' ? workDuration * 60 : p === 'short_break' ? shortBreak * 60 : longBreak * 60
                useTimerStore.setState({ phase: p, remaining: secs, totalSeconds: secs })
                setShowDurationPicker(false)
              }
            }}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: phase === p ? primaryColor : 'var(--color-bg-sidebar)',
              color: phase === p ? '#fff' : 'var(--color-text-muted)',
              border: `1px solid ${phase === p ? primaryColor : 'var(--color-border)'}`
            }}
          >
            {phaseNames[p]}
          </button>
        ))}
      </div>

      {/* Duration Picker */}
      {status === 'idle' && (
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowDurationPicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            <span>⏱</span>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{currentPhaseDuration} 分钟</span>
            <span style={{ fontSize: 10 }}>{showDurationPicker ? '▲' : '▼'}</span>
          </button>

          {showDurationPicker && (
            <div
              className="absolute top-full mt-2 left-1/2 z-50 rounded-xl p-3 shadow-lg"
              style={{
                transform: 'translateX(-50%)',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                minWidth: 240
              }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>常用时长（分钟）</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {phasePresets[phase].map(min => (
                  <button
                    key={min}
                    onClick={() => void applyDuration(min)}
                    className="px-2.5 py-1 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      background: min === currentPhaseDuration ? primaryColor : 'var(--color-bg-sidebar)',
                      color: min === currentPhaseDuration ? '#fff' : 'var(--color-text)',
                      border: `1px solid ${min === currentPhaseDuration ? primaryColor : 'var(--color-border)'}`
                    }}
                  >
                    {min}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void applyDuration(Number(customMinutes)) }}
                  placeholder="自定义..."
                  className="flex-1 px-2 py-1 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--color-bg-sidebar)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                />
                <button
                  onClick={() => void applyDuration(Number(customMinutes))}
                  disabled={!customMinutes || Number(customMinutes) < 1}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: primaryColor, color: '#fff' }}
                >
                  确定
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timer Ring */}
      <div className="flex flex-col items-center gap-6">
        <CircleProgress remaining={remaining} total={totalSeconds} phase={phase} size={280} strokeWidth={12}>
          <div className="flex flex-col items-center">
            <span
              className="text-6xl font-bold font-mono tracking-tighter"
              style={{ color: 'var(--color-text)', lineHeight: 1.1 }}
            >
              {formatTime(remaining)}
            </span>
            <span className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
              {phaseNames[phase]}
            </span>
            {isWork && (
              <span className="text-xs mt-1 px-2 py-0.5 rounded-full" style={{ background: 'var(--color-progress-track)', color: primaryColor }}>
                #{pomodoroCount + 1}
              </span>
            )}
          </div>
        </CircleProgress>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            disabled={status === 'idle'}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all active:scale-90 disabled:opacity-30"
            style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
            title="重置"
          >
            ↺
          </button>

          {status === 'running' ? (
            <button
              onClick={pause}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all active:scale-90 shadow-card"
              style={{ background: primaryColor, color: '#fff' }}
            >
              ⏸
            </button>
          ) : (
            <button
              onClick={status === 'paused' ? resume : handleStart}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all active:scale-90 shadow-card"
              style={{ background: primaryColor, color: '#fff' }}
            >
              ▶
            </button>
          )}

          <button
            onClick={() => { if (status !== 'running') void skip(cfg) }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all active:scale-90"
            style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text-muted)' }}
            title="跳过"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Current Task Panel */}
      <div className="card p-4 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>当前任务</span>
          {currentTask && (
            <button
              onClick={() => handleSelectTask(null)}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-sidebar)' }}
            >
              取消选择
            </button>
          )}
        </div>

        {currentTask ? (
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: primaryColor }} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ color: 'var(--color-text)' }}>{currentTask.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {currentTask.category} · 番茄 {currentTask.actual_pomodoros ?? 0}/{currentTask.estimated_pomodoros ?? 1}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-center py-2" style={{ color: 'var(--color-text-muted)' }}>
            未选择任务 — 请从今日计划中选择，或从下方选择
          </p>
        )}

        {/* Task quick select */}
        {todayTasks.length > 0 && !currentTask && (
          <div className="mt-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {todayTasks.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTask(t.id)}
                className="text-left px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
                style={{ background: 'var(--color-bg-sidebar)', color: 'var(--color-text)' }}
              >
                <span className="font-medium">{t.title}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t.actual_pomodoros ?? 0}/{t.estimated_pomodoros ?? 1} 🍅
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pomodoro dots */}
      <div className="flex gap-2 items-center">
        {Array.from({ length: cfg.longBreakInterval }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={{
              background: i < (pomodoroCount % cfg.longBreakInterval)
                ? 'var(--color-timer-ring)'
                : 'var(--color-progress-track)'
            }}
          />
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
          今日已完成 {pomodoroCount} 个番茄
        </span>
      </div>
    </div>
  )
}

export default TimerPage

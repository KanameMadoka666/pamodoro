import { create } from 'zustand'
import dayjs from 'dayjs'

export type TimerPhase = 'work' | 'short_break' | 'long_break'
export type TimerStatus = 'idle' | 'running' | 'paused'

// Callback invoked when current phase countdown reaches zero
export type OnPhaseComplete = (phase: TimerPhase, taskId: number | null, sessionId: number | null) => void

interface TimerConfig {
  workDuration: number        // minutes
  shortBreak: number
  longBreak: number
  longBreakInterval: number
}

interface TimerState {
  phase: TimerPhase
  status: TimerStatus
  remaining: number           // seconds remaining
  totalSeconds: number        // total seconds for current phase
  currentTaskId: number | null
  currentTaskTitle: string | null
  currentSessionId: number | null
  pomodoroCount: number       // completed work sessions in this cycle
  sessionStartTime: string | null
  showDialog: boolean
  completedPhase: TimerPhase

  // Actions
  setTask: (taskId: number | null, title?: string | null) => void
  startWork: (cfg: TimerConfig) => Promise<void>
  startBreak: (isLong: boolean, cfg: TimerConfig) => void
  pause: () => void
  resume: () => void
  reset: () => void
  dismissDialog: () => void
  skip: (cfg: TimerConfig) => Promise<void>
  tick: () => void
  completePhase: (result: 'completed' | 'interrupted', cfg: TimerConfig, onComplete?: OnPhaseComplete) => Promise<void>
}

export const useTimerStore = create<TimerState>((set, get) => ({
  phase: 'work',
  status: 'idle',
  remaining: 25 * 60,
  totalSeconds: 25 * 60,
  currentTaskId: null,
  currentTaskTitle: null,
  currentSessionId: null,
  pomodoroCount: 0,
  sessionStartTime: null,
  showDialog: false,
  completedPhase: 'work',

  setTask: (taskId, title) => set({ currentTaskId: taskId, currentTaskTitle: title ?? null }),

  startWork: async (cfg) => {
    const { currentTaskId } = get()
    const startTime = dayjs().toISOString()
    // Create session record in DB
    const session = await window.api.startSession({
      task_id: currentTaskId,
      start_time: startTime,
      type: 'work'
    }) as { id: number }
    const secs = cfg.workDuration * 60
    set({
      phase: 'work',
      status: 'running',
      remaining: secs,
      totalSeconds: secs,
      currentSessionId: session.id,
      sessionStartTime: startTime
    })
  },

  startBreak: (isLong, cfg) => {
    const phase: TimerPhase = isLong ? 'long_break' : 'short_break'
    const secs = (isLong ? cfg.longBreak : cfg.shortBreak) * 60
    set({ phase, status: 'running', remaining: secs, totalSeconds: secs, currentSessionId: null })
  },

  pause: () => set({ status: 'paused' }),
  resume: () => set({ status: 'running' }),

  reset: () => {
    const { totalSeconds } = get()
    set({ status: 'idle', remaining: totalSeconds })
  },

  dismissDialog: () => set({ showDialog: false }),

  skip: async (cfg) => {
    const { phase, currentSessionId, pomodoroCount } = get()
    // Close any active session as interrupted before switching phase
    if (currentSessionId) {
      await window.api.finishSession(currentSessionId, 'interrupted')
    }
    if (phase === 'work') {
      const newCount = pomodoroCount + 1
      const isLong = newCount % cfg.longBreakInterval === 0
      const nextPhase: TimerPhase = isLong ? 'long_break' : 'short_break'
      const secs = (isLong ? cfg.longBreak : cfg.shortBreak) * 60
      set({ phase: nextPhase, status: 'idle', remaining: secs, totalSeconds: secs, pomodoroCount: newCount, currentSessionId: null })
    } else {
      const secs = cfg.workDuration * 60
      set({ phase: 'work', status: 'idle', remaining: secs, totalSeconds: secs, currentSessionId: null })
    }
  },

  tick: () => {
    const { remaining, phase } = get()
    if (remaining <= 1) {
      set({ remaining: 0, status: 'idle', showDialog: true, completedPhase: phase })
    } else {
      set({ remaining: remaining - 1 })
    }
  },

  completePhase: async (result, cfg, onComplete) => {
    const { phase, currentTaskId, currentSessionId, pomodoroCount } = get()
    // Finish DB session
    if (currentSessionId) {
      await window.api.finishSession(currentSessionId, result)
    }
    // If completing a work session, write work log & update task pomodoro count
    if (phase === 'work' && result === 'completed') {
      if (currentTaskId) {
        await window.api.incrementPomodoro(currentTaskId)
      }
      // Auto-write work log
      const today = dayjs().format('YYYY-MM-DD')
      await window.api.createWorkLog({
        date: today,
        start_time: get().sessionStartTime ?? dayjs().toISOString(),
        end_time: dayjs().toISOString(),
        task_id: currentTaskId,
        pomodoro_count: 1
      })
    }
    if (onComplete) onComplete(phase, currentTaskId, currentSessionId)
    // Transition to next idle phase
    const newCount = phase === 'work' && result === 'completed' ? pomodoroCount + 1 : pomodoroCount
    if (phase === 'work' && result === 'completed') {
      const isLong = newCount % cfg.longBreakInterval === 0
      const nextPhase: TimerPhase = isLong ? 'long_break' : 'short_break'
      const secs = (isLong ? cfg.longBreak : cfg.shortBreak) * 60
      set({ phase: nextPhase, status: 'idle', remaining: secs, totalSeconds: secs, pomodoroCount: newCount, currentSessionId: null })
    } else {
      const secs = cfg.workDuration * 60
      set({ phase: 'work', status: 'idle', remaining: secs, totalSeconds: secs, currentSessionId: null })
    }
  }
}))

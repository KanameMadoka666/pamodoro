/**
 * TimerEngine — always mounted in App.tsx (never unmounted on navigation).
 * Owns the tick interval, document-title updates, and the completion dialog.
 * This ensures the countdown keeps running and the dialog appears even when
 * the user is on a different page.
 */
import React, { useEffect, useRef, useCallback } from 'react'
import CompleteDialog from './CompleteDialog'
import { useTimerStore, type TimerPhase } from '../../stores/timerStore'
import { useSettingsStore } from '../../stores/settingsStore'

/** Play a short ascending chord via Web Audio API as the completion sound */
function playCompletionSfx(volumePct: number): void {
  if (volumePct <= 0) return
  try {
    const ctx = new AudioContext()
    const vol = (volumePct / 100) * 0.4
    const notes = [523.25, 659.25, 783.99] // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.14
      gain.gain.setValueAtTime(vol, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.start(t)
      osc.stop(t + 0.35)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch { /* audio context may be unavailable */ }
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

const TimerEngine = (): React.JSX.Element | null => {
  const {
    status, phase, remaining,
    showDialog, completedPhase, currentTaskTitle,
    tick, dismissDialog, completePhase, startWork
  } = useTimerStore()
  const { workDuration, shortBreak, longBreak, longBreakInterval, sfxVolume } = useSettingsStore()
  const cfg = { workDuration, shortBreak, longBreak, longBreakInterval }

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Tick interval ────────────────────────────────────────────────────────
  // Runs regardless of which page is active. Kept alive for the full app lifetime.
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => tick(), 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, tick])

  // ── Document title ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'running') {
      document.title = `${formatTime(remaining)} — ${phaseNames[phase]} | Pamodoro`
    } else {
      document.title = 'Pamodoro 番茄钟'
    }
  }, [remaining, phase, status])

  // ── Flash window + play SFX when timer completes ────────────────────────
  useEffect(() => {
    if (showDialog) {
      void window.api.flashWindow()
      playCompletionSfx(sfxVolume)
    } else {
      void window.api.unflashWindow()
    }
  }, [showDialog])

  // ── Dialog handlers ──────────────────────────────────────────────────────
  const handleComplete = useCallback(async (): Promise<void> => {
    dismissDialog()
    if (completedPhase === 'work') {
      await completePhase('completed', cfg)
    } else {
      await startWork(cfg)
    }
  }, [completedPhase, cfg, dismissDialog, completePhase, startWork])

  const handleIncomplete = useCallback(async (): Promise<void> => {
    dismissDialog()
    await completePhase('interrupted', cfg)
  }, [cfg, dismissDialog, completePhase])

  const handleContinue = useCallback(async (): Promise<void> => {
    dismissDialog()
    await completePhase('completed', cfg)
    await startWork(cfg)
  }, [cfg, dismissDialog, completePhase, startWork])

  const handleClose = useCallback((): void => {
    dismissDialog()
  }, [dismissDialog])

  // ── Render ───────────────────────────────────────────────────────────────
  if (!showDialog) return null

  return (
    <CompleteDialog
      phase={completedPhase}
      taskTitle={currentTaskTitle ?? undefined}
      onComplete={() => void handleComplete()}
      onIncomplete={() => void handleIncomplete()}
      onContinue={() => void handleContinue()}
      onClose={handleClose}
    />
  )
}

export default TimerEngine

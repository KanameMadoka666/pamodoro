import React from 'react'
import type { TimerPhase } from '../../stores/timerStore'

interface CompleteDialogProps {
  phase: TimerPhase
  taskTitle?: string
  onComplete: () => void
  onIncomplete: () => void
  onContinue: () => void
  onClose: () => void
}

const phaseLabel: Record<TimerPhase, string> = {
  work: '🍅 番茄时间结束！',
  short_break: '☕ 短休息结束！',
  long_break: '🌿 长休息结束！'
}

const CompleteDialog = ({
  phase,
  taskTitle,
  onComplete,
  onIncomplete,
  onContinue,
  onClose
}: CompleteDialogProps): React.JSX.Element => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="card p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-5 animate-bounce-in"
        style={{ animationDuration: '0.3s' }}
      >
        <div className="text-5xl">{phase === 'work' ? '🍅' : phase === 'short_break' ? '☕' : '🌿'}</div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {phaseLabel[phase]}
          </h2>
          {taskTitle && phase === 'work' && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              任务：{taskTitle}
            </p>
          )}
        </div>

        {phase === 'work' ? (
          <div className="flex flex-col gap-3 w-full">
            <button onClick={onComplete} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <span>✅</span> 已完成任务
            </button>
            <button onClick={onIncomplete} className="btn-ghost w-full py-3 flex items-center justify-center gap-2">
              <span>❌</span> 未完成
            </button>
            <button onClick={onContinue} className="btn-ghost w-full py-3 flex items-center justify-center gap-2">
              <span>🍅</span> 再来一个
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <button onClick={onComplete} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <span>▶️</span> 开始工作
            </button>
            <button onClick={onClose} className="btn-ghost w-full py-3">
              稍后开始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompleteDialog

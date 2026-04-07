import React from 'react'

interface CircleProgressProps {
  remaining: number
  total: number
  phase: 'work' | 'short_break' | 'long_break'
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}

const CircleProgress = ({
  remaining,
  total,
  phase,
  size = 260,
  strokeWidth = 10,
  children
}: CircleProgressProps): React.JSX.Element => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? remaining / total : 1
  const dashOffset = circumference * (1 - progress)

  const ringColor = phase === 'work' ? 'var(--color-timer-ring)' : 'var(--color-timer-break)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg]"
        style={{ display: 'block' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-progress-track)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s ease' }}
        />
      </svg>
      {/* Center content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        {children}
      </div>
    </div>
  )
}

export default CircleProgress

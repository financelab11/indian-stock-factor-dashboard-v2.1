'use client'
import { getScoreBg } from '@/lib/score-utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2 py-0.5'
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold tabular-nums ${sizeClass} ${getScoreBg(score)}`}>
      {score.toFixed(1)}
    </span>
  )
}

interface ScoreBarProps {
  score: number
  label?: string
  showValue?: boolean
}

export function ScoreBar({ score, label, showValue = true }: ScoreBarProps) {
  const color =
    score >= 70 ? 'bg-emerald-500' : score >= 55 ? 'bg-lime-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          {showValue && <span className="text-xs font-semibold ml-2 shrink-0">{score.toFixed(1)}</span>}
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  )
}

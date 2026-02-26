'use client'
import { Calendar } from 'lucide-react'

interface Props {
  year: number
  availableYears: number[]
  onChange: (y: number) => void
  sticky?: boolean
}

export function YearSelector({ year, availableYears, onChange, sticky }: Props) {
  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${sticky ? 'sticky top-12 md:top-14 z-30 bg-background/90 backdrop-blur-sm py-2 -mx-3 sm:-mx-4 px-3 sm:px-4 border-b border-border/50' : ''}`}>
      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {availableYears.map(y => (
          <button
            key={y}
            onClick={() => onChange(y)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 font-medium ${
                y === year
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              FY{String(y).slice(2)}
          </button>
        ))}
      </div>
    </div>
  )
}

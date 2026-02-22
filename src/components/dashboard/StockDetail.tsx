'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, ChevronDown, ChevronRight, Info, Award } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell
} from 'recharts'
import { ScoreBadge, ScoreBar } from './ScoreBadge'
import { YearSelector } from './YearSelector'
import { formatMarketCap, getScoreLabel } from '@/lib/score-utils'
import { useRouter as useNextRouter } from 'next/navigation'

interface Factor { id: string; name: string; description: string; weight: number }
interface Parameter { id: string; name: string; description: string; normalization_method: string }
interface Company { ticker: string; name: string; sector: string; industry: string; market_cap: number; market_cap_bucket: string }
interface StockDetailData {
  company: Company
  factors: Array<{ factor: Factor; score: number; parameters: Array<{ parameter: Parameter; rawValue: number; normalizedValue: number }> }>
  finalScore: number
  historicalScores: Array<{ year: number; finalScore: number; factorScores: Record<string, number> }>
  availableYears: number[]
  currentYear: number
}

interface Props {
  ticker: string
  year?: number
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

export function StockDetail({ ticker, year: initialYear }: Props) {
  const router = useRouter()
  const [data, setData] = useState<StockDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(initialYear)
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = year ? `?year=${year}` : ''
        const res = await fetch(`/api/stocks/${ticker}${params}`)
        if (res.ok) {
          const d = await res.json()
          setData(d)
          if (!year) setYear(d.currentYear)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ticker, year])

  if (loading) return <StockDetailSkeleton />
  if (!data) return (
    <div className="text-center py-20 text-muted-foreground">
      <div className="text-4xl mb-3">📊</div>
      <p className="font-medium">Stock not found</p>
      <p className="text-sm mt-1">Ticker &quot;{ticker}&quot; doesn&apos;t exist in the database</p>
    </div>
  )

  const { company, factors, finalScore, historicalScores } = data

  const radarData = factors.map(f => ({
    factor: f.factor.name,
    score: f.score,
    fullMark: 100,
  }))

  const trendData = historicalScores.map(h => ({
    year: String(h.year),
    'Final Score': h.finalScore,
    ...Object.fromEntries(Object.entries(h.factorScores).map(([k, v]) => [k, v])),
  }))

  function toggleFactor(id: string) {
    setExpandedFactors(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const scoreLabel = getScoreLabel(finalScore)
  const scoreLabelColor =
    finalScore >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    finalScore >= 55 ? 'text-lime-700 bg-lime-50 border-lime-200' :
    finalScore >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="flex flex-col gap-4">
      {/* Back + Year */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <YearSelector
          year={year ?? data.currentYear}
          availableYears={data.availableYears}
          onChange={setYear}
        />
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold tracking-tight">{company.ticker}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${scoreLabelColor}`}>
                {scoreLabel}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-tight">{company.name}</p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 bg-secondary rounded-full">{company.sector}</span>
              <span className="px-2 py-0.5 bg-secondary rounded-full">{company.market_cap_bucket}</span>
              <span className="px-2 py-0.5 bg-secondary rounded-full">{formatMarketCap(company.market_cap)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground mb-1">Score</div>
            <ScoreBadge score={finalScore} size="lg" />
          </div>
        </div>

        {/* Factor score pills */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-border">
          {factors.map((f, i) => (
            <div key={f.factor.id} className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg bg-muted/60">
              <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-[10px] text-muted-foreground font-medium">{f.factor.name}</span>
              <ScoreBadge score={f.score} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Radar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" /> Factor Profile
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Current year snapshot across all factors</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} outerRadius={78}>
              <PolarGrid stroke="currentColor" className="text-border opacity-60" />
              <PolarAngleAxis
                dataKey="factor"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2.5}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend line */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">Historical Trend</h2>
          <p className="text-xs text-muted-foreground mb-3">Final score evolution over years</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-40" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="Final Score"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
              {factors.map((f, i) => (
                <Line
                  key={f.factor.id}
                  type="monotone"
                  dataKey={f.factor.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="5 3"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor bar chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm overflow-hidden">
        <h2 className="text-sm font-semibold mb-1">Factor Scores — {data.currentYear}</h2>
        <p className="text-xs text-muted-foreground mb-3">Color indicates score quality: green = strong, amber = fair, red = weak</p>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart
            data={factors.map(f => ({ name: f.factor.name, score: f.score, weight: `${(f.factor.weight * 100).toFixed(0)}%` }))}
            margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-40" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }}
              formatter={(value: number, name: string, props) => [
                `${value.toFixed(1)} (weight: ${props.payload.weight})`, 'Score'
              ]}
            />
            <Bar dataKey="score" radius={[5, 5, 0, 0]}>
              {factors.map(f => (
                <Cell
                  key={f.factor.id}
                  fill={f.score >= 70 ? '#10b981' : f.score >= 55 ? '#84cc16' : f.score >= 40 ? '#f59e0b' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor accordion */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Factor Breakdown</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">(tap to expand)</span>
        </div>
        {factors.map(({ factor, score, parameters }) => (
          <div
            key={factor.id}
            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md"
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
              onClick={() => toggleFactor(factor.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{factor.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {(factor.weight * 100).toFixed(0)}% weight
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{factor.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ScoreBadge score={score} size="sm" />
                {expandedFactors.has(factor.id)
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </button>

            {expandedFactors.has(factor.id) && (
              <div className="border-t border-border bg-muted/20 px-4 py-4 flex flex-col gap-4">
                {parameters.map(({ parameter, normalizedValue, rawValue }) => (
                  <div key={parameter.id}>
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{parameter.name}</span>
                          <span className="text-xs text-muted-foreground/60 font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {parameter.normalization_method}
                          </span>
                        </div>
                        {parameter.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{parameter.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold">{normalizedValue.toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground">raw: {rawValue.toFixed(1)}</div>
                      </div>
                    </div>
                    <ScoreBar score={normalizedValue} showValue={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StockDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 bg-muted rounded w-20" />
        <div className="h-8 bg-muted rounded w-48" />
      </div>
      <div className="h-36 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-60 rounded-2xl bg-muted" />
        <div className="h-60 rounded-2xl bg-muted" />
      </div>
      <div className="h-48 rounded-2xl bg-muted" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-muted" />)}
    </div>
  )
}

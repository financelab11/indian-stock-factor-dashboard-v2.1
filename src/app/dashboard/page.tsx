'use client'
import { useState, useEffect } from 'react'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { YearSelector } from '@/components/dashboard/YearSelector'
import { TrendingUp, Building2, Target, Activity } from 'lucide-react'

export default function HomePage() {
  const [year, setYear] = useState(2024)
  const [availableYears, setAvailableYears] = useState<number[]>([2020, 2021, 2022, 2023, 2024])
  const [stats, setStats] = useState<{
    total: number
    avgScore: number
    topSector: string
    highScoreCount: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/years').then(r => r.json()).then(d => {
      if (d.years?.length) {
        setAvailableYears(d.years)
        setYear(d.years[d.years.length - 1])
      }
    })
  }, [])

  useEffect(() => {
    fetch(`/api/stocks?year=${year}&sort_by=final_score&sort_order=desc&page_size=200`)
      .then(r => r.json())
      .then(data => {
        const stocks = data.stocks || []
        if (stocks.length === 0) return
        const avg = stocks.reduce((s: number, x: { finalScore: number }) => s + x.finalScore, 0) / stocks.length
        const sectorCounts: Record<string, number> = {}
        stocks.forEach((s: { company: { sector: string } }) => {
          sectorCounts[s.company.sector] = (sectorCounts[s.company.sector] || 0) + 1
        })
        const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
        const highScore = stocks.filter((s: { finalScore: number }) => s.finalScore >= 70).length
        setStats({ total: data.total, avgScore: avg, topSector, highScoreCount: highScore })
      })
  }, [year])

  return (
    <div className="flex flex-col gap-3">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Market Overview</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Factor scores for all listed Indian equities · NSE &amp; BSE</p>
      </div>

      {/* Year selector */}
      <YearSelector year={year} availableYears={availableYears} onChange={setYear} sticky />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          icon={<Building2 className="w-4 h-4" />}
          label="Stocks"
          value={stats ? stats.total.toString() : '—'}
          sub="listed companies"
          color="blue"
          loading={!stats}
        />
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="Avg Score"
          value={stats ? stats.avgScore.toFixed(1) : '—'}
          sub="out of 100"
          color="emerald"
          loading={!stats}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Strong ≥70"
          value={stats ? stats.highScoreCount.toString() : '—'}
          sub="high quality"
          color="green"
          loading={!stats}
        />
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Top Sector"
          value={stats?.topSector ?? '—'}
          sub="most companies"
          color="purple"
          loading={!stats}
          compact
        />
      </div>

      {/* Main table */}
      <MarketOverview year={year} onYearChange={setYear} availableYears={availableYears} />
    </div>
  )
}

function StatCard({
  icon, label, value, sub, color, loading, compact
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'blue' | 'emerald' | 'green' | 'purple'
  loading?: boolean
  compact?: boolean
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className={`inline-flex p-1.5 rounded-lg border mb-1.5 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5">{label}</div>
      {loading ? (
        <div className="h-5 bg-muted rounded animate-pulse w-12 mb-1" />
      ) : (
        <div className={`font-bold leading-tight ${compact ? 'text-xs sm:text-sm' : 'text-lg sm:text-xl'}`}>{value}</div>
      )}
      <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  )
}

'use client'
import { Fragment, useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Play, RefreshCw,
  ChevronUp, ChevronDown, ArrowUpDown, Info, ChevronRight, ChevronDown as Expand,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface SummaryData {
  years: number[]
  portfolio_returns: number[]
  benchmark_returns: number[]
  cumulative_portfolio: number[]
  cumulative_benchmark: number[]
  metrics: {
    cagr: number
    benchmark_cagr: number
    volatility: number
    sharpe: number
    max_drawdown: number
    alpha: number
    win_rate: number
    information_ratio: number
    years_count: number
    drawdown_series: number[]
  }
  has_data: boolean
  top_n: number
}

interface AnnualRow {
  selection_year: number
  return_year: number
  portfolio_return: number
  benchmark_return: number
  alpha: number
  num_stocks: number
  outperformed: boolean
  holdings: { ticker: string; name: string; score: number; return: number }[]
}

// ── Helpers ────────────────────────────────────────────────────────────
function fmt(val: number, decimals = 1) {
  return val.toFixed(decimals)
}

function ReturnBadge({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const pos = value >= 0
  const base = size === 'md' ? 'text-sm font-bold px-2.5 py-1' : 'text-xs font-semibold px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full ${base} ${
      pos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
           : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? '+' : ''}{fmt(value)}%
    </span>
  )
}

// Custom tooltip for bar+line chart
function AnnualTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <div className="font-semibold text-foreground mb-2">FY{String(label).slice(-2)}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className={`font-bold ${p.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {p.value >= 0 ? '+' : ''}{fmt(p.value)}%
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-border mt-1.5 pt-1.5 flex justify-between">
          <span className="text-muted-foreground">Alpha</span>
          <span className={`font-bold ${(payload[0].value - payload[1].value) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {((payload[0].value - payload[1].value) >= 0 ? '+' : '')}{fmt(payload[0].value - payload[1].value)}%
          </span>
        </div>
      )}
    </div>
  )
}

function CumulativeTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs min-w-[170px]">
      <div className="font-semibold text-foreground mb-2">FY{String(label).slice(-2)}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-bold">₹{(p.value / 100).toFixed(2)}L</span>
        </div>
      ))}
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, color, positive, tooltip,
}: {
  label: string
  value: string
  sub?: string
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo'
  positive?: boolean
  tooltip?: string
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  }
  const valueColor = positive === undefined
    ? 'text-foreground'
    : positive ? 'text-emerald-600' : 'text-red-600'

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm relative group">
      {tooltip && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="absolute bottom-5 right-0 bg-foreground text-background text-[10px] px-2 py-1 rounded-lg w-40 z-10 hidden group-hover:block">
              {tooltip}
            </div>
          </div>
        </div>
      )}
      <div className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-md border mb-2 uppercase tracking-wide ${colorMap[color]}`}>
        {label}
      </div>
      <div className={`text-xl sm:text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted rounded animate-pulse ${className}`} />
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function BacktestPage() {
  const [topN, setTopN] = useState(20)
  const [draftTopN, setDraftTopN] = useState(20)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [annualRows, setAnnualRows] = useState<AnnualRow[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [sortKey, setSortKey] = useState<'return_year' | 'portfolio_return' | 'benchmark_return' | 'alpha'>('return_year')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const fetchData = useCallback(async (n: number) => {
    setLoading(true)
    try {
      const [sumRes, annRes] = await Promise.all([
        fetch(`/api/backtest/summary?top_n=${n}`),
        fetch(`/api/backtest/annual?top_n=${n}`),
      ])
      const [sumData, annData] = await Promise.all([sumRes.json(), annRes.json()])
      setSummary(sumData)
      setAnnualRows(annData.rows ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(topN) }, [fetchData, topN])

  async function handleRun() {
    setRunning(true)
    try {
      await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top_n: draftTopN }),
      })
      setTopN(draftTopN)
    } finally {
      setRunning(false)
    }
  }

  // Prepare chart data
  const annualChartData = summary?.years.map((y, i) => ({
    year: y,
    Portfolio: Math.round((summary.portfolio_returns[i] ?? 0) * 10) / 10,
    'Nifty 50': Math.round((summary.benchmark_returns[i] ?? 0) * 10) / 10,
  })) ?? []

  // Prepend FY11 starting point at ₹1L (base 100), then append each return year
  const cumulativeChartData = (() => {
    if (!summary) return []
    const startYear = (summary.years[0] ?? 2012) - 1   // FY11
    const rows: { year: number; Portfolio: number; 'Nifty 50': number }[] = [
      { year: startYear, Portfolio: 100, 'Nifty 50': 100 },
    ]
    summary.years.forEach((y, i) => {
      rows.push({
        year: y,
        Portfolio: Math.round((summary.cumulative_portfolio[i] ?? 100) * 100) / 100,
        'Nifty 50': Math.round((summary.cumulative_benchmark[i] ?? 100) * 100) / 100,
      })
    })
    return rows
  })()

  const drawdownChartData = summary?.metrics.drawdown_series?.map((d, i) => ({
    year: summary.years[i],
    Drawdown: d,
  })) ?? []

  // Sorted annual table
  const sortedRows = [...annualRows].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />
  }

  const m = summary?.metrics

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* ── Section 1: Header & Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Portfolio Backtest</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Top-{topN} Equal Weighted Factor Strategy&nbsp;·&nbsp;FY2012–FY2025
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Top N</span>
            <select
              value={draftTopN}
              onChange={e => setDraftTopN(Number(e.target.value))}
              className="text-sm font-semibold bg-transparent focus:outline-none cursor-pointer"
            >
              {[5, 10, 15, 20, 25, 30].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRun}
            disabled={running || loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {running
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Play className="w-3.5 h-3.5" />}
            {running ? 'Running…' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {/* ── Section 2: Annual Return Bar Chart + Cumulative ── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[280px] w-full rounded-2xl" />
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        </div>
      ) : !summary?.has_data ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm font-medium">No backtest data found</p>
          <p className="text-xs mt-1">Click "Run Backtest" to compute results</p>
        </div>
      ) : (
        <>
            {/* Annual Returns: Grouped Bars */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold">Annual Returns</h2>
                  <p className="text-xs text-muted-foreground">Portfolio vs Nifty 50</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Portfolio</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Nifty 50</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={annualChartData} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={y => `FY${String(y).slice(-2)}`}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}%`}
                    width={42}
                  />
                  <Tooltip content={<AnnualTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <Bar
                    dataKey="Portfolio"
                    fill="hsl(var(--primary))"
                    radius={[3, 3, 0, 0]}
                    opacity={0.85}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="Nifty 50"
                    fill="#f59e0b"
                    radius={[3, 3, 0, 0]}
                    opacity={0.8}
                    maxBarSize={22}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          {/* Cumulative Growth of ₹1 Lakh */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold">Cumulative Growth of ₹1 Lakh</h2>
                <p className="text-xs text-muted-foreground">Equal-weighted, annually rebalanced</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-primary inline-block" /> Portfolio
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-500 inline-block" /> Nifty 50
                </span>
              </div>
            </div>
            {/* Final values */}
            {cumulativeChartData.length > 0 && (() => {
              const last = cumulativeChartData[cumulativeChartData.length - 1]
              return (
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                    <span className="text-muted-foreground">Portfolio:</span>
                    <span className="font-bold text-primary">₹{(last.Portfolio / 100).toFixed(2)}L</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span className="text-muted-foreground">Nifty 50:</span>
                    <span className="font-bold text-amber-600">₹{(last['Nifty 50'] / 100).toFixed(2)}L</span>
                  </div>
                </div>
              )
            })()}
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativeChartData} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="gradPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBench" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.10} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={y => `FY${String(y).slice(-2)}`}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `₹${(v / 100).toFixed(1)}L`}
                  width={62}
                />
                <Tooltip content={<CumulativeTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Portfolio"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#gradPortfolio)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="Nifty 50"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#gradBench)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Section 3: Performance Metrics Cards ── */}
      {m && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <MetricCard
            label="CAGR"
            value={`${m.cagr >= 0 ? '+' : ''}${fmt(m.cagr)}%`}
            sub={`vs ${fmt(m.benchmark_cagr)}% Nifty`}
            color="emerald"
            positive={m.cagr > m.benchmark_cagr}
            tooltip="Compound Annual Growth Rate over the full backtest period"
          />
          <MetricCard
            label="Sharpe"
            value={fmt(m.sharpe, 2)}
            sub="risk-adjusted return"
            color="blue"
            positive={m.sharpe > 0.5}
            tooltip="(CAGR − risk-free rate) / volatility. >1 is excellent"
          />
          <MetricCard
            label="Volatility"
            value={`${fmt(m.volatility)}%`}
            sub="annualized std dev"
            color="amber"
            tooltip="Standard deviation of annual returns"
          />
          <MetricCard
            label="Max DD"
            value={`${fmt(m.max_drawdown)}%`}
            sub="worst peak-to-trough"
            color="red"
            positive={m.max_drawdown > -20}
            tooltip="Maximum peak-to-trough drawdown on cumulative returns"
          />
          <MetricCard
            label="Alpha"
            value={`${m.alpha >= 0 ? '+' : ''}${fmt(m.alpha)}%`}
            sub="vs Nifty 50 CAGR"
            color="purple"
            positive={m.alpha > 0}
            tooltip="Portfolio CAGR minus Nifty 50 CAGR"
          />
          <MetricCard
            label="Win Rate"
            value={`${fmt(m.win_rate)}%`}
            sub={`${annualRows.filter(r => r.outperformed).length}/${m.years_count} years`}
            color="indigo"
            positive={m.win_rate >= 50}
            tooltip="% of years the portfolio beat the Nifty 50"
          />
        </div>
      )}

      {/* Loading skeleton for metrics */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Section 4: Annual Returns Table ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Annual Returns Table</h2>
            <p className="text-xs text-muted-foreground">Click a row to see holdings</p>
          </div>
          {!loading && annualRows.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Outperformed</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Underperformed</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-4 flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm">No data yet. Run the backtest first.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/20 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      <button onClick={() => handleSort('return_year')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Year <SortIcon col="return_year" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      <button onClick={() => handleSort('portfolio_return')} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                        Portfolio <SortIcon col="portfolio_return" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      <button onClick={() => handleSort('benchmark_return')} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                        Nifty 50 <SortIcon col="benchmark_return" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      <button onClick={() => handleSort('alpha')} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                        Alpha <SortIcon col="alpha" />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 w-8" />
                  </tr>
                </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedRows.map(row => (
                      <Fragment key={row.return_year}>
                        <tr
                          className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                            row.outperformed ? 'border-l-2 border-l-emerald-400' : 'border-l-2 border-l-red-400'
                          }`}
                          onClick={() => setExpandedYear(expandedYear === row.return_year ? null : row.return_year)}
                        >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-sm">FY{String(row.return_year).slice(-2)}</div>
                          <div className="text-xs text-muted-foreground">Selected FY{String(row.selection_year).slice(-2)} · {row.num_stocks} stocks</div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ReturnBadge value={row.portfolio_return} size="md" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ReturnBadge value={row.benchmark_return} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-bold text-sm ${row.alpha >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {row.alpha >= 0 ? '+' : ''}{fmt(row.alpha)}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            row.outperformed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {row.outperformed ? 'Beat Nifty' : 'Lagged'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {expandedYear === row.return_year
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </td>
                      </tr>
                        {expandedYear === row.return_year && row.holdings.length > 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 bg-muted/10">
                              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                Top Holdings — Selected FY{String(row.selection_year).slice(-2)}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {row.holdings.map(h => (
                                  <span key={h.ticker} className="inline-flex items-center gap-1 bg-white border border-border rounded-lg px-2 py-1 text-xs">
                                    <span className="font-bold">{h.ticker}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className={h.return >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                      {h.return >= 0 ? '+' : ''}{fmt(h.return)}%
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="flex flex-col divide-y divide-border/50 md:hidden">
              {sortedRows.map(row => (
                <div key={row.return_year}>
                  <button
                    className={`w-full text-left px-4 py-3.5 transition-colors active:bg-muted/30 ${
                      row.outperformed ? 'border-l-2 border-l-emerald-400' : 'border-l-2 border-l-red-400'
                    }`}
                    onClick={() => setExpandedYear(expandedYear === row.return_year ? null : row.return_year)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-sm">FY{String(row.return_year).slice(-2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {row.num_stocks} stocks
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.outperformed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {row.outperformed ? '↑ Beat' : '↓ Lagged'}
                        </span>
                        {expandedYear === row.return_year
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Portfolio</span>
                        <ReturnBadge value={row.portfolio_return} size="md" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Nifty 50</span>
                        <ReturnBadge value={row.benchmark_return} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Alpha</span>
                        <span className={`text-sm font-bold ${row.alpha >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.alpha >= 0 ? '+' : ''}{fmt(row.alpha)}%
                        </span>
                      </div>
                    </div>
                  </button>
                  {expandedYear === row.return_year && row.holdings.length > 0 && (
                    <div className="px-4 py-3 bg-muted/10">
                      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Holdings — FY{String(row.selection_year).slice(-2)}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {row.holdings.map(h => (
                          <span key={h.ticker} className="inline-flex items-center gap-1 bg-white border border-border rounded-lg px-2 py-1 text-xs">
                            <span className="font-bold">{h.ticker}</span>
                            <span className={h.return >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {h.return >= 0 ? '+' : ''}{fmt(h.return)}%
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Section 5: Drawdown Chart ── */}
      {!loading && drawdownChartData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Portfolio Drawdown</h2>
            <p className="text-xs text-muted-foreground">Peak-to-trough decline in cumulative value</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={drawdownChartData} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradDD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={y => `FY${String(y).slice(-2)}`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
                width={42}
              />
              <Tooltip
                formatter={(v: number) => [`${fmt(v)}%`, 'Drawdown']}
                labelFormatter={y => `FY${String(y).slice(-2)}`}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid hsl(var(--border))' }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area
                type="monotone"
                dataKey="Drawdown"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#gradDD)"
                dot={false}
                activeDot={{ r: 4, fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Footer note ── */}
      <p className="text-[10px] text-muted-foreground text-center pb-2">
        Returns are equal-weighted annual returns of top-{topN} stocks ranked by composite factor score.
        Nifty 50 returns are calendar-year total returns. Past performance is not indicative of future results.
      </p>
    </div>
  )
}

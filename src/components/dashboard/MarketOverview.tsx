'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown, ArrowUpDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ScoreBadge } from './ScoreBadge'
import { formatMarketCap } from '@/lib/score-utils'

interface Company {
  id: string; ticker: string; name: string; sector: string; market_cap: number; market_cap_bucket: string
}
interface StockRow { company: Company; factorScores: Record<string, number>; finalScore: number }

const FACTOR_NAMES = ['Growth', 'Quality', 'Valuation', 'Momentum']
const SECTORS = ['Technology', 'Financials', 'Energy', 'Consumer Staples', 'Consumer Discretionary', 'Healthcare', 'Industrials', 'Materials', 'Utilities', 'Communication']
const CAP_BUCKETS = ['Large Cap', 'Mid Cap', 'Small Cap']

const SECTOR_COLORS: Record<string, string> = {
  Technology: 'bg-blue-100 text-blue-700',
  Financials: 'bg-emerald-100 text-emerald-700',
  Energy: 'bg-orange-100 text-orange-700',
  'Consumer Staples': 'bg-green-100 text-green-700',
  'Consumer Discretionary': 'bg-pink-100 text-pink-700',
  Healthcare: 'bg-red-100 text-red-700',
  Industrials: 'bg-slate-100 text-slate-700',
  Materials: 'bg-yellow-100 text-yellow-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  Communication: 'bg-purple-100 text-purple-700',
}

interface Props {
  year: number
  onYearChange: (y: number) => void
  availableYears: number[]
}

type SortKey = 'final_score' | string

export function MarketOverview({ year, onYearChange, availableYears }: Props) {
  const router = useRouter()
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [capBucket, setCapBucket] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('final_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 25

  const fetchStocks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        year: String(year),
        search,
        sector,
        market_cap_bucket: capBucket,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: String(page),
        page_size: String(pageSize),
      })
      const res = await fetch(`/api/stocks?${params}`)
      const data = await res.json()
      setStocks(data.stocks || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [year, search, sector, capBucket, sortBy, sortOrder, page])

  useEffect(() => { fetchStocks() }, [fetchStocks])
  useEffect(() => { setPage(1) }, [year, search, sector, capBucket, sortBy, sortOrder])

  function handleSort(key: SortKey) {
    if (sortBy === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortOrder('desc') }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />
  }

  const totalPages = Math.ceil(total / pageSize)
  const activeFilters = [sector, capBucket].filter(Boolean).length

  return (
    <div className="flex flex-col gap-3">
      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ticker or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-xl border font-medium transition-colors ${
            showFilters || activeFilters > 0
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border bg-background hover:bg-muted'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-primary-foreground text-primary font-bold">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/30 rounded-xl border border-border">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Sector</label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Sectors</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Market Cap</label>
            <select
              value={capBucket}
              onChange={e => setCapBucket(e.target.value)}
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Caps</option>
              {CAP_BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => { setSector(''); setCapBucket('') }}
              className="self-end flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Sort pills — mobile only */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none md:hidden pb-0.5">
        {(['final_score', ...FACTOR_NAMES] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0 ${
              sortBy === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            {key === 'final_score' ? 'Score' : key}
            {sortBy === key && (
              sortOrder === 'asc'
                ? <ChevronUp className="w-3 h-3" />
                : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading ? 'Loading…' : (
            <>
              <span className="font-semibold text-foreground">{total}</span> companies
              {(search || sector || capBucket) && ' (filtered)'}
            </>
          )}
        </span>
        {totalPages > 1 && (
          <span>Page {page} / {totalPages}</span>
        )}
      </div>

      {/* ── MOBILE: card list ── */}
      <div className="flex flex-col gap-2 md:hidden">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 animate-pulse">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="h-4 bg-muted rounded w-20 mb-1.5" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
                <div className="h-7 bg-muted rounded-full w-12" />
              </div>
              <div className="flex gap-1.5 mt-2">
                {FACTOR_NAMES.map(f => <div key={f} className="h-5 bg-muted rounded-full flex-1" />)}
              </div>
            </div>
          ))
        ) : stocks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm font-medium">No stocks found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          stocks.map(({ company, factorScores, finalScore }, idx) => (
            <button
              key={company.id}
              className="w-full text-left rounded-xl border border-border bg-card p-3 active:bg-muted/40 transition-colors"
              onClick={() => router.push(`/stocks/${company.ticker}?year=${year}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-muted-foreground/50 tabular-nums w-5 shrink-0">
                      {(page - 1) * pageSize + idx + 1}
                    </span>
                    <span className="font-bold text-sm">{company.ticker}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SECTOR_COLORS[company.sector] || 'bg-muted text-muted-foreground'}`}>
                      {company.sector}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate ml-6 max-w-[200px]">{company.name}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <ScoreBadge score={finalScore} size="md" />
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
              </div>
              {/* Factor score row */}
              <div className="flex gap-1.5 mt-2.5 ml-6">
                {FACTOR_NAMES.map(f => (
                  <div key={f} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground font-medium">{f.slice(0, 3)}</span>
                    {factorScores[f] !== undefined
                      ? <ScoreBadge score={factorScores[f]} size="sm" />
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </div>
                ))}
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── DESKTOP: table ── */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap sticky left-0 bg-muted/20 min-w-[140px]">
                Stock
              </th>
              <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap hidden md:table-cell">
                Sector
              </th>
              <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">
                Mkt Cap
              </th>
              {FACTOR_NAMES.map(f => (
                <th key={f} className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  <button
                    onClick={() => handleSort(f)}
                    className={`flex items-center gap-1 mx-auto hover:text-foreground transition-colors ${sortBy === f ? 'text-foreground' : ''}`}
                  >
                    {f} <SortIcon col={f} />
                  </button>
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                <button
                  onClick={() => handleSort('final_score')}
                  className={`flex items-center gap-1 mx-auto hover:text-foreground transition-colors ${sortBy === 'final_score' ? 'text-foreground' : ''}`}
                >
                  Score <SortIcon col="final_score" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5 sticky left-0 bg-card">
                    <div className="h-4 bg-muted rounded animate-pulse w-16 mb-1.5" />
                    <div className="h-3 bg-muted rounded animate-pulse w-28" />
                  </td>
                  <td className="px-4 py-3.5"><div className="h-5 bg-muted rounded-full animate-pulse w-24" /></td>
                  <td className="px-4 py-3.5 hidden lg:table-cell"><div className="h-3 bg-muted rounded animate-pulse w-16" /></td>
                  {FACTOR_NAMES.map(f => (
                    <td key={f} className="px-3 py-3.5">
                      <div className="h-5 bg-muted rounded-full animate-pulse w-10 mx-auto" />
                    </td>
                  ))}
                  <td className="px-4 py-3.5"><div className="h-6 bg-muted rounded-full animate-pulse w-12 mx-auto" /></td>
                </tr>
              ))
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-muted-foreground">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-medium">No stocks found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : (
              stocks.map(({ company, factorScores, finalScore }, idx) => (
                <tr
                  key={company.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/stocks/${company.ticker}?year=${year}`)}
                >
                  <td className="px-4 py-3.5 sticky left-0 bg-card group-hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs text-muted-foreground/50 w-5 shrink-0 hidden lg:block">
                        {(page - 1) * pageSize + idx + 1}
                      </span>
                      <span className="font-bold text-sm text-foreground">{company.ticker}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[160px]">{company.name}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${SECTOR_COLORS[company.sector] || 'bg-muted text-muted-foreground'}`}>
                      {company.sector}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="text-sm font-medium">{formatMarketCap(company.market_cap)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{company.market_cap_bucket}</div>
                  </td>
                  {FACTOR_NAMES.map(f => (
                    <td key={f} className="px-3 py-3.5 text-center">
                      {factorScores[f] !== undefined ? (
                        <ScoreBadge score={factorScores[f]} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-center">
                    <ScoreBadge score={finalScore} size="md" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors font-medium"
          >
            «
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors font-medium"
          >
            Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors font-medium"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors font-medium"
          >
            »
          </button>
        </div>
      )}
    </div>
  )
}

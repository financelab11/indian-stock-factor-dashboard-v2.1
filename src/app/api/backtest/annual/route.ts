/**
 * GET /api/backtest/annual?top_n=20
 * Returns year-by-year table with portfolio return, benchmark return, alpha, selected stocks
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const topN = Math.min(50, Math.max(5, parseInt(searchParams.get('top_n') ?? '20')))

    const supabase = createServiceClient()

    // Fetch portfolio backtest
    const { data: backtestRows, error } = await supabase
      .from('portfolio_backtest')
      .select('selection_year, return_year, portfolio_return, num_stocks')
      .eq('num_stocks', topN)
      .order('return_year')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch benchmark returns
    const { data: benchRows } = await supabase
      .from('benchmark_returns')
      .select('year, annual_return')
      .eq('benchmark_name', 'NIFTY50')
      .order('year')

    const benchMap: Record<number, number> = {}
    benchRows?.forEach((b: { year: number; annual_return: number }) => {
      benchMap[b.year] = b.annual_return
    })

    // Fetch top holdings for each selection year
    const rows = await Promise.all(
      (backtestRows ?? []).map(async (bt: { selection_year: number; return_year: number; portfolio_return: number; num_stocks: number }) => {
        const niftyReturn = benchMap[bt.return_year] ?? 0
        const alpha = (bt.portfolio_return ?? 0) - niftyReturn

        // Fetch top holdings
        const { data: selections } = await supabase
          .from('portfolio_selection')
          .select('company_id, score, next_year_return, companies(ticker, name)')
          .eq('selection_year', bt.selection_year)
          .order('score', { ascending: false })
          .limit(topN)

        const holdings = (selections ?? []).map((s: {
          company_id: string
          score: number
          next_year_return: number
          companies: { ticker: string; name: string } | { ticker: string; name: string }[] | null
        }) => {
          const co = Array.isArray(s.companies) ? s.companies[0] : s.companies
          return {
            ticker: co?.ticker ?? '',
            name: co?.name ?? '',
            score: Math.round((s.score ?? 0) * 10) / 10,
            return: Math.round((s.next_year_return ?? 0) * 10) / 10,
          }
        })

        return {
          selection_year: bt.selection_year,
          return_year: bt.return_year,
          portfolio_return: Math.round((bt.portfolio_return ?? 0) * 100) / 100,
          benchmark_return: Math.round(niftyReturn * 100) / 100,
          alpha: Math.round(alpha * 100) / 100,
          num_stocks: bt.num_stocks,
          outperformed: alpha > 0,
          holdings,
        }
      })
    )

    return NextResponse.json({ rows, top_n: topN })
  } catch (err) {
    console.error('backtest/annual error:', err)
    return NextResponse.json({ error: 'Failed', detail: String(err) }, { status: 500 })
  }
}

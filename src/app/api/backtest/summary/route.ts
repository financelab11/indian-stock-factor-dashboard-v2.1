/**
 * GET /api/backtest/summary?top_n=20
 * Returns cumulative & annual returns for portfolio + Nifty50 + computed metrics
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function computeMetrics(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate = 6.0
) {
  const n = portfolioReturns.length
  if (n === 0) return {}

  // CAGR
  const cumulativeMultiple = portfolioReturns.reduce((acc, r) => acc * (1 + r / 100), 1)
  const cagr = (Math.pow(cumulativeMultiple, 1 / n) - 1) * 100

  // Benchmark CAGR
  const benchCumulative = benchmarkReturns.reduce((acc, r) => acc * (1 + r / 100), 1)
  const benchCagr = (Math.pow(benchCumulative, 1 / n) - 1) * 100

  // Annualized volatility (std dev of annual returns)
  const mean = portfolioReturns.reduce((a, b) => a + b, 0) / n
  const variance = portfolioReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / Math.max(n - 1, 1)
  const volatility = Math.sqrt(variance)

  // Sharpe ratio
  const sharpe = volatility > 0 ? (cagr - riskFreeRate) / volatility : 0

  // Max drawdown (on cumulative returns)
  let peak = 1
  let maxDD = 0
  let cumVal = 1
  const drawdownSeries: number[] = []
  for (const r of portfolioReturns) {
    cumVal *= (1 + r / 100)
    if (cumVal > peak) peak = cumVal
    const dd = ((cumVal - peak) / peak) * 100
    drawdownSeries.push(dd)
    if (dd < maxDD) maxDD = dd
  }

  // Alpha = portfolio CAGR - benchmark CAGR
  const alpha = cagr - benchCagr

  // Win rate = % of years portfolio beats benchmark
  const winYears = portfolioReturns.filter((r, i) => r > (benchmarkReturns[i] ?? 0)).length
  const winRate = (winYears / n) * 100

  // Information ratio
  const excessReturns = portfolioReturns.map((r, i) => r - (benchmarkReturns[i] ?? 0))
  const excessMean = excessReturns.reduce((a, b) => a + b, 0) / n
  const excessStd = Math.sqrt(
    excessReturns.reduce((acc, r) => acc + Math.pow(r - excessMean, 2), 0) / Math.max(n - 1, 1)
  )
  const informationRatio = excessStd > 0 ? excessMean / excessStd : 0

  return {
    cagr: Math.round(cagr * 100) / 100,
    benchmark_cagr: Math.round(benchCagr * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    sharpe: Math.round(sharpe * 100) / 100,
    max_drawdown: Math.round(maxDD * 100) / 100,
    alpha: Math.round(alpha * 100) / 100,
    win_rate: Math.round(winRate * 100) / 100,
    information_ratio: Math.round(informationRatio * 100) / 100,
    years_count: n,
    drawdown_series: drawdownSeries.map(d => Math.round(d * 100) / 100),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const topN = Math.min(50, Math.max(5, parseInt(searchParams.get('top_n') ?? '20')))

    const supabase = createServiceClient()

    // Fetch portfolio backtest results
    const { data: backtestRows, error: btErr } = await supabase
      .from('portfolio_backtest')
      .select('selection_year, return_year, portfolio_return, num_stocks')
      .eq('num_stocks', topN)
      .order('return_year')

    if (btErr) return NextResponse.json({ error: btErr.message }, { status: 500 })

    // Fetch Nifty50 benchmark returns
    const { data: benchRows, error: benchErr } = await supabase
      .from('benchmark_returns')
      .select('year, annual_return, cumulative_return')
      .eq('benchmark_name', 'NIFTY50')
      .order('year')

    if (benchErr) return NextResponse.json({ error: benchErr.message }, { status: 500 })

    // If no backtest data, return empty
    if (!backtestRows?.length) {
      return NextResponse.json({
        years: [],
        portfolio_returns: [],
        benchmark_returns: [],
        cumulative_portfolio: [],
        cumulative_benchmark: [],
        metrics: {},
        has_data: false,
      })
    }

    const benchMap: Record<number, { annual: number; cumulative: number }> = {}
    benchRows?.forEach((b: { year: number; annual_return: number; cumulative_return: number }) => {
      benchMap[b.year] = { annual: b.annual_return, cumulative: b.cumulative_return }
    })

    const years: number[] = []
    const portfolioReturns: number[] = []
    const benchmarkReturns: number[] = []

    for (const row of backtestRows) {
      const ry = row.return_year
      years.push(ry)
      portfolioReturns.push(row.portfolio_return ?? 0)
      benchmarkReturns.push(benchMap[ry]?.annual ?? 0)
    }

    // Cumulative growth of ₹100
    const cumulativePortfolio: number[] = []
    const cumulativeBenchmark: number[] = []
    let pVal = 100
    let bVal = 100
    for (let i = 0; i < years.length; i++) {
      pVal *= (1 + portfolioReturns[i] / 100)
      bVal *= (1 + benchmarkReturns[i] / 100)
      cumulativePortfolio.push(Math.round(pVal * 100) / 100)
      cumulativeBenchmark.push(Math.round(bVal * 100) / 100)
    }

    const metrics = computeMetrics(portfolioReturns, benchmarkReturns)

    return NextResponse.json({
      years,
      portfolio_returns: portfolioReturns,
      benchmark_returns: benchmarkReturns,
      cumulative_portfolio: cumulativePortfolio,
      cumulative_benchmark: cumulativeBenchmark,
      metrics,
      has_data: true,
      top_n: topN,
    })
  } catch (err) {
    console.error('backtest/summary error:', err)
    return NextResponse.json({ error: 'Failed', detail: String(err) }, { status: 500 })
  }
}

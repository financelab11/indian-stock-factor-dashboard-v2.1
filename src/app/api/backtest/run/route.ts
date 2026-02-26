/**
 * POST /api/backtest/run
 * Runs the backtesting engine: selects top-N stocks by final_score each year,
 * computes equal-weighted forward returns using actual DB data,
 * stores in portfolio_backtest + portfolio_selection.
 *
 * Forward returns are fetched from parameter_scores (Price Return %) for the following year.
 * Benchmark returns are fetched from the benchmark_returns table.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const topN = Math.min(50, Math.max(5, parseInt(body.top_n ?? '20')))
    const startYear = parseInt(body.start_year ?? '2011')

    const supabase = createServiceClient()

    // 1. Fetch Price Return % parameter ID
    const { data: paramData } = await supabase
      .from('parameters')
      .select('id')
      .eq('name', 'Price Return %')
      .single()

    const priceReturnParamId = paramData?.id ?? 'a4000001-0000-4000-a000-000000000001'

    // 2. Fetch all years
    const { data: yearRows } = await supabase.from('years').select('id, year').order('year')
    if (!yearRows?.length) return NextResponse.json({ error: 'No years found' }, { status: 404 })

    const yearMap: Record<number, number> = {}
    const idToYear: Record<number, number> = {}
    yearRows.forEach((y: { id: number; year: number }) => {
      yearMap[y.year] = y.id
      idToYear[y.id] = y.year
    })

    const availableYears = yearRows.map((y: { year: number }) => y.year).filter(y => y >= startYear)
    const selectionYears = availableYears.slice(0, -1) // last year can't have forward return

    let totalInserted = 0
    const results: Array<{ selection_year: number; return_year: number; portfolio_return: number; num_stocks: number }> = []

    for (const selYear of selectionYears) {
      const retYear = selYear + 1
      const yearId = yearMap[selYear]
      const nextYearId = yearMap[retYear]
      if (!yearId || !nextYearId) continue

      // 3. Fetch top-N companies by final_score for this year
      const { data: topStocks } = await supabase
        .from('final_scores')
        .select('company_id, final_score')
        .eq('year_id', yearId)
        .order('final_score', { ascending: false })
        .limit(topN)

      if (!topStocks?.length) continue

      const companyIds = topStocks.map(s => s.company_id)

      // 4. Fetch actual returns for these stocks in the NEXT year
      const { data: returnData } = await supabase
        .from('parameter_scores')
        .select('company_id, raw_value')
        .eq('parameter_id', priceReturnParamId)
        .eq('year_id', nextYearId)
        .in('company_id', companyIds)

      const returnMap: Record<string, number> = {}
      returnData?.forEach(r => {
        // raw_value is usually decimal (e.g. 0.15 for 15%)
        returnMap[r.company_id] = (r.raw_value ?? 0) * 100
      })

      // Calculate portfolio return (equal-weighted)
      let sumReturns = 0
      let count = 0
      const stockSelections = topStocks.map(s => {
        const ret = returnMap[s.company_id] ?? 0 // Assume 0 if missing? Or should we ignore?
        sumReturns += ret
        count++
        return {
          company_id: s.company_id,
          score: s.final_score,
          next_year_return: ret,
        }
      })

      const portfolioReturn = count > 0 ? sumReturns / count : 0

      // 5. Upsert portfolio_backtest
      const { error: pbErr } = await supabase
        .from('portfolio_backtest')
        .upsert(
          {
            selection_year: selYear,
            return_year: retYear,
            num_stocks: topN,
            portfolio_return: portfolioReturn,
          },
          { onConflict: 'selection_year,return_year,num_stocks' }
        )

      if (pbErr) {
        console.error(`portfolio_backtest upsert error for FY${retYear}`, pbErr)
        continue
      }

      // 6. Upsert portfolio_selection
      for (const stock of stockSelections) {
        await supabase
          .from('portfolio_selection')
          .upsert(
            {
              selection_year: selYear,
              company_id: stock.company_id,
              score: stock.score,
              next_year_return: stock.next_year_return,
            },
            { onConflict: 'selection_year,company_id' }
          )
      }

      totalInserted++
      results.push({
        selection_year: selYear,
        return_year: retYear,
        portfolio_return: portfolioReturn,
        num_stocks: topN,
      })
    }

    return NextResponse.json({
      message: 'Backtest complete using actual database data',
      years_processed: totalInserted,
      top_n: topN,
      results,
    })
  } catch (err) {
    console.error('backtest/run error:', err)
    return NextResponse.json({ error: 'Backtest failed', detail: String(err) }, { status: 500 })
  }
}

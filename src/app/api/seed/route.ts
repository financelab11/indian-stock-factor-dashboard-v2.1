/**
 * POST /api/seed  — multipart/form-data with field "file"
 *
 * Excel structure (actual format discovered):
 *   Each sheet = one metric (e.g. "Score%", "Rev1yr%", "ROCE%", etc.)
 *   Each row   = one company (wide format)
 *   Columns:
 *     Identifier         → ticker
 *     Identifier_1       → exchange:ticker (fallback)
 *     Company Name       → name
 *     TRBC Economic Sector Name → sector
 *     TRBC Industry Name → industry
 *     Company Market Capitalization\n(INR) → market_cap
 *     FY11 … FY25        → value for that fiscal year
 *     aFY11 … aFY25      → alternate/adjusted value (may be used as raw score)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

// Map sheet names (case-insensitive) to our internal metric keys
const SHEET_TO_METRIC: Record<string, string> = {
  'score%':        'final_score',
  'score':         'final_score',
  'rev1yr%':       'rev1yr',
  'rev1yr':        'rev1yr',
  'rev3yr%':       'rev3yr',
  'rev3yr':        'rev3yr',
  'ebitda3y%':     'ebitda3y',
  'ebitda3y':      'ebitda3y',
  'eps1yr%':       'eps1yr',
  'eps1yr':        'eps1yr',
  'eps3yr%':       'eps3yr',
  'eps3yr':        'eps3yr',
  'roce%':         'roce',
  'roce':          'roce',
  'roe%':          'roe',
  'roe':           'roe',
  'ebit%':         'ebit_margin',
  'ebit margin%':  'ebit_margin',
  'ebit_margin':   'ebit_margin',
  'd/e':           'de',
  'de':            'de',
  'ccc':           'ccc',
  'p/e':           'pe',
  'pe':            'pe',
  'ev/ebitda':     'evebitda',
  'evebitda':      'evebitda',
  'p/fcf':         'pfcfs',
  'pfcfs':         'pfcfs',
  'p/ocf':         'pocfs',
  'pocfs':         'pocfs',
  'peg':           'peg',
  'price%':        'price_return',
  'price return%': 'price_return',
  'price_return':  'price_return',
  // growth / quality / valuation / momentum composite sheets
  'growth':        'growth_score',
  'quality':       'quality_score',
  'valuation':     'valuation_score',
  'momentum':      'momentum_score',
}

const LOWER_IS_BETTER = new Set(['de', 'ccc', 'pe', 'evebitda', 'pfcfs', 'pocfs', 'peg'])

const PARAM_IDS: Record<string, string> = {
  rev1yr:       'a1000001-0000-4000-a000-000000000001',
  rev3yr:       'a1000001-0000-4000-a000-000000000002',
  ebitda3y:     'a1000001-0000-4000-a000-000000000003',
  eps1yr:       'a1000001-0000-4000-a000-000000000004',
  eps3yr:       'a1000001-0000-4000-a000-000000000005',
  roce:         'a2000001-0000-4000-a000-000000000001',
  roe:          'a2000001-0000-4000-a000-000000000002',
  ebit_margin:  'a2000001-0000-4000-a000-000000000003',
  de:           'a2000001-0000-4000-a000-000000000004',
  ccc:          'a2000001-0000-4000-a000-000000000005',
  pe:           'a3000001-0000-4000-a000-000000000001',
  evebitda:     'a3000001-0000-4000-a000-000000000002',
  pfcfs:        'a3000001-0000-4000-a000-000000000003',
  pocfs:        'a3000001-0000-4000-a000-000000000004',
  peg:          'a3000001-0000-4000-a000-000000000005',
  price_return: 'a4000001-0000-4000-a000-000000000001',
}

const METRIC_TO_FACTOR: Record<string, string> = {
  rev1yr: 'Growth', rev3yr: 'Growth', ebitda3y: 'Growth', eps1yr: 'Growth', eps3yr: 'Growth',
  roce: 'Quality', roe: 'Quality', ebit_margin: 'Quality', de: 'Quality', ccc: 'Quality',
  pe: 'Valuation', evebitda: 'Valuation', pfcfs: 'Valuation', pocfs: 'Valuation', peg: 'Valuation',
  price_return: 'Momentum',
}

const FACTOR_WEIGHTS: Record<string, number> = { Growth: 0.3, Quality: 0.3, Valuation: 0.3, Momentum: 0.1 }

const FACTOR_IDS: Record<string, string> = {
  Growth:    'f1000000-0000-0000-0000-000000000003',
  Quality:   'f1000000-0000-0000-0000-000000000001',
  Valuation: 'f1000000-0000-0000-0000-000000000002',
  Momentum:  'f1000000-0000-0000-0000-000000000004',
}

// Factor composite sheet metric keys
const FACTOR_SHEET_MAP: Record<string, string> = {
  growth_score:    'Growth',
  quality_score:   'Quality',
  valuation_score: 'Valuation',
  momentum_score:  'Momentum',
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function minMaxNorm(values: (number | null)[], lowerIsBetter: boolean): (number | null)[] {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length < 2) return values.map(v => (v === null ? null : 50))
  const minVal = Math.min(...valid)
  const maxVal = Math.max(...valid)
  const range = maxVal - minVal
  if (range === 0) return values.map(v => (v === null ? null : 50))
  return values.map(v => {
    if (v === null) return null
    const raw = (v - minVal) / range
    return Math.round((lowerIsBetter ? 1 - raw : raw) * 100)
  })
}

function deriveBucket(marketCap: number): string {
  if (marketCap >= 200_000_000_000) return 'Large Cap'
  if (marketCap >= 50_000_000_000) return 'Mid Cap'
  return 'Small Cap'
}

/** Find the ticker from a row using known column names */
function getTicker(row: Record<string, unknown>): string {
  const keys = Object.keys(row)
  // Try "Identifier" first (usually the plain ticker like "TCS")
  const identKey = keys.find(k => k.trim().toLowerCase() === 'identifier')
  if (identKey) {
    const val = String(row[identKey] || '').trim()
    if (val) return val.toUpperCase()
  }
  // Fallback: Identifier_1 often looks like "NSE:TCS" — extract part after colon
  const ident1Key = keys.find(k => k.trim().toLowerCase() === 'identifier_1')
  if (ident1Key) {
    const val = String(row[ident1Key] || '').trim()
    if (val) return val.replace(/^.*:/, '').toUpperCase()
  }
  return ''
}

function getStr(row: Record<string, unknown>, ...candidates: string[]): string {
  const keys = Object.keys(row)
  for (const c of candidates) {
    const k = keys.find(k2 => k2.trim().toLowerCase() === c.toLowerCase())
    if (k && row[k]) return String(row[k]).trim()
  }
  return ''
}

/** Extract FY year columns: returns map of year→value */
function extractFYValues(row: Record<string, unknown>): Record<number, number | null> {
  const result: Record<number, number | null> = {}
  for (const [k, v] of Object.entries(row)) {
    // Match FY11, FY12, ... FY25 (not aFY)
    const m = k.trim().match(/^FY(\d{2})$/i)
    if (m) {
      let yr = parseInt(m[1])
      if (yr < 100) yr += 2000
      result[yr] = numOrNull(v)
    }
  }
  return result
}

type SheetData = {
  metric: string
  // ticker → (year → value)
  companies: Map<string, {
    name: string
    sector: string
    industry: string
    market_cap: number
    fyValues: Record<number, number | null>
  }>
}

function parseSheet(sheetName: string, rows: Record<string, unknown>[]): SheetData | null {
  const metricKey = SHEET_TO_METRIC[sheetName.trim().toLowerCase()]
  if (!metricKey) return null

  const companies = new Map<string, SheetData['companies'] extends Map<string, infer V> ? V : never>()

  for (const row of rows) {
    const ticker = getTicker(row)
    if (!ticker) continue

    const name = getStr(row, 'Company Name', 'company name', 'Name', 'Company')
    const sector = getStr(row, 'TRBC Economic Sector Name', 'sector', 'Sector')
    const industry = getStr(row, 'TRBC Industry Name', 'industry', 'Industry')

    // Market cap column has a newline in its name
    const mcapKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('market cap') || k.toLowerCase().includes('market capitalization')
    )
    const market_cap = mcapKey ? (numOrNull(row[mcapKey]) ?? 0) : 0

    const fyValues = extractFYValues(row)

    companies.set(ticker, { name: name || ticker, sector: sector || 'Unknown', industry: industry || 'Unknown', market_cap, fyValues })
  }

  return { metric: metricKey, companies }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Parse all recognized sheets
    const sheetDataMap: Map<string, SheetData> = new Map()
    const skippedSheets: string[] = []

    for (const sheetName of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null }) as Record<string, unknown>[]
      if (rows.length === 0) { skippedSheets.push(sheetName + ' (empty)'); continue }

      const parsed = parseSheet(sheetName, rows)
      if (!parsed) { skippedSheets.push(sheetName + ' (unrecognized)'); continue }

      sheetDataMap.set(parsed.metric, parsed)
    }

    if (sheetDataMap.size === 0) {
      return NextResponse.json({
        error: 'No recognized sheets found',
        sheets: workbook.SheetNames,
        hint: 'Sheet names should match metric names e.g. "Score%", "Rev1yr%", "ROCE%", "Growth", etc.',
      }, { status: 400 })
    }

    // Collect all tickers and years across all sheets
    const allTickers = new Map<string, { name: string; sector: string; industry: string; market_cap: number }>()
    const allYears = new Set<number>()

    for (const sd of sheetDataMap.values()) {
      for (const [ticker, info] of sd.companies) {
        if (!allTickers.has(ticker)) {
          allTickers.set(ticker, { name: info.name, sector: info.sector, industry: info.industry, market_cap: info.market_cap })
        }
        for (const yr of Object.keys(info.fyValues).map(Number)) {
          allYears.add(yr)
        }
      }
    }

    const supabase = createServiceClient()

    // Upsert years
    const sortedYears = [...allYears].sort()
    for (const yr of sortedYears) {
      await supabase.from('years').upsert({ year: yr }, { onConflict: 'year' })
    }
    const { data: yearRows } = await supabase.from('years').select('id, year')
    const yearMap: Record<number, number> = {}
    yearRows?.forEach((y: { id: number; year: number }) => { yearMap[y.year] = y.id })

    // Upsert companies
    let insertedCompanies = 0, errorCount = 0

    const companyIdMap: Record<string, number> = {}
    for (const [ticker, info] of allTickers) {
      const mktBucket = deriveBucket(info.market_cap)
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .upsert(
          { ticker, name: info.name, sector: info.sector, industry: info.industry, market_cap: info.market_cap, market_cap_bucket: mktBucket },
          { onConflict: 'ticker' }
        )
        .select('id')
        .single()

      if (compErr || !company) { errorCount++; continue }
      companyIdMap[ticker] = company.id
      insertedCompanies++
    }

    // ---- Process parameter scores (individual metric sheets) ----
    const individualMetrics = Object.keys(PARAM_IDS)
    let paramScoresInserted = 0

    // For normalization we need all values per metric per year
    // Build: metric → year → ticker[] + values[]
    type MetricYearEntry = { ticker: string; raw: number | null }[]
    const metricYearRaw: Record<string, Record<number, MetricYearEntry>> = {}

    for (const metric of individualMetrics) {
      const sd = sheetDataMap.get(metric)
      if (!sd) continue
      metricYearRaw[metric] = {}

      for (const [ticker, info] of sd.companies) {
        for (const [yrStr, val] of Object.entries(info.fyValues)) {
          const yr = Number(yrStr)
          if (!metricYearRaw[metric][yr]) metricYearRaw[metric][yr] = []
          metricYearRaw[metric][yr].push({ ticker, raw: val })
        }
      }
    }

    // Normalize per metric per year and upsert parameter_scores
    for (const metric of individualMetrics) {
      if (!metricYearRaw[metric]) continue
      const paramId = PARAM_IDS[metric]
      const lib = LOWER_IS_BETTER.has(metric)

      for (const [yrStr, entries] of Object.entries(metricYearRaw[metric])) {
        const yr = Number(yrStr)
        const yearId = yearMap[yr]
        if (!yearId) continue

        const rawVals = entries.map(e => e.raw)
        const normVals = minMaxNorm(rawVals, lib)

        const batch = entries.map((e, i) => {
          const cid = companyIdMap[e.ticker]
          if (!cid) return null
          return {
            company_id: cid,
            parameter_id: paramId,
            year_id: yearId,
            raw_value: e.raw ?? 0,
            normalized_value: normVals[i] ?? 50,
          }
        }).filter(Boolean)

        if (batch.length > 0) {
          const { error } = await supabase
            .from('parameter_scores')
            .upsert(batch as Parameters<typeof supabase.from>[0] extends never ? never : never, { onConflict: 'company_id,parameter_id,year_id' })
          if (!error) paramScoresInserted += batch.length
        }
      }
    }

    // ---- Factor scores ----
    // If we have explicit factor composite sheets (Growth/Quality/Valuation/Momentum), use those
    // Otherwise compute from parameter scores
    let factorScoresInserted = 0
    const finalScoresMap: Record<string, Record<number, number>> = {} // ticker → year → finalScore

    for (const [metricKey, factorName] of Object.entries(FACTOR_SHEET_MAP)) {
      const sd = sheetDataMap.get(metricKey)
      if (!sd) continue

      for (const [ticker, info] of sd.companies) {
        const cid = companyIdMap[ticker]
        if (!cid) continue
        const factorId = FACTOR_IDS[factorName]
        if (!factorId) continue

        for (const [yrStr, val] of Object.entries(info.fyValues)) {
          const yr = Number(yrStr)
          const yearId = yearMap[yr]
          if (!yearId || val === null) continue

          await supabase.from('factor_scores').upsert(
            { company_id: cid, factor_id: factorId, year_id: yearId, score: Math.round(val) },
            { onConflict: 'company_id,factor_id,year_id' }
          )
          factorScoresInserted++

          // Accumulate weighted final score
          if (!finalScoresMap[ticker]) finalScoresMap[ticker] = {}
          finalScoresMap[ticker][yr] = (finalScoresMap[ticker][yr] ?? 0) + val * (FACTOR_WEIGHTS[factorName] ?? 0)
        }
      }
    }

    // If no factor composite sheets, derive factor scores from parameter scores
    if (factorScoresInserted === 0) {
      // Group metrics by factor
      const factorMetrics: Record<string, string[]> = { Growth: [], Quality: [], Valuation: [], Momentum: [] }
      for (const [metric, factor] of Object.entries(METRIC_TO_FACTOR)) {
        if (metricYearRaw[metric]) factorMetrics[factor].push(metric)
      }

      for (const [factorName, metrics] of Object.entries(factorMetrics)) {
        if (metrics.length === 0) continue
        const factorId = FACTOR_IDS[factorName]

        // Collect all tickers × years for this factor
        const tickerYearScores: Record<string, Record<number, number[]>> = {}

        for (const metric of metrics) {
          for (const [yrStr, entries] of Object.entries(metricYearRaw[metric] ?? {})) {
            const yr = Number(yrStr)
            const rawVals = entries.map(e => e.raw)
            const normVals = minMaxNorm(rawVals, LOWER_IS_BETTER.has(metric))
            entries.forEach((e, i) => {
              const n = normVals[i]
              if (n === null) return
              if (!tickerYearScores[e.ticker]) tickerYearScores[e.ticker] = {}
              if (!tickerYearScores[e.ticker][yr]) tickerYearScores[e.ticker][yr] = []
              tickerYearScores[e.ticker][yr].push(n)
            })
          }
        }

        for (const [ticker, years] of Object.entries(tickerYearScores)) {
          const cid = companyIdMap[ticker]
          if (!cid) continue
          for (const [yrStr, scores] of Object.entries(years)) {
            const yr = Number(yrStr)
            const yearId = yearMap[yr]
            if (!yearId) continue
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length
            await supabase.from('factor_scores').upsert(
              { company_id: cid, factor_id: factorId, year_id: yearId, score: Math.round(avg) },
              { onConflict: 'company_id,factor_id,year_id' }
            )
            factorScoresInserted++
            if (!finalScoresMap[ticker]) finalScoresMap[ticker] = {}
            finalScoresMap[ticker][yr] = (finalScoresMap[ticker][yr] ?? 0) + avg * (FACTOR_WEIGHTS[factorName] ?? 0)
          }
        }
      }
    }

    // ---- Final scores ----
    // If there's a "Score%" or "final_score" sheet, use it directly
    let finalScoresInserted = 0
    const finalSd = sheetDataMap.get('final_score')

    if (finalSd) {
      for (const [ticker, info] of finalSd.companies) {
        const cid = companyIdMap[ticker]
        if (!cid) continue

        // Normalize the final score sheet values (0–100)
        const yrEntries = Object.entries(info.fyValues)
        const allFinalVals = yrEntries.map(([, v]) => v)
        const normFinals = minMaxNorm(allFinalVals, false)

        for (let i = 0; i < yrEntries.length; i++) {
          const [yrStr] = yrEntries[i]
          const yr = Number(yrStr)
          const yearId = yearMap[yr]
          if (!yearId) continue

          const normScore = normFinals[i] ?? 50

          await supabase.from('final_scores').upsert(
            { company_id: cid, year_id: yearId, final_score: normScore },
            { onConflict: 'company_id,year_id' }
          )
          finalScoresInserted++
        }
      }
    } else {
      // Compute from accumulated factor scores
      for (const [ticker, years] of Object.entries(finalScoresMap)) {
        const cid = companyIdMap[ticker]
        if (!cid) continue
        for (const [yrStr, score] of Object.entries(years)) {
          const yr = Number(yrStr)
          const yearId = yearMap[yr]
          if (!yearId) continue
          await supabase.from('final_scores').upsert(
            { company_id: cid, year_id: yearId, final_score: Math.round(score) },
            { onConflict: 'company_id,year_id' }
          )
          finalScoresInserted++
        }
      }
    }

    return NextResponse.json({
      message: 'Seeded successfully',
      sheetsProcessed: [...sheetDataMap.keys()],
      skippedSheets,
      companies: insertedCompanies,
      parameterScores: paramScoresInserted,
      factorScores: factorScoresInserted,
      finalScores: finalScoresInserted,
      years: sortedYears,
      errors: errorCount,
    })
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json({ error: 'Failed to process file', detail: String(err) }, { status: 500 })
  }
}

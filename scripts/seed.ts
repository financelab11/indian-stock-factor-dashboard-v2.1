/**
 * Run: bun scripts/seed.ts <path-to-excel>
 * Or:  bun scripts/seed.ts  (looks for Factor-Model*.xlsx in project root)
 */
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const COL_ALIASES: Record<string, string[]> = {
  ticker:       ['Ticker', 'ticker', 'TICKER', 'Symbol', 'symbol'],
  name:         ['Name', 'name', 'Company', 'company', 'Company Name'],
  sector:       ['Sector', 'sector', 'SECTOR'],
  industry:     ['Industry', 'industry', 'INDUSTRY'],
  market_cap:   ['MarketCap', 'market_cap', 'Market Cap', 'Mcap', 'mcap'],
  mkt_bucket:   ['MarketCapBucket', 'market_cap_bucket', 'Cap Bucket', 'CapBucket'],
  fy:           ['FY', 'fy', 'Year', 'year', 'FY Year', 'FiscalYear'],
  rev1yr:       ['Rev1yr%', 'Rev1yr', 'rev1yr', 'Rev 1yr%'],
  rev3yr:       ['Rev3yr%', 'Rev3yr', 'rev3yr', 'Rev 3yr%'],
  ebitda3y:     ['ebitda3y%', 'ebitda3y', 'Ebitda3y%', 'EBITDA3y%'],
  eps1yr:       ['eps1yr%', 'eps1yr', 'Eps1yr%', 'EPS1yr%'],
  eps3yr:       ['eps3yr%', 'eps3yr', 'Eps3yr%', 'EPS3yr%'],
  roce:         ['roce%', 'roce', 'ROCE%', 'ROCE'],
  roe:          ['roe%', 'roe', 'ROE%', 'ROE'],
  ebit_margin:  ['ebit%', 'ebit', 'EBIT%', 'EBIT Margin%'],
  de:           ['de', 'DE', 'D/E', 'd/e', 'Debt/Equity'],
  ccc:          ['ccc', 'CCC', 'Cash Conversion Cycle'],
  pe:           ['pe', 'PE', 'P/E', 'p/e', 'PERatio'],
  evebitda:     ['evebitda', 'EVEBITDA', 'EV/EBITDA', 'ev/ebitda'],
  pfcfs:        ['pfcfs', 'PFCFS', 'P/FCF', 'p/fcf'],
  pocfs:        ['pocfs', 'POCFS', 'P/OCF', 'p/ocf'],
  peg:          ['peg', 'PEG', 'PEG Ratio'],
  price_return: ['Price%', 'price%', 'Price Return%', 'price_return', 'PriceReturn%'],
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

const METRIC_FACTOR: Record<string, string> = {
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

const ALL_METRICS = Object.keys(PARAM_IDS)

function col(row: Record<string, unknown>, key: string): unknown {
  for (const alias of COL_ALIASES[key] || [key]) {
    if (alias in row) return row[alias]
  }
  return undefined
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function minMaxNorm(values: (number | null)[], lowerIsBetter: boolean): (number | null)[] {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length < 2) return values.map(() => 50)
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

function parseFY(raw: unknown): number | null {
  if (!raw) return null
  const s = String(raw).trim().toUpperCase()
  const m = s.match(/(?:FY)?(\d{2,4})/)
  if (!m) return null
  let yr = parseInt(m[1])
  if (yr < 100) yr += 2000
  return yr
}

function deriveBucket(marketCap: number): string {
  if (marketCap >= 200_000_000_000) return 'Large Cap'
  if (marketCap >= 50_000_000_000)  return 'Mid Cap'
  return 'Small Cap'
}

async function main() {
  // Find Excel file
  let filePath = process.argv[2]
  if (!filePath) {
    const files = fs.readdirSync('.').filter(f => f.endsWith('.xlsx') && f.toLowerCase().includes('factor'))
    if (files.length === 0) { console.error('No Excel file found. Pass path as argument.'); process.exit(1) }
    filePath = files[0]
    console.log(`Auto-detected: ${filePath}`)
  }

  const buffer = fs.readFileSync(path.resolve(filePath))
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  console.log('Sheets found:', workbook.SheetNames)

  let dataRows: Record<string, unknown>[] = []
  let usedSheet = ''

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    for (let skip = 0; skip <= 12; skip++) {
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: null, range: skip }) as Record<string, unknown>[]
      if (raw.length > 0) {
        const keys = Object.keys(raw[0]).map(k => k.toLowerCase())
        if (keys.some(k => k.includes('ticker') || k.includes('symbol') || k.includes('company'))) {
          dataRows = raw
          usedSheet = sheetName
          console.log(`Using sheet "${sheetName}", skipping ${skip} header rows. Columns: ${Object.keys(raw[0]).join(', ')}`)
          break
        }
      }
    }
    if (dataRows.length > 0) break
  }

  if (dataRows.length === 0) {
    console.error('Could not detect data rows. All sheet columns:')
    for (const sn of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sn], { defval: null, range: 0 }) as Record<string, unknown>[]
      console.log(`  ${sn}:`, rows[0] ? Object.keys(rows[0]) : '(empty)')
    }
    process.exit(1)
  }

  const validRows = dataRows.filter(r => {
    const ticker = col(r, 'ticker')
    const fy = col(r, 'fy')
    return ticker && String(ticker).trim() !== '' && fy && parseFY(fy) !== null
  })

  console.log(`Valid rows: ${validRows.length} / ${dataRows.length}`)

  if (validRows.length === 0) {
    console.error('No valid rows (need Ticker + FY columns). First row keys:', Object.keys(dataRows[0] || {}))
    process.exit(1)
  }

  const byYear: Record<number, typeof validRows> = {}
  for (const r of validRows) {
    const yr = parseFY(col(r, 'fy'))!
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(r)
  }

  const uniqueYears = Object.keys(byYear).map(Number).sort()
  console.log('Years:', uniqueYears)

  // Upsert years
  for (const yr of uniqueYears) {
    await supabase.from('years').upsert({ year: yr }, { onConflict: 'year' })
  }
  const { data: yearRows } = await supabase.from('years').select('id, year')
  const yearMap: Record<number, number> = {}
  yearRows?.forEach((y: { id: number; year: number }) => { yearMap[y.year] = y.id })

  let insertedCompanies = 0, insertedScores = 0, errorCount = 0

  for (const [yrStr, rows] of Object.entries(byYear)) {
    const yr = Number(yrStr)
    const yearId = yearMap[yr]
    if (!yearId) continue
    console.log(`Processing FY${yr}: ${rows.length} companies`)

    const rawMetrics: Record<string, (number | null)[]> = {}
    for (const metric of ALL_METRICS) rawMetrics[metric] = []
    for (const r of rows) {
      for (const metric of ALL_METRICS) rawMetrics[metric].push(numOrNull(col(r, metric)))
    }

    const normMetrics: Record<string, (number | null)[]> = {}
    for (const metric of ALL_METRICS) {
      normMetrics[metric] = minMaxNorm(rawMetrics[metric], LOWER_IS_BETTER.has(metric))
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const ticker = String(col(r, 'ticker') || '').trim().toUpperCase()
      const name = String(col(r, 'name') || ticker).trim()
      const sector = String(col(r, 'sector') || 'Unknown').trim()
      const industry = String(col(r, 'industry') || 'Unknown').trim()
      const marketCap = numOrNull(col(r, 'market_cap')) ?? 0
      const mktBucket = String(col(r, 'mkt_bucket') || deriveBucket(marketCap)).trim()

      const { data: company, error: compErr } = await supabase
        .from('companies')
        .upsert({ ticker, name, sector, industry, market_cap: marketCap, market_cap_bucket: mktBucket }, { onConflict: 'ticker' })
        .select('id')
        .single()

      if (compErr || !company) { errorCount++; console.error(`Error upserting ${ticker}:`, compErr?.message); continue }
      insertedCompanies++

      const factorNormScores: Record<string, number[]> = { Growth: [], Quality: [], Valuation: [], Momentum: [] }
      const paramScoreRows = []

      for (const metric of ALL_METRICS) {
        const rawVal = rawMetrics[metric][i]
        const normVal = normMetrics[metric][i]
        if (rawVal === null && normVal === null) continue
        paramScoreRows.push({
          company_id: company.id,
          parameter_id: PARAM_IDS[metric],
          year_id: yearId,
          raw_value: rawVal ?? 0,
          normalized_value: normVal ?? 50,
        })
        const factorName = METRIC_FACTOR[metric]
        if (normVal !== null) factorNormScores[factorName].push(normVal)
      }

      if (paramScoreRows.length > 0) {
        await supabase.from('parameter_scores').upsert(paramScoreRows, { onConflict: 'company_id,parameter_id,year_id' })
      }

      const factorScoreMap: Record<string, number> = {}
      let finalScore = 0
      for (const [factorName, scores] of Object.entries(factorNormScores)) {
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        factorScoreMap[factorName] = Math.round(avg)
        finalScore += avg * (FACTOR_WEIGHTS[factorName] ?? 0)
      }

      for (const [factorName, score] of Object.entries(factorScoreMap)) {
        const factorId = FACTOR_IDS[factorName]
        if (!factorId) continue
        await supabase.from('factor_scores').upsert(
          { company_id: company.id, factor_id: factorId, year_id: yearId, score },
          { onConflict: 'company_id,factor_id,year_id' }
        )
      }

      await supabase.from('final_scores').upsert(
        { company_id: company.id, year_id: yearId, final_score: Math.round(finalScore) },
        { onConflict: 'company_id,year_id' }
      )
      insertedScores++
    }
  }

  console.log(`\nDone! Companies: ${insertedCompanies}, Scores: ${insertedScores}, Errors: ${errorCount}`)
  console.log(`Sheet used: ${usedSheet}, Years: ${uniqueYears.join(', ')}`)
}

main().catch(e => { console.error(e); process.exit(1) })

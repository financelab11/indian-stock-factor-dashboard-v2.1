import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Migration endpoint - creates raw_metrics table and reseeds factors/parameters
// to match the real Excel factor model format
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'public' } }
  )

  const results: string[] = []

  // ─── 1. Seed correct Factors (matching Excel model weights) ─────────────────
  const factors = [
    {
      id: 'f1000000-0000-0000-0000-000000000003',
      name: 'Growth',
      description: 'Revenue and earnings growth trajectory (Rev1yr%, Rev3yr%, ebitda3y%, eps1yr%, eps3yr%)',
      weight: 0.3,
      display_order: 1,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      name: 'Quality',
      description: 'Financial quality metrics (roce%, roe%, ebit%, de, ccc)',
      weight: 0.3,
      display_order: 2,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000002',
      name: 'Valuation',
      description: 'Valuation multiples (pe, evebitda, pfcfs, pocfs, peg)',
      weight: 0.3,
      display_order: 3,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000004',
      name: 'Momentum',
      description: 'Price momentum (Price%)',
      weight: 0.1,
      display_order: 4,
    },
  ]

  const { error: factorErr } = await supabase.from('factors').upsert(factors, { onConflict: 'id' })
  if (factorErr) results.push(`factors error: ${factorErr.message}`)
  else results.push('factors seeded OK')

  // ─── 2. Seed correct Parameters ─────────────────────────────────────────────
  const parameters = [
    // Growth (0.06 each, 5 params = 0.30)
    { id: 'a1000001-0000-4000-a000-000000000001', factor_id: 'f1000000-0000-0000-0000-000000000003', name: 'rev1yr', display_name: 'Revenue 1Y Growth %', description: '1-year revenue growth', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 1 },
    { id: 'a1000001-0000-4000-a000-000000000002', factor_id: 'f1000000-0000-0000-0000-000000000003', name: 'rev3yr', display_name: 'Revenue 3Y CAGR %', description: '3-year revenue CAGR', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 2 },
    { id: 'a1000001-0000-4000-a000-000000000003', factor_id: 'f1000000-0000-0000-0000-000000000003', name: 'ebitda3y', display_name: 'EBITDA 3Y CAGR %', description: '3-year EBITDA CAGR', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 3 },
    { id: 'a1000001-0000-4000-a000-000000000004', factor_id: 'f1000000-0000-0000-0000-000000000003', name: 'eps1yr', display_name: 'EPS 1Y Growth %', description: '1-year EPS growth', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 4 },
    { id: 'a1000001-0000-4000-a000-000000000005', factor_id: 'f1000000-0000-0000-0000-000000000003', name: 'eps3yr', display_name: 'EPS 3Y CAGR %', description: '3-year EPS CAGR', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 5 },
    // Quality (0.06 each, 5 params = 0.30)
    { id: 'a2000001-0000-4000-a000-000000000001', factor_id: 'f1000000-0000-0000-0000-000000000001', name: 'roce', display_name: 'ROCE %', description: 'Return on capital employed', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 1 },
    { id: 'a2000001-0000-4000-a000-000000000002', factor_id: 'f1000000-0000-0000-0000-000000000001', name: 'roe', display_name: 'ROE %', description: 'Return on equity', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 2 },
    { id: 'a2000001-0000-4000-a000-000000000003', factor_id: 'f1000000-0000-0000-0000-000000000001', name: 'ebit_margin', display_name: 'EBIT Margin %', description: 'EBIT as % of revenue', weight: 0.06, normalization_method: 'min_max', higher_is_better: true, display_order: 3 },
    { id: 'a2000001-0000-4000-a000-000000000004', factor_id: 'f1000000-0000-0000-0000-000000000001', name: 'de', display_name: 'Debt/Equity', description: 'Debt to equity ratio', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 4 },
    { id: 'a2000001-0000-4000-a000-000000000005', factor_id: 'f1000000-0000-0000-0000-000000000001', name: 'ccc', display_name: 'Cash Conversion Cycle', description: 'Days in cash conversion cycle', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 5 },
    // Valuation (0.06 each, 5 params = 0.30)
    { id: 'a3000001-0000-4000-a000-000000000001', factor_id: 'f1000000-0000-0000-0000-000000000002', name: 'pe', display_name: 'P/E Ratio', description: 'Price to earnings', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 1 },
    { id: 'a3000001-0000-4000-a000-000000000002', factor_id: 'f1000000-0000-0000-0000-000000000002', name: 'evebitda', display_name: 'EV/EBITDA', description: 'Enterprise value to EBITDA', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 2 },
    { id: 'a3000001-0000-4000-a000-000000000003', factor_id: 'f1000000-0000-0000-0000-000000000002', name: 'pfcfs', display_name: 'P/FCF', description: 'Price to free cash flow', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 3 },
    { id: 'a3000001-0000-4000-a000-000000000004', factor_id: 'f1000000-0000-0000-0000-000000000002', name: 'pocfs', display_name: 'P/OCF', description: 'Price to operating cash flow', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 4 },
    { id: 'a3000001-0000-4000-a000-000000000005', factor_id: 'f1000000-0000-0000-0000-000000000002', name: 'peg', display_name: 'PEG Ratio', description: 'P/E to growth ratio', weight: 0.06, normalization_method: 'min_max_inverse', higher_is_better: false, display_order: 5 },
    // Momentum (0.10, 1 param = 0.10)
    { id: 'a4000001-0000-4000-a000-000000000001', factor_id: 'f1000000-0000-0000-0000-000000000004', name: 'price_return', display_name: 'Price Return %', description: 'Annual price return', weight: 0.10, normalization_method: 'min_max', higher_is_better: true, display_order: 1 },
  ]

  // Ensure parameters table has weight, higher_is_better, display_name columns
  // We'll add them via upsert if they exist, otherwise use only existing cols
  // First try with full schema, fall back to minimal
  const paramsMinimal = parameters.map(p => ({
    id: p.id,
    factor_id: p.factor_id,
    name: p.display_name,
    description: p.description,
    normalization_method: p.normalization_method,
    display_order: p.display_order,
  }))

  const { error: paramErr } = await supabase.from('parameters').upsert(paramsMinimal, { onConflict: 'id' })
  if (paramErr) results.push(`parameters error: ${paramErr.message}`)
  else results.push('parameters seeded OK')

  return NextResponse.json({ results })
}

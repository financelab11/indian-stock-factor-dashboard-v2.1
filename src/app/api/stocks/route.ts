import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year')
  const search = searchParams.get('search') || ''
  const sector = searchParams.get('sector') || ''
  const marketCapBucket = searchParams.get('market_cap_bucket') || ''
  const sortBy = searchParams.get('sort_by') || 'final_score'
  const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('page_size') || '50')))
  const offset = (page - 1) * pageSize

  // Resolve year_id
  let yearId: number | null = null
  if (yearParam) {
    const { data: yearData } = await supabase
      .from('years')
      .select('id')
      .eq('year', parseInt(yearParam))
      .single()
    yearId = yearData?.id ?? null
  } else {
    const { data: yearData } = await supabase
      .from('years')
      .select('id, year')
      .order('year', { ascending: false })
      .limit(1)
      .single()
    yearId = yearData?.id ?? null
  }

  if (!yearId) {
    return NextResponse.json({ error: 'Year not found' }, { status: 404 })
  }

  // Strategy: use final_scores as the driving table so we get only companies that have scores
  // Join companies, factor_scores, final_scores all in one pass using Supabase nested select

  // Step 1: get total count of matching companies
  let countQuery = supabase
    .from('final_scores')
    .select('company_id, companies!inner(id, ticker, name, sector, industry, market_cap, market_cap_bucket)', { count: 'exact', head: true })
    .eq('year_id', yearId)

  if (search) {
    countQuery = countQuery.or(`ticker.ilike.%${search}%,name.ilike.%${search}%`, { referencedTable: 'companies' })
  }
  if (sector) {
    countQuery = countQuery.eq('companies.sector', sector)
  }
  if (marketCapBucket) {
    countQuery = countQuery.eq('companies.market_cap_bucket', marketCapBucket)
  }

  const { count } = await countQuery

  // Step 2: fetch paginated final_scores with company data, sorted by final_score
  let dataQuery = supabase
    .from('final_scores')
    .select('final_score, company_id, companies!inner(id, ticker, name, sector, industry, market_cap, market_cap_bucket)')
    .eq('year_id', yearId)

  if (search) {
    dataQuery = dataQuery.or(`ticker.ilike.%${search}%,name.ilike.%${search}%`, { referencedTable: 'companies' })
  }
  if (sector) {
    dataQuery = dataQuery.eq('companies.sector', sector)
  }
  if (marketCapBucket) {
    dataQuery = dataQuery.eq('companies.market_cap_bucket', marketCapBucket)
  }

  // Only sort by final_score at DB level (other sorts happen client side after factor score fetch)
  if (sortBy === 'final_score') {
    dataQuery = dataQuery.order('final_score', { ascending: sortOrder === 'asc' })
  } else {
    // Default sort by final_score desc for non-factor sorts; we'll re-sort after fetching factor scores
    dataQuery = dataQuery.order('final_score', { ascending: false })
  }

  dataQuery = dataQuery.range(offset, offset + pageSize - 1)

  const { data: finalScoreRows, error } = await dataQuery

  if (error) {
    console.error('stocks route error:', error)
    return NextResponse.json({ error: 'Query failed', detail: error.message }, { status: 500 })
  }

  if (!finalScoreRows || finalScoreRows.length === 0) {
    return NextResponse.json({ stocks: [], total: count ?? 0 })
  }

  // Step 3: fetch factor scores for just these companies (small batch)
  const companyIds = finalScoreRows.map((r: { company_id: string }) => r.company_id)

  const { data: factorScoreRows } = await supabase
    .from('factor_scores')
    .select('company_id, score, factors(name)')
    .in('company_id', companyIds)
    .eq('year_id', yearId)

  // Build factor score map
  const factorScoreMap: Record<string, Record<string, number>> = {}
  factorScoreRows?.forEach((fs: { company_id: string; score: number; factors: { name: string } | { name: string }[] | null }) => {
    if (!factorScoreMap[fs.company_id]) factorScoreMap[fs.company_id] = {}
    const factorsData = fs.factors
    const factorName = Array.isArray(factorsData)
      ? factorsData[0]?.name
      : (factorsData as { name: string } | null)?.name
    if (factorName) factorScoreMap[fs.company_id][factorName] = fs.score
  })

  // Build stocks array
  let stocks = finalScoreRows.map((row: {
    final_score: number
    company_id: string
    companies: { id: string; ticker: string; name: string; sector: string; industry: string; market_cap: number; market_cap_bucket: string } | { id: string; ticker: string; name: string; sector: string; industry: string; market_cap: number; market_cap_bucket: string }[]
  }) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies
    return {
      company,
      factorScores: factorScoreMap[row.company_id] || {},
      finalScore: row.final_score,
    }
  })

  // Re-sort by factor score if requested
  if (sortBy !== 'final_score') {
    stocks.sort((a, b) => {
      const aVal = a.factorScores[sortBy] ?? 0
      const bVal = b.factorScores[sortBy] ?? 0
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  return NextResponse.json({ stocks, total: count ?? 0 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const supabase = createServiceClient()
  const { ticker } = await params
  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year')

  // Get company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('ticker', ticker.toUpperCase())
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  // Get all years
  const { data: allYears } = await supabase
    .from('years')
    .select('*')
    .order('year', { ascending: true })

  if (!allYears || allYears.length === 0) {
    return NextResponse.json({ error: 'No years found' }, { status: 404 })
  }

  // Resolve requested year
  let targetYear = allYears[allYears.length - 1]
  if (yearParam) {
    const found = allYears.find((y: { id: number; year: number }) => y.year === parseInt(yearParam))
    if (found) targetYear = found
  }

  // Get factors with parameters
  const { data: factors } = await supabase
    .from('factors')
    .select('*, parameters(*)')
    .order('display_order')

  // Get factor scores for this company and year
  const { data: factorScores } = await supabase
    .from('factor_scores')
    .select('factor_id, score')
    .eq('company_id', company.id)
    .eq('year_id', targetYear.id)

  // Get parameter scores for this company and year
  const { data: parameterScores } = await supabase
    .from('parameter_scores')
    .select('parameter_id, raw_value, normalized_value')
    .eq('company_id', company.id)
    .eq('year_id', targetYear.id)

  // Get final score for this year
  const { data: finalScoreData } = await supabase
    .from('final_scores')
    .select('final_score')
    .eq('company_id', company.id)
    .eq('year_id', targetYear.id)
    .single()

  // Build historical scores
  const historicalScores = []
  for (const yr of allYears) {
    const { data: fScores } = await supabase
      .from('factor_scores')
      .select('factor_id, score, factors(name)')
      .eq('company_id', company.id)
      .eq('year_id', yr.id)

    const { data: fsData } = await supabase
      .from('final_scores')
      .select('final_score')
      .eq('company_id', company.id)
      .eq('year_id', yr.id)
      .single()

    const factorScoreMap: Record<string, number> = {}
    fScores?.forEach((fs: { factor_id: string; score: number; factors: { name: string }[] | { name: string } | null }) => {
        const factorsData = fs.factors
        const name = Array.isArray(factorsData) ? factorsData[0]?.name : (factorsData as { name: string } | null)?.name || fs.factor_id
        factorScoreMap[name || fs.factor_id] = fs.score
      })

    historicalScores.push({
      year: yr.year,
      finalScore: fsData?.final_score ?? 0,
      factorScores: factorScoreMap,
    })
  }

  // Build factor score map
  const factorScoreMap: Record<string, number> = {}
  factorScores?.forEach((fs: { factor_id: string; score: number }) => {
    factorScoreMap[fs.factor_id] = fs.score
  })

  // Build parameter score map
  const paramScoreMap: Record<string, { raw_value: number; normalized_value: number }> = {}
  parameterScores?.forEach((ps: { parameter_id: string; raw_value: number; normalized_value: number }) => {
    paramScoreMap[ps.parameter_id] = { raw_value: ps.raw_value, normalized_value: ps.normalized_value }
  })

  // Assemble response
  const factorsWithScores = factors?.map((f: {
    id: string
    name: string
    description: string
    weight: number
    display_order: number
    parameters: Array<{ id: string; factor_id: string; name: string; description: string; normalization_method: string; display_order: number }>
  }) => ({
    factor: {
      id: f.id,
      name: f.name,
      description: f.description,
      weight: f.weight,
      display_order: f.display_order,
    },
    score: factorScoreMap[f.id] ?? 0,
    parameters: (f.parameters || [])
      .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
      .map((p: { id: string; factor_id: string; name: string; description: string; normalization_method: string; display_order: number }) => ({
        parameter: p,
        rawValue: paramScoreMap[p.id]?.raw_value ?? 0,
        normalizedValue: paramScoreMap[p.id]?.normalized_value ?? 0,
      })),
  })) ?? []

  return NextResponse.json({
    company,
    factors: factorsWithScores,
    finalScore: finalScoreData?.final_score ?? 0,
    historicalScores,
    availableYears: allYears.map((y: { id: number; year: number }) => y.year),
    currentYear: targetYear.year,
  })
}

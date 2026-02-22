export interface Company {
  id: string
  ticker: string
  name: string
  sector: string
  industry: string
  market_cap: number
  market_cap_bucket: string
}

export interface Year {
  id: number
  year: number
}

export interface Factor {
  id: string
  name: string
  description: string
  weight: number
  display_order: number
}

export interface Parameter {
  id: string
  factor_id: string
  name: string
  description: string
  normalization_method: string
  display_order: number
}

export interface FactorScore {
  id: string
  company_id: string
  factor_id: string
  year_id: number
  score: number
}

export interface ParameterScore {
  id: string
  company_id: string
  parameter_id: string
  year_id: number
  raw_value: number
  normalized_value: number
}

export interface FinalScore {
  id: string
  company_id: string
  year_id: number
  final_score: number
}

export interface StockRow {
  company: Company
  factorScores: Record<string, number>
  finalScore: number
}

export interface StockDetail {
  company: Company
  factors: Array<{
    factor: Factor
    score: number
    parameters: Array<{
      parameter: Parameter
      rawValue: number
      normalizedValue: number
    }>
  }>
  finalScore: number
  historicalScores: Array<{
    year: number
    finalScore: number
    factorScores: Record<string, number>
  }>
}

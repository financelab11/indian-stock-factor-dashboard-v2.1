export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 55) return 'text-lime-600'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-500'
}

export function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (score >= 55) return 'bg-lime-100 text-lime-800 border-lime-200'
  if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

export function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 55) return 'bg-lime-500'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

export function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `₹${(cap / 1e12).toFixed(1)}T`
  if (cap >= 1e9) return `₹${(cap / 1e9).toFixed(0)}B`
  if (cap >= 1e7) return `₹${(cap / 1e7).toFixed(0)}Cr`
  return `₹${cap.toLocaleString('en-IN')}`
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Weak'
}

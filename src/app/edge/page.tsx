'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  TrendingUp, BarChart2, FlaskConical, ArrowRight,
  Layers, Target, Award, Zap, CheckCircle,
  ChevronRight, BarChart, Activity, Shield, TrendingDown,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface BacktestMetrics {
  cagr?: number; benchmark_cagr?: number; alpha?: number
  win_rate?: number; sharpe?: number; years_count?: number
}

// ── Reusable Components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{children}</p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{children}</h2>
  )
}

function FactorCard({
  number, name, tagline, color, icon, parameters, explanation,
}: {
  number: string; name: string; tagline: string; color: string
  icon: React.ReactNode; parameters: string[]; explanation: string
}) {
  return (
    <div className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow ${color}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-foreground shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-0.5">Factor {number}</div>
          <h3 className="font-bold text-base leading-tight">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Parameters</div>
        <div className="flex flex-wrap gap-1.5">
          {parameters.map(p => (
            <span key={p} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground border border-border">
              {p}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{explanation}</p>
    </div>
  )
}

function NormStep({ step, label, desc }: { step: string; label: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
        {step}
      </div>
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

function ExampleRow({ factor, score, weight }: { factor: string; score: number; weight: number }) {
  const contribution = ((score * weight) / 100).toFixed(2)
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-2.5 px-3 text-sm font-medium">{factor}</td>
      <td className="py-2.5 px-3 text-sm text-center">
        <span className="inline-block w-24 bg-muted rounded-full h-1.5 overflow-hidden align-middle mr-2">
          <span className="block bg-primary h-1.5 rounded-full" style={{ width: `${score * 10}%` }} />
        </span>
        <span className="font-semibold">{score.toFixed(1)}</span>
      </td>
      <td className="py-2.5 px-3 text-sm text-center text-muted-foreground">{weight}%</td>
      <td className="py-2.5 px-3 text-sm text-center font-semibold text-primary">{contribution}</td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EdgePage() {
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    fetch('/api/backtest/summary?top_n=20')
      .then(r => r.json())
      .then(d => {
        if (d.has_data && d.metrics) { setMetrics(d.metrics); setHasData(true) }
      })
      .catch(() => {})
  }, [])

  const factors = [
    {
      number: '01', name: 'Value', tagline: 'Measures how cheaply priced a stock is',
      color: 'border-blue-100',
      icon: <Target className="w-4 h-4 text-blue-600" />,
      parameters: ['P/E Ratio', 'P/B Ratio', 'EV/EBITDA', 'FCF Yield', 'Dividend Yield'],
      explanation: 'Lower valuation multiples → higher normalized score. A cheap stock isn\'t always a good stock — but combined with other factors, value provides a powerful mean-reversion edge.',
    },
    {
      number: '02', name: 'Quality', tagline: 'Measures financial strength and operational excellence',
      color: 'border-emerald-100',
      icon: <Award className="w-4 h-4 text-emerald-600" />,
      parameters: ['ROE', 'ROCE', 'Debt/Equity', 'Interest Coverage', 'Earnings Stability'],
      explanation: 'High-quality businesses compound capital efficiently. Stocks with strong balance sheets and high returns on capital consistently outperform in Indian markets over long horizons.',
    },
    {
      number: '03', name: 'Growth', tagline: 'Measures earnings and revenue expansion trajectory',
      color: 'border-amber-100',
      icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
      parameters: ['Revenue CAGR (3Y)', 'EBITDA Growth', 'EPS Growth (3Y)', 'Operating Leverage'],
      explanation: 'Growth stocks that are also cheap and high-quality are the holy grail. This factor captures sustainable business expansion, not speculative hype.',
    },
    {
      number: '04', name: 'Momentum', tagline: 'Measures price strength and relative performance',
      color: 'border-purple-100',
      icon: <Activity className="w-4 h-4 text-purple-600" />,
      parameters: ['12M Price Return', 'Relative Strength', '6M Return', 'Price vs 52W High'],
      explanation: 'Momentum is one of the most statistically robust factors globally. Winners tend to keep winning over 6–12 month horizons. We capture this using trailing returns and relative strength.',
    },
    {
      number: '05', name: 'Stability', tagline: 'Measures risk-adjusted predictability',
      color: 'border-rose-100',
      icon: <Shield className="w-4 h-4 text-rose-600" />,
      parameters: ['Beta', 'Volatility (1Y)', 'Max Drawdown', 'Earnings Variability'],
      explanation: 'Low-volatility stocks have historically outperformed on a risk-adjusted basis. Stability rewards predictable businesses that don\'t swing wildly — reducing behavioral risk for investors.',
    },
  ]

  const backtestTable = [
    { year: 'FY11 → FY12', portfolioReturn: -31, note: 'Post-2008 recovery setback' },
    { year: 'FY12 → FY13', portfolioReturn: 56, note: 'Strong recovery year' },
    { year: 'FY13 → FY14', portfolioReturn: 42, note: 'Bull run continuation' },
    { year: 'FY14 → FY15', portfolioReturn: 38, note: 'Modi election rally' },
  ]

  const exampleFactors = [
    { factor: 'Value', score: 7.2, weight: 25 },
    { factor: 'Quality', score: 8.1, weight: 25 },
    { factor: 'Growth', score: 6.5, weight: 20 },
    { factor: 'Momentum', score: 5.9, weight: 20 },
    { factor: 'Stability', score: 7.0, weight: 10 },
  ]
  const finalScore = exampleFactors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0)

  return (
    <div className="flex flex-col -mt-4 -mx-3 sm:-mx-4 md:-mx-6">

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-8 md:px-16 py-20 md:py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-sm">
            <Zap className="w-3 h-3" />
            Methodology &amp; Philosophy
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Where Data Becomes{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              an Edge
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Our multi-factor model transforms raw financial metrics into actionable intelligence — combining Value, Quality, Growth, and Momentum into a single, transparent score.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-6 py-3 text-sm transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              Explore Factor Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/backtest"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 text-sm transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              View Portfolio Backtest
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: WHAT IS MULTI-FACTOR INVESTING ───────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <SectionLabel>The Philosophy</SectionLabel>
            <SectionHeading>What is Multi-Factor Investing?</SectionHeading>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-5">
              Multi-factor investing combines multiple independent drivers of stock returns into a single composite signal. Instead of betting on one signal, we blend statistically validated factors — each capturing a different dimension of a stock&apos;s quality.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No single factor works all the time. But blending uncorrelated factors — Value, Quality, Growth, and Momentum — creates a robust, all-weather approach that outperforms over full market cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
                { factor: 'Value', desc: 'Buy cheap. Mean reversion is powerful.', color: 'bg-blue-50 border-blue-100 text-blue-700' },
                { factor: 'Quality', desc: 'Own businesses that compound capital well.', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                { factor: 'Growth', desc: 'Follow earnings expansion trajectories.', color: 'bg-amber-50 border-amber-100 text-amber-700' },
                { factor: 'Momentum', desc: 'Ride price strength. Trends persist.', color: 'bg-purple-50 border-purple-100 text-purple-700' },
              ].map(({ factor, desc, color }) => (
              <div key={factor} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${color}`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <div>
                  <span className="font-semibold text-sm">{factor} </span>
                  <span className="text-xs opacity-80">— {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: OUR FACTORS ──────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>The Five Factors</SectionLabel>
            <SectionHeading>Our Factor Architecture</SectionHeading>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Each factor is designed to capture a distinct, academically validated return premium.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {factors.map(f => <FactorCard key={f.name} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: NORMALIZATION ─────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <SectionLabel>Data Processing</SectionLabel>
            <SectionHeading>Parameter Normalization</SectionHeading>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-7">
              Raw financial data can&apos;t be compared directly — a P/E of 15 means different things in different sectors. We solve this through cross-sectional normalization.
            </p>
            <div className="flex flex-col gap-5">
              <NormStep
                step="1"
                label="Collect Raw Values"
                desc="Gather raw financial metrics for all stocks in the universe for a given financial year."
              />
              <NormStep
                step="2"
                label="Percentile Rank"
                desc="Each stock is ranked against all others on that metric. The best performer gets rank 100, worst gets rank 1."
              />
              <NormStep
                step="3"
                label="Scale to 0–10"
                desc="Percentile ranks are scaled to a 0–10 score, ensuring all parameters are comparable regardless of unit or magnitude."
              />
              <NormStep
                step="4"
                label="Directional Adjustment"
                desc="For metrics where lower is better (like P/E, Debt/Equity), ranks are inverted so the score always means 'higher is better'."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Normalization Example: P/E Ratio</div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="py-2 px-3 text-left font-semibold">Stock</th>
                    <th className="py-2 px-3 text-right font-semibold">Raw P/E</th>
                    <th className="py-2 px-3 text-right font-semibold">Percentile</th>
                    <th className="py-2 px-3 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stock: 'Stock A', pe: 8.2, pct: 95, score: 9.5 },
                    { stock: 'Stock B', pe: 15.1, pct: 72, score: 7.2 },
                    { stock: 'Stock C', pe: 28.4, pct: 45, score: 4.5 },
                    { stock: 'Stock D', pe: 52.0, pct: 18, score: 1.8 },
                    { stock: 'Stock E', pe: 89.3, pct: 4, score: 0.4 },
                  ].map(row => (
                    <tr key={row.stock} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 font-medium">{row.stock}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{row.pe}x</td>
                      <td className="py-2 px-3 text-right">{row.pct}th</td>
                      <td className="py-2 px-3 text-right">
                        <span className="font-bold text-primary">{row.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Lower P/E → higher percentile rank → higher score (inverted, since lower P/E is better for value).
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FACTOR WEIGHTING ─────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>Model Architecture</SectionLabel>
            <SectionHeading>Factor Weighting Structure</SectionHeading>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Weights reflect the relative importance and empirical robustness of each factor in the Indian equity context.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-5">Weight Distribution</div>
              <div className="flex flex-col gap-4">
                {[
                  { factor: 'Value', weight: 25, color: 'bg-blue-500', desc: 'Valuation multiples & yield' },
                  { factor: 'Quality', weight: 25, color: 'bg-emerald-500', desc: 'Returns & balance sheet' },
                  { factor: 'Growth', weight: 20, color: 'bg-amber-500', desc: 'Revenue & earnings trajectory' },
                  { factor: 'Momentum', weight: 20, color: 'bg-purple-500', desc: 'Price strength & relative return' },
                  { factor: 'Stability', weight: 10, color: 'bg-rose-500', desc: 'Volatility & drawdown control' },
                ].map(({ factor, weight, color, desc }) => (
                  <div key={factor}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-semibold">{factor}</span>
                        <span className="text-xs text-muted-foreground ml-2">{desc}</span>
                      </div>
                      <span className="text-sm font-bold">{weight}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${weight * 4}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">The Formula</div>
                <div className="rounded-xl bg-muted/60 p-4 font-mono text-sm leading-relaxed">
                  <div className="text-muted-foreground text-xs mb-2">// Final Score computation</div>
                  Final Score =<br />
                  &nbsp;&nbsp;(Value × 0.25) +<br />
                  &nbsp;&nbsp;(Quality × 0.25) +<br />
                  &nbsp;&nbsp;(Growth × 0.20) +<br />
                  &nbsp;&nbsp;(Momentum × 0.20) +<br />
                  &nbsp;&nbsp;(Stability × 0.10)
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Each factor score is already normalized to 0–10. The final score is then scaled to 0–100 for readability.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Why These Weights?</div>
                <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />Value &amp; Quality equally weighted — the foundation of sound investing</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />Growth &amp; Momentum capture forward-looking signals</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />Stability as a risk dampener — less is sometimes more</li>
                  <li className="flex gap-2"><ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />Weights validated against Indian equity historical data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: REAL EXAMPLE ─────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <SectionLabel>Worked Example</SectionLabel>
            <SectionHeading>Scoring a Real Stock</SectionHeading>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-6">
              Here&apos;s how a typical high-quality Indian midcap might score across all five factors, and how the weighted final score is computed.
            </p>
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <div className="font-semibold text-sm">ABC Industries Ltd</div>
                <div className="text-xs text-muted-foreground">Illustrative example · FY2024</div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Factor</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Score (/10)</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Weight</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleFactors.map(f => <ExampleRow key={f.factor} {...f} />)}
                </tbody>
              </table>
              <div className="px-3 py-3 bg-primary/5 border-t border-border flex justify-between items-center">
                <span className="text-sm font-semibold">Final Score</span>
                <span className="text-xl font-black text-primary">{(finalScore * 10).toFixed(1)}<span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-6 md:mt-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">How Annual Ranking Works</div>
              <ol className="flex flex-col gap-3">
                {[
                  'At FY end, compute factor scores for all stocks in the universe',
                  'Calculate weighted final score for each stock (0–100)',
                  'Rank all stocks by final score, highest to lowest',
                  'Select Top-N stocks (configurable, default: 20)',
                  'Build equal-weighted portfolio from selected stocks',
                  'Hold for 12 months, then rebalance at next FY end',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Key Insight</div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Stocks with scores above <strong>70/100</strong> are classified as &quot;Strong&quot; — these are the prime candidates for the top-N selection. The model doesn&apos;t just chase one dimension; it demands a stock be good across multiple independent dimensions simultaneously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FROM SCORE TO PORTFOLIO ─────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>Portfolio Construction</SectionLabel>
            <SectionHeading>From Score to Portfolio</SectionHeading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Rank by Score', desc: 'All stocks ranked by final score, highest to lowest, as of FY end.', icon: <BarChart className="w-5 h-5" /> },
              { step: '02', title: 'Select Top 20', desc: 'The 20 highest-scoring stocks are selected. Configurable from 5 to 50.', icon: <Award className="w-5 h-5" /> },
              { step: '03', title: 'Equal Weight', desc: 'Each selected stock gets an equal 5% weight. No concentration risk.', icon: <Layers className="w-5 h-5" /> },
              { step: '04', title: 'Rebalance Annually', desc: 'Hold for 12 months, then repeat the entire process at next FY end.', icon: <Activity className="w-5 h-5" /> },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    {icon}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{step}</span>
                </div>
                <div className="font-semibold text-sm">{title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: WHAT IS BACKTESTING ──────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <SectionLabel>Validation</SectionLabel>
            <SectionHeading>What is Backtesting?</SectionHeading>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-5">
              Backtesting simulates how a strategy would have performed using historical data. It lets us validate robustness before committing real capital.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Our process is strict: scores from <strong>FY end year N</strong> are used to select stocks, and we measure the returns from <strong>FY N+1</strong> — ensuring no lookahead bias.
            </p>
            <div className="rounded-xl bg-muted/50 p-4 border border-border font-mono text-xs leading-relaxed text-muted-foreground mb-5">
              FY11 Scores → Select Top 20 → Measure FY12 Returns<br />
              FY12 Scores → Select Top 20 → Measure FY13 Returns<br />
              FY13 Scores → Select Top 20 → Measure FY14 Returns<br />
              <span className="text-primary">... repeat for 14 years ...</span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              {[
                'No lookahead bias — scores computed on past data only',
                'Equal-weighted to avoid size concentration',
                'Compared against Nifty 50 total return each year',
                'All market conditions captured: bull, bear, sideways',
              ].map(point => (
                <div key={point} className="flex gap-2 items-start">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <div className="font-semibold text-sm">Illustrative Backtest Results</div>
                <div className="text-xs text-muted-foreground">Example annual returns (not actual data)</div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Selection Year</th>
                    <th className="py-2 px-3 text-center font-semibold text-muted-foreground">Return Year</th>
                    <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Portfolio</th>
                  </tr>
                </thead>
                <tbody>
                  {backtestTable.map(row => (
                    <tr key={row.year} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{row.year.split(' → ')[0]}</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{row.year.split(' → ')[1]}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${row.portfolioReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {row.portfolioReturn > 0 ? '+' : ''}{row.portfolioReturn}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 bg-muted/30 border-t border-border text-xs text-muted-foreground">
                Actual backtest data available in the Portfolio Backtest section.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Why Backtesting Matters</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Any factor model can look good in theory. Backtesting reveals whether the signal actually translated to outperformance — and more importantly, whether the strategy held up across different market cycles, including the 2008 crisis, 2020 crash, and various sector rotations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: PERFORMANCE COMPARISON ──────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>
              <span className="text-indigo-400">Live Results</span>
            </SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Factor Model vs Nifty 50</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto">
              {hasData
                ? 'Live metrics pulled from your uploaded factor model data.'
                : 'Upload your factor model data to see live performance metrics here.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Portfolio CAGR', value: hasData ? `${metrics?.cagr?.toFixed(1)}%` : '—', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' },
              { label: 'Alpha vs Nifty', value: hasData ? `+${metrics?.alpha?.toFixed(1)}%` : '—', color: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
              { label: 'Win Rate', value: hasData ? `${metrics?.win_rate?.toFixed(0)}%` : '—', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
              { label: 'Years Tested', value: hasData ? `${metrics?.years_count}` : '—', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-2xl border px-4 py-5 flex flex-col items-center gap-1 shadow-sm ${color}`}>
                <span className="text-3xl font-black tracking-tight">{value}</span>
                <span className="text-xs font-medium opacity-80 text-center">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/backtest"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-7 py-3.5 text-sm transition-colors shadow-lg"
            >
              <FlaskConical className="w-4 h-4" />
              Explore Full Portfolio Backtest
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 10: FINAL CTA ────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Zap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to See the Edge in Action?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You now understand the methodology. Time to see it in action — explore ranked stocks or validate performance through the backtest engine.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 py-3.5 text-sm transition-colors shadow-md"
            >
              <BarChart2 className="w-4 h-4" />
              Explore Factor Dashboard
            </Link>
            <Link
              href="/backtest"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold px-7 py-3.5 text-sm transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              View Portfolio Backtest
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  TrendingUp, BarChart2, FlaskConical, ChevronRight,
  CheckCircle, ArrowRight, Database, Layers, Target,
  Zap, Shield, Award, Activity, RefreshCw,
} from 'lucide-react'

interface BacktestMetrics {
  cagr?: number
  benchmark_cagr?: number
  alpha?: number
  win_rate?: number
  sharpe?: number
  max_drawdown?: number
  years_count?: number
}

// ── Animated SVG chart line ──────────────────────────────────────────────────
function AnimatedChartLine() {
  return (
    <svg
      viewBox="0 0 800 180"
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="30%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,140 80,120 160,100 200,115 260,75 320,60 380,80 440,45 500,30 560,55 620,25 700,10 800,35"
        style={{
          strokeDasharray: '1400',
          strokeDashoffset: '1400',
          animation: 'dashLine 8s linear infinite',
        }}
      />
      <style>{`
        @keyframes dashLine {
          0% { stroke-dashoffset: 1400; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  )
}

// ── Flow Step ────────────────────────────────────────────────────────────────
function FlowStep({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-medium text-center leading-tight text-foreground max-w-[72px]">{label}</span>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="hidden sm:flex items-center self-start mt-3.5">
      <div className="w-6 h-px bg-border" />
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground -ml-1" />
    </div>
  )
}

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Metric Pill ──────────────────────────────────────────────────────────────
function MetricPill({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 flex flex-col items-center gap-1 shadow-sm ${colorClass}`}>
      <span className="text-3xl font-black tracking-tight">{value}</span>
      <span className="text-xs font-medium opacity-80 text-center">{label}</span>
    </div>
  )
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    fetch('/api/backtest/summary?top_n=20')
      .then(r => r.json())
      .then(d => {
        if (d.has_data && d.metrics) {
          setMetrics(d.metrics)
          setHasData(true)
        }
      })
      .catch(() => {})
  }, [])

  const fmt = (v?: number) =>
    v !== undefined && v !== null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}%` : '—'

  const flowSteps = [
    { label: 'Raw Financial Data', icon: <Database className="w-5 h-5" /> },
    { label: 'Normalize Parameters', icon: <RefreshCw className="w-5 h-5" /> },
    { label: 'Factor Scores', icon: <Layers className="w-5 h-5" /> },
    { label: 'Weighted Model', icon: <Target className="w-5 h-5" /> },
    { label: 'Final Score', icon: <Award className="w-5 h-5" /> },
    { label: 'Portfolio Backtest', icon: <FlaskConical className="w-5 h-5" /> },
  ]

  return (
    <div className="flex flex-col -mt-4 -mx-3 sm:-mx-4 md:-mx-6">

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white px-4 sm:px-8 md:px-16 py-20 md:py-28">
        <AnimatedChartLine />
        <div className="absolute top-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              <Zap className="w-3 h-3" />
              India&apos;s Multi-Factor Stock Intelligence Platform
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
              Invest Smarter with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Data-Driven Factor Intelligence
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Rank, filter, and backtest Indian stocks using a systematic multi-factor model
              built on normalized financial data — the same methodology used by institutional quant funds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-7 py-3.5 text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                <BarChart2 className="w-4 h-4" />
                Explore Factor Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/backtest"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 text-sm transition-colors backdrop-blur-sm"
              >
                <FlaskConical className="w-4 h-4" />
                View Portfolio Backtest
              </Link>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />NSE &amp; BSE Coverage</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />14+ Years Backtest</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />4-Factor Model</span>

            </div>
        </div>
      </section>

      {/* ── SECTION 2: WHAT THIS PLATFORM DOES ─────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">What We Do</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">One Platform. Three Superpowers.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Award className="w-5 h-5" />}
              title="Rank Stocks Objectively"
              desc="Every stock scored 0–100 using normalized financial parameters across 5 institutional-grade factors. No guesswork. Pure data."
            />
            <FeatureCard
              icon={<Layers className="w-5 h-5" />}
              title="Compare Factor Strength"
              desc="Visualize Growth, Quality, Value, and Momentum scores across years. Identify trend and factor leadership at a glance."
            />
            <FeatureCard
              icon={<FlaskConical className="w-5 h-5" />}
              title="Validate via Backtesting"
              desc="See real historical portfolio performance vs Nifty 50 — FY2012 through FY2025. Evidence, not theory."
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ─────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">The Process</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How the Model Works</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              Six systematic steps transform raw financial data into a ranked, backtested portfolio.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-start gap-3 sm:gap-1">
            {flowSteps.reduce<React.ReactNode[]>((acc, step, i, arr) => {
              acc.push(<FlowStep key={step.label} label={step.label} icon={step.icon} />)
              if (i < arr.length - 1) acc.push(<FlowArrow key={`a${i}`} />)
              return acc
            }, [])}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {[
              { step: '01', title: 'Cross-Sectional Normalization', desc: 'Each metric is ranked percentile-style across all stocks, then scaled to 0–10. Eliminates sector and size bias.' },
              { step: '02', title: 'Factor Aggregation', desc: '5 factors are computed as weighted averages of underlying parameters — giving a holistic view of each stock.' },
              { step: '03', title: 'Annual Rebalancing', desc: 'Scores are computed every FY. Top-N stocks selected at year-end. Equal-weighted portfolio held for 12 months.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-2xl font-black text-primary/20 mb-1">{step}</div>
                <div className="font-semibold mb-1">{title}</div>
                <div className="text-muted-foreground leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHY USE THIS ─────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Why Factor Lens</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Discipline Over Emotion.
              <br />Data Over Intuition.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Most investors lose not because they lack knowledge — but because emotions override discipline. Factor Lens removes human bias from the equation.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { icon: <Shield className="w-4 h-4" />, text: 'No emotional bias — purely quantitative signals' },
                { icon: <RefreshCw className="w-4 h-4" />, text: 'Annual rebalancing discipline built-in' },
                { icon: <CheckCircle className="w-4 h-4" />, text: 'Transparent, explainable scoring methodology' },
                { icon: <Activity className="w-4 h-4" />, text: 'Historical validation across 14+ years' },
                { icon: <BarChart2 className="w-4 h-4" />, text: 'Full Indian equity universe (NSE & BSE)' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary shrink-0">{icon}</span>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 shadow-xl">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-5">Factor Weighting</div>
            <div className="flex flex-col gap-3.5">
              {[
                  { factor: 'Value', weight: 30, barW: 'w-[100%]', color: 'bg-blue-400' },
                  { factor: 'Quality', weight: 30, barW: 'w-[100%]', color: 'bg-emerald-400' },
                  { factor: 'Growth', weight: 20, barW: 'w-[67%]', color: 'bg-amber-400' },
                  { factor: 'Momentum', weight: 20, barW: 'w-[67%]', color: 'bg-purple-400' },
                ].map(({ factor, weight, barW, color }) => (
                <div key={factor} className="flex items-center gap-3">
                  <div className="text-xs w-20 text-slate-300 font-medium">{factor}</div>
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className={`${color} ${barW} h-2 rounded-full`} />
                  </div>
                  <div className="text-xs font-bold text-white w-8 text-right">{weight}%</div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 font-mono">
              Final Score = Σ (Factor Score × Weight)
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: PERFORMANCE SNAPSHOT ─────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">Backtested Performance</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {hasData ? 'The Numbers Speak for Themselves' : 'Historical Performance Snapshot'}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Top-20 equal-weighted factor portfolio vs Nifty 50 benchmark
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <MetricPill
              label="Portfolio CAGR"
              value={hasData ? fmt(metrics?.cagr) : '—'}
              colorClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            />
            <MetricPill
              label="Alpha vs Nifty"
              value={hasData ? fmt(metrics?.alpha) : '—'}
              colorClass="border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            />
            <MetricPill
              label="Win Rate"
              value={hasData ? `${metrics?.win_rate?.toFixed(0)}%` : '—'}
              colorClass="border-purple-500/30 bg-purple-500/10 text-purple-300"
            />
            <MetricPill
              label="Sharpe Ratio"
              value={hasData ? (metrics?.sharpe?.toFixed(2) ?? '—') : '—'}
              colorClass="border-amber-500/30 bg-amber-500/10 text-amber-300"
            />
          </div>

          {!hasData && (
            <p className="text-center text-xs text-slate-500 mb-6">
              Upload factor model data via the seed page to see live performance metrics.
            </p>
          )}

          <div className="flex justify-center">
            <Link
              href="/backtest"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-7 py-3.5 text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              <FlaskConical className="w-4 h-4" />
              See Full Backtest Results
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Start Making Evidence-Based Investment Decisions
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Explore the dashboard to rank stocks, read the Edge to understand the methodology, or run a backtest to see historical proof.
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
          <Link
            href="/edge"
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
          >
            Learn the methodology on the Edge page →
          </Link>
        </div>
      </section>
    </div>
  )
}

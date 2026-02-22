'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Home, FlaskConical, Zap } from 'lucide-react'

function FactorLensLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="md-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1976D2"/>
          <stop offset="100%" stopColor="#0D47A1"/>
        </linearGradient>
        <linearGradient id="md-shine" x1="4" y1="4" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Material card background with rounded corners */}
      <rect width="40" height="40" rx="10" fill="url(#md-bg)"/>
      {/* Shine overlay */}
      <rect width="40" height="40" rx="10" fill="url(#md-shine)"/>
      {/* Magnifying lens circle */}
      <circle cx="17" cy="17" r="9" stroke="white" strokeWidth="2.8" fill="none" strokeOpacity="0.95"/>
      {/* Mini bar chart inside lens */}
      <rect x="11" y="18" width="2.2" height="4" rx="0.6" fill="white" fillOpacity="0.6"/>
      <rect x="14.5" y="15.5" width="2.2" height="6.5" rx="0.6" fill="white" fillOpacity="0.8"/>
      <rect x="18" y="13" width="2.2" height="9" rx="0.6" fill="white" fillOpacity="1"/>
      {/* Trend line over bars */}
      <polyline points="12.1,18 15.6,15.5 19.1,13" stroke="#64B5F6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Lens handle */}
      <line x1="24" y1="24" x2="30" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.95"/>
      {/* Handle cap dot */}
      <circle cx="30.5" cy="30.5" r="1.5" fill="#64B5F6"/>
    </svg>
  )
}

const TABS = [
  { href: '/', label: 'Home', icon: Home, exactMatch: true },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2, exactMatch: false },
  { href: '/backtest', label: 'Portfolio Backtest', icon: FlaskConical, exactMatch: false },
  { href: '/edge', label: 'Edge', icon: Zap, exactMatch: false },
]

const BOTTOM_TABS = [
  { href: '/', label: 'Home', icon: Home, exactMatch: true },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2, exactMatch: false },
  { href: '/backtest', label: 'Backtest', icon: FlaskConical, exactMatch: false },
  { href: '/edge', label: 'Edge', icon: Zap, exactMatch: false },
]

function isActive(pathname: string, href: string, exactMatch: boolean) {
  if (exactMatch) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb md:hidden">
      <div className="flex">
        {BOTTOM_TABS.map(({ href, label, icon: Icon, exactMatch }) => {
          const active = isActive(pathname, href, exactMatch)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : ''}`} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function TopNav() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-12 md:h-14 flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
              <FactorLensLogo className="w-7 h-7 md:w-8 md:h-8" />
              <span className="font-bold text-sm leading-tight tracking-tight">Factor Lens</span>
            </Link>

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex items-center gap-0.5 ml-6">
          {TABS.map(({ href, label, exactMatch }) => {
            const active = isActive(pathname, href, exactMatch)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

      </div>
    </header>
  )
}

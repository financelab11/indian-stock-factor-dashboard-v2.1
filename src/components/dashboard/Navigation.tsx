'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Home, FlaskConical, Zap } from 'lucide-react'

function FactorLensLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className={className}>
      <ellipse cx="20" cy="20" rx="18" ry="13" fill="url(#fl-lg1)"/>
      <ellipse cx="20" cy="20" rx="18" ry="13" stroke="url(#fl-lg2)" strokeWidth="1.5" fill="none"/>
      <rect x="9" y="22" width="4" height="5" rx="1" fill="white" opacity="0.55"/>
      <rect x="15" y="18" width="4" height="9" rx="1" fill="white" opacity="0.75"/>
      <rect x="21" y="14" width="4" height="13" rx="1" fill="white" opacity="0.9"/>
      <rect x="27" y="11" width="4" height="16" rx="1" fill="white"/>
      <polyline points="11,21 17,17 23,13 29,10" stroke="url(#fl-lg3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="29" cy="10" r="2" fill="#34d399"/>
      <defs>
        <linearGradient id="fl-lg1" x1="2" y1="7" x2="38" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a"/>
          <stop offset="100%" stopColor="#064e3b"/>
        </linearGradient>
        <linearGradient id="fl-lg2" x1="2" y1="7" x2="38" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id="fl-lg3" x1="11" y1="21" x2="29" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6ee7b7"/>
          <stop offset="100%" stopColor="#34d399"/>
        </linearGradient>
      </defs>
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

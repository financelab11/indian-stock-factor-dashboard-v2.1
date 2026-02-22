'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BarChart2, Home, FlaskConical, Zap } from 'lucide-react'

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
            <Image src="/logo.svg" alt="Factor Lens" width={32} height={32} className="w-7 h-7 md:w-8 md:h-8" />
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

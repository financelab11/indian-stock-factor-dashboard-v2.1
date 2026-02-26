import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Edge — Multi-Factor Investing Methodology | Factor Lens',
    description:
      'Understand the multi-factor investing model behind Factor Lens. Learn how Value, Quality, Growth, and Momentum factors are scored, normalized, and backtested against Nifty 50.',
}

export default function EdgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

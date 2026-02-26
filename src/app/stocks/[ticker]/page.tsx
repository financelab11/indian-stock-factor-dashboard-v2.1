'use client'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { StockDetail } from '@/components/dashboard/StockDetail'

export default function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')
  const year = yearParam ? parseInt(yearParam) : undefined

  return (
    <div className="px-4 md:px-6 py-6">
      <StockDetail ticker={ticker} year={year} />
    </div>
  )
}

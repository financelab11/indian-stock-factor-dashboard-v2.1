import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data: years } = await supabase
    .from('years')
    .select('year')
    .order('year', { ascending: true })

  return NextResponse.json({ years: years?.map((y: { year: number }) => y.year) ?? [] })
}

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data: factors } = await supabase
    .from('factors')
    .select('*, parameters(*)')
    .order('display_order')

  return NextResponse.json({ factors })
}

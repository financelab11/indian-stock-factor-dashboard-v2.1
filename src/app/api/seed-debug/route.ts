import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const result: Record<string, unknown> = {}

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[]
    result[sheetName] = {
      rowCount: rows.length,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      sample: rows.slice(0, 2),
    }
  }

  return NextResponse.json({ sheets: workbook.SheetNames, detail: result })
}

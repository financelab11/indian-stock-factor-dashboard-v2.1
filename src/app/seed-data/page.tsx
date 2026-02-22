'use client'
import { useState, useRef } from 'react'

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setStatus('uploading')
    setResult('')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/seed', { method: 'POST', body: form })
      const json = await res.json()
      setResult(JSON.stringify(json, null, 2))
      setStatus(res.ok ? 'done' : 'error')
    } catch (e) {
      setResult(String(e))
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">Seed Database</h1>
        <p className="text-sm text-muted-foreground text-center">Upload your Factor Model Excel file to populate the database.</p>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        >
          <p className="text-lg font-medium">Drop Factor Model Excel here</p>
          <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>

        {status === 'uploading' && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">Processing file...</p>
        )}

        {status === 'done' && (
          <div className="rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
            <p className="text-green-700 dark:text-green-300 font-semibold mb-2">Seeded successfully!</p>
            <pre className="text-xs text-green-800 dark:text-green-200 overflow-auto">{result}</pre>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-red-700 dark:text-red-300 font-semibold mb-2">Error</p>
            <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

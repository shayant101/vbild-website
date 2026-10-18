'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScanTheater from './ScanTheater'

export default function ScanBox({ size = 'hero', placeholder }: { size?: 'hero' | 'compact'; placeholder?: string }) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [running, setRunning] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onDone = useCallback((id: string, data: unknown) => {
    try { sessionStorage.setItem(`vbild-scan-${id}`, JSON.stringify(data)); sessionStorage.setItem('vbild-scan-reveal', id) } catch {}
    router.push(`/scan/${id}`)
  }, [router])
  const onError = useCallback((m: string) => { setErr(m); setRunning(null) }, [])

  return (
    <>
      <form className={`sb sb-${size}`} onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setErr(null); setRunning(input.trim()) } }}>
        <div className="sb-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder || 'Paste your Google Maps link, website, or business name'} aria-label="Business link or name" />
          <button type="submit" disabled={!input.trim()}>Scan my business</button>
        </div>
        {err && <div className="sb-err">{err}</div>}
        {!err && <div className="sb-hint">Free · 30 seconds · no sign-up. Try: <button type="button" className="sb-try" onClick={() => setInput('https://www.ocsmokeshack.com')}>a smoke shop</button> or <button type="button" className="sb-try" onClick={() => setInput('Reyes Plumbing Las Vegas')}>a plumber</button></div>}
      </form>
      {running && <ScanTheater input={running} onDone={onDone} onError={onError} />}
    </>
  )
}

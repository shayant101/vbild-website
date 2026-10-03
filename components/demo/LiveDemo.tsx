'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SCENARIOS, SCENARIO_LIST, guessScenario, type Scenario, type ScenarioId, type Spec } from './scenarios'
import { MiniApp } from './MiniApps'

type Phase = 'pick' | 'interview' | 'spec' | 'build' | 'live' | 'outro'
const PHASES: Phase[] = ['pick', 'interview', 'spec', 'build', 'live', 'outro']
const PHASE_LABEL: Record<Phase, string> = { pick: 'Business', interview: 'Interview', spec: 'Spec', build: 'Build', live: 'Live app', outro: 'Result' }

type Props = { compact?: boolean; autoStart?: ScenarioId }

export default function LiveDemo({ compact = false, autoStart }: Props) {
  const [phase, setPhase] = useState<Phase>(autoStart ? 'interview' : 'pick')
  const [scn, setScn] = useState<Scenario>(SCENARIOS[autoStart ?? 'restaurant'])
  const [spec, setSpec] = useState<Spec>(SCENARIOS[autoStart ?? 'restaurant'].spec)
  const [auto, setAuto] = useState(true)
  const [custom, setCustom] = useState('')
  const [liveMode, setLiveMode] = useState<'unknown' | 'live' | 'scripted'>('unknown')
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(Boolean(autoStart))
  const [toast, setToast] = useState<string | null>(null)
  const [screen, setScreen] = useState(0)
  const [builtAt, setBuiltAt] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // ── timer ──
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  useEffect(() => {
    if (phase === 'live') setBuiltAt((b) => (b === null ? elapsed : b))
    if (phase === 'outro') setRunning(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── probe live mode once ──
  useEffect(() => {
    fetch('/api/demo/spec', { method: 'GET' }).then((r) => r.json()).then((d) => setLiveMode(d.live ? 'live' : 'scripted')).catch(() => setLiveMode('scripted'))
  }, [])

  const showToast = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2200) }, [])

  const start = useCallback(async (id: ScenarioId, text?: string) => {
    let s = SCENARIOS[id]
    let sp = s.spec
    if (text && liveMode === 'live') {
      try {
        const r = await fetch('/api/demo/spec', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: text }) })
        if (r.ok) { const d = await r.json(); if (d.spec) { sp = { ...SCENARIOS[d.spec.scenario as ScenarioId ?? id].spec, ...d.spec }; s = SCENARIOS[sp.scenario] } }
      } catch { /* fall back to scripted */ }
    }
    setScn(s); setSpec(sp); setScreen(0); setElapsed(0); setBuiltAt(null); setRunning(true); setPhase('interview')
  }, [liveMode])

  const next = useCallback(() => setPhase((p) => PHASES[Math.min(PHASES.indexOf(p) + 1, PHASES.length - 1)]), [])
  const prev = useCallback(() => setPhase((p) => PHASES[Math.max(PHASES.indexOf(p) - 1, 0)]), [])
  const restart = useCallback(() => { setPhase('pick'); setRunning(false); setElapsed(0); setScreen(0); setBuiltAt(null) }, [])

  // ── keyboard (presenter) ──
  useEffect(() => {
    if (compact) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (phase !== 'pick') next() }
      if (e.key === 'ArrowLeft') prev()
      if (e.key.toLowerCase() === 'r') restart()
      if (e.key.toLowerCase() === 'a') setAuto((a) => !a)
      if (e.key.toLowerCase() === 'f') rootRef.current?.requestFullscreen?.()
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') start(SCENARIO_LIST[Number(e.key) - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [compact, phase, next, prev, restart, start])

  const mm = String(Math.floor(elapsed / 60)).padStart(1, '0'), ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div ref={rootRef} className={`ld ${compact ? 'ld-compact' : 'ld-full'}`} style={{ ['--acc' as string]: scn.accent }}>
      {/* top bar */}
      <div className="ld-top">
        <div className="ld-steps">
          {PHASES.map((p, i) => (
            <button key={p} className={`ld-step${p === phase ? ' on' : ''}${PHASES.indexOf(phase) > i ? ' done' : ''}`} onClick={() => { if (p !== 'pick' && phase === 'pick') return; setPhase(p) }}>
              <i>{i + 1}</i><span>{PHASE_LABEL[p]}</span>
            </button>
          ))}
        </div>
        <div className="ld-right">
          <span className={`ld-mode ${liveMode}`} title={liveMode === 'live' ? 'Claude is generating the spec live' : 'Scripted demo — no API key needed'}>{liveMode === 'live' ? '● Live · Claude' : liveMode === 'scripted' ? '○ Scripted' : '…'}</span>
          <span className="ld-timer">{mm}:{ss}</span>
          {!compact && <button className="ld-ctl" onClick={() => setAuto((a) => !a)}>{auto ? 'Auto ▶' : 'Manual ⏸'}</button>}
          {!compact && <button className="ld-ctl" onClick={restart}>↺</button>}
        </div>
      </div>

      {/* stage */}
      <div className="ld-stage">
        {phase === 'pick' && <Pick onPick={(id) => start(id)} custom={custom} setCustom={setCustom} onCustom={() => start(guessScenario(custom), custom)} liveMode={liveMode} compact={compact} />}
        {phase === 'interview' && <Interview scn={scn} auto={auto} onDone={next} />}
        {phase === 'spec' && <SpecView spec={spec} scn={scn} auto={auto} onDone={next} />}
        {phase === 'build' && <Build scn={scn} auto={auto} onDone={next} />}
        {phase === 'live' && <Live spec={spec} scn={scn} screen={screen} setScreen={setScreen} onToast={showToast} onDone={next} builtAt={builtAt} />}
        {phase === 'outro' && <Outro spec={spec} scn={scn} builtAt={builtAt} onRestart={restart} onBack={() => setPhase('live')} />}
      </div>

      {toast && <div className="ld-toast">{toast}</div>}

      {!compact && (
        <div className="ld-foot">
          <span><kbd>→</kbd>/<kbd>space</kbd> next · <kbd>←</kbd> back · <kbd>1–4</kbd> pick business · <kbd>A</kbd> auto · <kbd>R</kbd> restart · <kbd>F</kbd> fullscreen</span>
        </div>
      )}
    </div>
  )
}

/* ───────────── phases ───────────── */

function Pick({ onPick, custom, setCustom, onCustom, liveMode, compact }: { onPick: (id: ScenarioId) => void; custom: string; setCustom: (s: string) => void; onCustom: () => void; liveMode: string; compact: boolean }) {
  return (
    <div className="ld-pick">
      <div className="ld-kicker">Live build</div>
      <h2>Pick a business. Watch a working app ship in about a minute.</h2>
      <div className="ld-cards">
        {SCENARIO_LIST.map((s, i) => (
          <button key={s.id} className="ld-card" style={{ ['--acc' as string]: s.accent }} onClick={() => onPick(s.id)}>
            <span className="ld-card-emoji">{s.emoji}</span>
            <b>{s.label}</b>
            <small>{s.bizName}</small>
            {!compact && <kbd>{i + 1}</kbd>}
          </button>
        ))}
      </div>
      <form className="ld-custom" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) onCustom() }}>
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={liveMode === 'live' ? 'Or describe any business — Claude writes the spec live…' : 'Or describe any business (maps to the closest scenario)…'} />
        <button type="submit" disabled={!custom.trim()}>Build it →</button>
      </form>
    </div>
  )
}

function useTypewriter(lines: string[], speed = 18, gap = 500, enabled = true) {
  const [idx, setIdx] = useState(0)
  const [chars, setChars] = useState(0)
  useEffect(() => { setIdx(0); setChars(0) }, [lines])
  useEffect(() => {
    if (!enabled) { setIdx(lines.length); setChars(0); return }
    if (idx >= lines.length) return
    const line = lines[idx]
    if (chars < line.length) {
      const t = setTimeout(() => setChars((c) => c + 1), speed)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => { setIdx((i) => i + 1); setChars(0) }, gap)
    return () => clearTimeout(t)
  }, [idx, chars, lines, speed, gap, enabled])
  return { idx, chars, done: idx >= lines.length }
}

function Interview({ scn, auto, onDone }: { scn: Scenario; auto: boolean; onDone: () => void }) {
  const lines = useMemo(() => [scn.pitch, ...scn.interview.flatMap((x) => [x.q, x.a])], [scn])
  const { idx, chars, done } = useTypewriter(lines, 14, 420)
  useEffect(() => { if (done && auto) { const t = setTimeout(onDone, 900); return () => clearTimeout(t) } }, [done, auto, onDone])
  return (
    <div className="ld-chat">
      <div className="ld-chat-head"><span className="ld-avatar" style={{ background: scn.accent }}>{scn.emoji}</span><div><b>{scn.bizName}</b><small>{scn.owner} · 5-minute discovery, compressed</small></div></div>
      <div className="ld-msgs">
        {lines.slice(0, Math.min(idx + 1, lines.length)).map((l, i) => {
          const isOwner = i === 0 || i % 2 === 0
          const text = i < idx ? l : l.slice(0, chars)
          return <div key={i} className={`ld-msg ${isOwner ? 'owner' : 'vbild'}`}><span className="ld-who">{isOwner ? scn.owner.split(',')[0] : 'Vbild'}</span><p>{text}{i === idx && <i className="ld-caret" />}</p></div>
        })}
      </div>
      {done && !auto && <button className="ld-next" onClick={onDone}>Write the spec →</button>}
    </div>
  )
}

function SpecView({ spec, scn, auto, onDone }: { spec: Spec; scn: Scenario; auto: boolean; onDone: () => void }) {
  const [n, setN] = useState(0)
  const total = 4 + spec.features.length + spec.screens.length
  useEffect(() => { setN(0) }, [spec])
  useEffect(() => { if (n >= total) return; const t = setTimeout(() => setN((x) => x + 1), 170); return () => clearTimeout(t) }, [n, total])
  useEffect(() => { if (n >= total && auto) { const t = setTimeout(onDone, 1100); return () => clearTimeout(t) } }, [n, total, auto, onDone])
  let k = 0
  const show = () => n > k++
  return (
    <div className="ld-spec">
      <div className="ld-kicker">Product spec · generated</div>
      <div className={`ld-spec-h${show() ? ' in' : ''}`}><span className="ld-spec-emoji" style={{ background: scn.accent }}>{scn.emoji}</span><div><h3>{spec.appName}</h3><p>{spec.tagline}</p></div><span className="ld-tier">{spec.tier} · ${spec.setup.toLocaleString()} + ${spec.monthly}/mo</span></div>
      <div className="ld-spec-grid">
        <div className={`ld-spec-box${show() ? ' in' : ''}`}><h4>Users</h4><p>{spec.users}</p></div>
        <div className={`ld-spec-box${show() ? ' in' : ''}`}><h4>Stack</h4><div className="ld-tags">{spec.stack.map((s) => <span key={s}>{s}</span>)}</div></div>
        <div className={`ld-spec-box wide${show() ? ' in' : ''}`}><h4>Features</h4><ul>{spec.features.map((f) => <li key={f} className={show() ? 'in' : ''}>{f}</li>)}</ul></div>
        <div className={`ld-spec-box wide${n > 3 ? ' in' : ''}`}><h4>Screens</h4><ol>{spec.screens.map((s) => <li key={s} className={show() ? 'in' : ''}>{s}</li>)}</ol></div>
      </div>
      {n >= total && !auto && <button className="ld-next" onClick={onDone}>Build it →</button>}
    </div>
  )
}

function Build({ scn, auto, onDone }: { scn: Scenario; auto: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const total = scn.buildLog.length
  useEffect(() => { setStep(0) }, [scn])
  useEffect(() => { if (step >= total) return; const t = setTimeout(() => setStep((s) => s + 1), step === total - 1 ? 900 : 650); return () => clearTimeout(t) }, [step, total])
  useEffect(() => { if (step >= total && auto) { const t = setTimeout(onDone, 700); return () => clearTimeout(t) } }, [step, total, auto, onDone])
  const filesShown = Math.ceil((step / total) * scn.files.length)
  const pct = Math.round((step / total) * 100)
  return (
    <div className="ld-build">
      <div className="ld-files">
        <div className="ld-files-h">{scn.spec.appName.toLowerCase()}/</div>
        {scn.files.map((f, i) => <div key={f} className={`ld-file${i < filesShown ? ' in' : ''}`}><span className="ld-file-dot" />{f}</div>)}
      </div>
      <div className="ld-log">
        <div className="ld-progress"><div style={{ width: `${pct}%` }} /></div>
        <div className="ld-log-lines">
          {scn.buildLog.slice(0, step).map((l, i) => <div key={i} className="ld-log-line"><span>✓</span>{l}</div>)}
          {step < total && <div className="ld-log-line busy"><span className="ld-spin" />{scn.buildLog[step]}</div>}
        </div>
        {step >= total && !auto && <button className="ld-next" onClick={onDone}>Open the app →</button>}
      </div>
    </div>
  )
}

const fmtT = (s: number | null) => s === null || s < 5 ? 'under a minute' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Live({ spec, scn, screen, setScreen, onToast, onDone, builtAt }: { spec: Spec; scn: Scenario; screen: number; setScreen: (n: number) => void; onToast: (m: string) => void; onDone: () => void; builtAt: number | null }) {
  return (
    <div className="ld-live">
      <div className="ld-live-side">
        <div className="ld-kicker">Live · deployed</div>
        <h3>{spec.appName} is running.</h3>
        <p>Click around — this is a working prototype of the app {scn.owner.split(',')[0]} described, built in <b>{fmtT(builtAt)}</b>.</p>
        <div className="ld-screens">
          {spec.screens.map((s, i) => <button key={s} className={screen === i ? 'on' : ''} onClick={() => setScreen(i)}>{i + 1}. {s}</button>)}
        </div>
        <button className="ld-next" onClick={onDone}>See the result →</button>
      </div>
      <div className="ld-device">
        <div className="ld-device-bar"><i /><i /><i /><span>{spec.appName.toLowerCase()}.vbild.app</span></div>
        <div className="ld-device-screen"><MiniApp spec={spec} screen={screen} setScreen={setScreen} onToast={onToast} /></div>
      </div>
    </div>
  )
}

function Outro({ spec, scn, builtAt, onRestart, onBack }: { spec: Spec; scn: Scenario; builtAt: number | null; onRestart: () => void; onBack: () => void }) {
  return (
    <div className="ld-outro">
      <div className="ld-kicker">Result</div>
      <h2>{spec.appName} — built in <span style={{ color: scn.accent }}>{fmtT(builtAt)}</span>.</h2>
      <div className="ld-compare">
        <div className="ld-cmp agency"><small>Typical agency</small><b>{scn.agencyQuote}</b><span>Clutch 2025: median build $171K, avg project ~13 months</span></div>
        <div className="ld-cmp vbild" style={{ ['--acc' as string]: scn.accent }}><small>Vbild · {spec.tier}</small><b>${spec.setup.toLocaleString()} + ${spec.monthly}/mo</b><span>Live in days. You own the code. Priced like SaaS.</span></div>
      </div>
      <p className="ld-outro-note">In production this same flow runs for real: Bildr interviews the owner, Claude writes the spec, our team ships with AI and hands over the keys.</p>
      <div className="ld-outro-actions">
        <a className="ld-cta" href="https://cal.com/shayan-vbild/discovery-call" target="_blank" rel="noreferrer">Book a build call</a>
        <button className="ld-ghost" onClick={onBack}>← Back to the app</button>
        <button className="ld-ghost" onClick={onRestart}>Run another business</button>
      </div>
    </div>
  )
}

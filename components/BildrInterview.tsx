'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Types ─── */
type Role = 'user' | 'assistant'
interface Message { role: Role; content: string }
interface PRD {
  appName: string
  tagline: string
  archetype: string
  targetUser: string
  coreProblem: string
  features: string[]
  screens: string[]
  techStack: string[]
}

/* ─── Archetype configs ─── */
const ARCHETYPES: Record<string, {
  emoji: string
  color: string
  grad: string
  screens: Record<string, React.FC<{ prd: PRD; screen: number; setScreen: (n: number) => void }>>
}> = {
  marketplace: {
    emoji: '🛒',
    color: '#10b981',
    grad: 'linear-gradient(135deg, #10b981, #06b6d4)',
    screens: { 0: MarketplaceHome, 1: MarketplaceBrowse, 2: MarketplaceProduct },
  },
  saas: {
    emoji: '📊',
    color: '#6366f1',
    grad: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    screens: { 0: SaasDashboard, 1: SaasAnalytics, 2: SaasSettings },
  },
  social: {
    emoji: '💬',
    color: '#a855f7',
    grad: 'linear-gradient(135deg, #a855f7, #ec4899)',
    screens: { 0: SocialFeed, 1: SocialProfile, 2: SocialMessages },
  },
  ecommerce: {
    emoji: '🛍️',
    color: '#f59e0b',
    grad: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    screens: { 0: EcomStore, 1: EcomProduct, 2: EcomCart },
  },
  booking: {
    emoji: '📅',
    color: '#22d3ee',
    grad: 'linear-gradient(135deg, #22d3ee, #6366f1)',
    screens: { 0: BookingHome, 1: BookingCalendar, 2: BookingConfirm },
  },
  ondemand: {
    emoji: '🚀',
    color: '#84cc16',
    grad: 'linear-gradient(135deg, #84cc16, #10b981)',
    screens: { 0: OndemandHome, 1: OndemandTrack, 2: OndemandComplete },
  },
  content: {
    emoji: '🎥',
    color: '#f43f5e',
    grad: 'linear-gradient(135deg, #f43f5e, #a855f7)',
    screens: { 0: ContentHome, 1: ContentArticle, 2: ContentCreator },
  },
  internal: {
    emoji: '⚙️',
    color: '#64748b',
    grad: 'linear-gradient(135deg, #64748b, #475569)',
    screens: { 0: InternalTasks, 1: InternalDetail, 2: InternalReport },
  },
}

const BOOKING_URL = 'https://cal.com/shayan-vbild/discovery-call'

/* ─── Main Component ─── */
export default function BildrInterview() {
  const [phase, setPhase] = useState<'idle' | 'interview' | 'generating' | 'prototype' | 'cta'>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [prd, setPrd] = useState<PRD | null>(null)
  const [protoScreen, setProtoScreen] = useState(0)
  const [micAvailable, setMicAvailable] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [showGenBtn, setShowGenBtn] = useState(false)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const dgKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    if (messages.filter(m => m.role === 'user').length >= 5) {
      setShowGenBtn(true)
    }
  }, [messages])

  /* ─── Start interview ─── */
  const startInterview = async () => {
    setPhase('interview')
    setIsThinking(true)
    try {
      const res = await fetch('/api/bildr/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
      const data = await res.json()
      if (data.content) {
        setMessages([{ role: 'assistant', content: data.content }])
      } else {
        setMessages([{ role: 'assistant', content: "Hi! I'm Bildr. Tell me about the app you want to build — what problem does it solve?" }])
      }
    } catch {
      setMessages([{ role: 'assistant', content: "Hi! I'm Bildr. Tell me about the app you want to build — what problem does it solve?" }])
    }
    setIsThinking(false)
  }

  /* ─── Send message ─── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setTranscript('')
    setIsThinking(true)

    try {
      const res = await fetch('/api/bildr/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Got it! Keep going — tell me more about who will use this app." }])
    }
    setIsThinking(false)
  }, [messages])

  /* ─── Mic / Deepgram ─── */
  const startListening = async () => {
    if (!dgKey) {
      setIsListening(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsListening(true)

      // Audio level visualizer
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(buf)
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length
        setAudioLevel(avg / 128)
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()

      // Deepgram WebSocket
      const ws = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&language=en&interim_results=true&smart_format=true',
        ['token', dgKey]
      )
      wsRef.current = ws
      ws.onopen = () => {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRef.current = recorder
        recorder.ondataavailable = e => {
          if (ws.readyState === WebSocket.OPEN) ws.send(e.data)
        }
        recorder.start(250)
      }
      ws.onmessage = e => {
        const msg = JSON.parse(e.data)
        const t = msg?.channel?.alternatives?.[0]?.transcript
        if (t) setTranscript(t)
      }
    } catch {
      setMicAvailable(false)
      setIsListening(true)
    }
  }

  const stopListening = () => {
    setIsListening(false)
    cancelAnimationFrame(animFrameRef.current)
    setAudioLevel(0)
    mediaRef.current?.stop()
    wsRef.current?.close()
    if (transcript.trim()) {
      sendMessage(transcript)
    }
  }

  /* ─── Generate PRD ─── */
  const generatePRD = async () => {
    setPhase('generating')
    try {
      const res = await fetch('/api/bildr/prd', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      const data = await res.json()
      if (data.prd) {
        // Ensure archetype is valid
        const validArchetypes = Object.keys(ARCHETYPES)
        if (!validArchetypes.includes(data.prd.archetype)) {
          data.prd.archetype = 'saas'
        }
        setPrd(data.prd)
        setPhase('prototype')
      } else {
        // Fallback PRD
        setPrd(buildFallbackPRD(messages))
        setPhase('prototype')
      }
    } catch {
      setPrd(buildFallbackPRD(messages))
      setPhase('prototype')
    }
  }

  /* ─── Notify sales ─── */
  useEffect(() => {
    if (phase === 'cta' && prd) {
      fetch('/api/bildr/notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prd, calendarLink: BOOKING_URL }),
      }).catch(() => {})
    }
  }, [phase, prd])

  /* ─── Render ─── */
  return (
    <div className="bildr-wrap">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" className="bildr-idle"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}>
            <div className="bildr-orb" />
            <div className="bildr-badge">
              <span className="bildr-pulse" />
              AI-POWERED PRODUCT DESIGN
            </div>
            <h1 className="bildr-title">
              Describe your app.<br />
              <span className="bildr-title-grad">Watch it come to life.</span>
            </h1>
            <p className="bildr-sub">
              Bildr interviews you for 5 minutes, generates your Product Requirements Document, and renders a clickable prototype — all before you finish your coffee.
            </p>
            <div className="bildr-steps">
              {['Describe your idea', 'Bildr interviews you', 'Get your PRD + prototype'].map((s, i) => (
                <div key={i} className="bildr-step">
                  <div className="bildr-step-num">{i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <motion.button className="bildr-start-btn" onClick={startInterview}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Start with Bildr →
            </motion.button>
          </motion.div>
        )}

        {phase === 'interview' && (
          <motion.div key="interview" className="bildr-interview"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div className="bildr-header">
              <div className="bildr-avatar">B</div>
              <div>
                <div className="bildr-name">Bildr</div>
                <div className="bildr-status">
                  {isThinking ? <><span className="bildr-dot blink" />Thinking…</> : <><span className="bildr-dot active" />Ready</>}
                </div>
              </div>
              <div className="bildr-turn-count">
                {messages.filter(m => m.role === 'user').length}/5 turns
              </div>
            </div>

            {/* Messages */}
            <div className="bildr-messages">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div key={i} className={`bildr-msg bildr-msg--${m.role}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {m.role === 'assistant' && <div className="bildr-msg-avatar">B</div>}
                    <div className="bildr-msg-bubble">{m.content}</div>
                  </motion.div>
                ))}
                {isThinking && (
                  <motion.div key="thinking" className="bildr-msg bildr-msg--assistant"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="bildr-msg-avatar">B</div>
                    <div className="bildr-msg-bubble bildr-thinking">
                      <span /><span /><span />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {!isThinking && (
              <div className="bildr-input-area">
                {/* Live transcript display */}
                {isListening && transcript && (
                  <div className="bildr-transcript">{transcript}</div>
                )}

                {/* Voice bars */}
                {isListening && (
                  <div className="bildr-voice-vis">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="bildr-bar"
                        style={{ height: `${8 + Math.sin(Date.now() / 200 + i) * audioLevel * 32 + audioLevel * 16}px` }} />
                    ))}
                  </div>
                )}

                <div className="bildr-input-row">
                  {!isListening ? (
                    <>
                      <input
                        ref={inputRef}
                        className="bildr-input"
                        placeholder="Type your answer or tap the mic…"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                      />
                      <button className="bildr-mic-btn" onClick={startListening} title="Speak">
                        🎙️
                      </button>
                      <button className="bildr-send-btn" onClick={() => sendMessage(input)} disabled={!input.trim()}>
                        Send
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bildr-listening-label">
                        {micAvailable ? '🎙️ Listening…' : '📝 Speak (no mic — type instead)'}
                      </div>
                      <button className="bildr-stop-btn" onClick={stopListening}>
                        ⏹ Done
                      </button>
                    </>
                  )}
                </div>

                {showGenBtn && !isListening && (
                  <motion.button className="bildr-gen-btn" onClick={generatePRD}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    ✨ Generate My App
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {phase === 'generating' && (
          <motion.div key="generating" className="bildr-generating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bildr-gen-orb" />
            <div className="bildr-gen-spinner" />
            <h2 className="bildr-gen-title">Building your PRD…</h2>
            <p className="bildr-gen-sub">Analyzing your interview, selecting archetype, designing screens</p>
            <div className="bildr-gen-steps">
              {['Parsing interview', 'Classifying app type', 'Generating PRD', 'Selecting prototype'].map((s, i) => (
                <motion.div key={i} className="bildr-gen-step"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}>
                  <span className="bildr-gen-check">✓</span> {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'prototype' && prd && (
          <PrototypeView prd={prd} screen={protoScreen} setScreen={setProtoScreen} onCTA={() => setPhase('cta')} />
        )}

        {phase === 'cta' && prd && (
          <CTAView prd={prd} onBack={() => setPhase('prototype')} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Prototype View ─── */
function PrototypeView({ prd, screen, setScreen, onCTA }: { prd: PRD; screen: number; setScreen: (n: number) => void; onCTA: () => void }) {
  const arch = ARCHETYPES[prd.archetype] || ARCHETYPES.saas
  const ScreenComp = arch.screens[screen as 0 | 1 | 2] || arch.screens[0]

  return (
    <motion.div className="bildr-proto-wrap"
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>

      {/* Left: PRD summary */}
      <div className="bildr-prd-panel">
        <div className="bildr-prd-archetype" style={{ background: arch.grad }}>
          <span>{arch.emoji}</span> {prd.archetype.toUpperCase()}
        </div>
        <h2 className="bildr-prd-name">{prd.appName}</h2>
        <p className="bildr-prd-tagline">&quot;{prd.tagline}&quot;</p>

        <div className="bildr-prd-section">
          <div className="bildr-prd-label">Target User</div>
          <div className="bildr-prd-val">{prd.targetUser}</div>
        </div>
        <div className="bildr-prd-section">
          <div className="bildr-prd-label">Core Problem</div>
          <div className="bildr-prd-val">{prd.coreProblem}</div>
        </div>
        <div className="bildr-prd-section">
          <div className="bildr-prd-label">Key Features</div>
          <ul className="bildr-prd-features">
            {prd.features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
        <div className="bildr-prd-section">
          <div className="bildr-prd-label">Tech Stack</div>
          <div className="bildr-prd-chips">
            {(prd.techStack || ['Next.js', 'Supabase', 'Stripe']).map((t, i) => (
              <span key={i} className="bildr-chip">{t}</span>
            ))}
          </div>
        </div>

        <motion.button className="bildr-cta-btn" style={{ background: arch.grad }} onClick={onCTA}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          Book a Discovery Call →
        </motion.button>
      </div>

      {/* Right: Prototype phone */}
      <div className="bildr-phone-wrap">
        <div className="bildr-phone-label">INTERACTIVE PROTOTYPE</div>
        <div className="bildr-phone">
          <div className="bildr-phone-notch" />
          <div className="bildr-phone-screen">
            <ScreenComp prd={prd} screen={screen} setScreen={setScreen} />
          </div>
          <div className="bildr-phone-home-btn" />
        </div>
        {/* Screen nav tabs */}
        <div className="bildr-screen-tabs">
          {(prd.screens.length ? prd.screens : ['Home', 'Explore', 'Profile']).slice(0, 3).map((s, i) => (
            <button key={i} className={`bildr-screen-tab ${screen === i ? 'active' : ''}`}
              style={screen === i ? { background: arch.grad, color: '#fff', borderColor: 'transparent' } : {}}
              onClick={() => setScreen(i)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── CTA View ─── */
function CTAView({ prd, onBack }: { prd: PRD; onBack: () => void }) {
  const arch = ARCHETYPES[prd.archetype] || ARCHETYPES.saas
  return (
    <motion.div className="bildr-cta-wrap"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <div className="bildr-cta-icon" style={{ background: arch.grad }}>{arch.emoji}</div>
      <h2 className="bildr-cta-title">{prd.appName} is ready to build.</h2>
      <p className="bildr-cta-sub">
        Your PRD is complete. Book a 30-minute discovery call with Shayan — walk through your prototype together and get a build plan, timeline, and quote.
      </p>
      <div className="bildr-cta-value">
        <div className="bildr-value-item">
          <span className="bildr-value-icon">🗂️</span>
          <div>
            <div className="bildr-value-title">Your PRD</div>
            <div className="bildr-value-desc">Full spec delivered before the call</div>
          </div>
        </div>
        <div className="bildr-value-item">
          <span className="bildr-value-icon">📱</span>
          <div>
            <div className="bildr-value-title">Clickable prototype</div>
            <div className="bildr-value-desc">Screen-by-screen walkthrough</div>
          </div>
        </div>
        <div className="bildr-value-item">
          <span className="bildr-value-icon">⚡</span>
          <div>
            <div className="bildr-value-title">Build in days</div>
            <div className="bildr-value-desc">Not weeks or months</div>
          </div>
        </div>
      </div>
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
        <motion.button className="bildr-book-btn" style={{ background: arch.grad }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          📅 Book My Discovery Call
        </motion.button>
      </a>
      <button className="bildr-back-link" onClick={onBack}>← Back to prototype</button>
    </motion.div>
  )
}

/* ─── Fallback PRD ─── */
function buildFallbackPRD(messages: Message[]): PRD {
  const userWords = messages.filter(m => m.role === 'user').map(m => m.content).join(' ').toLowerCase()
  let archetype = 'saas'
  if (userWords.includes('marketplace') || userWords.includes('seller') || userWords.includes('buyer')) archetype = 'marketplace'
  else if (userWords.includes('social') || userWords.includes('feed') || userWords.includes('community')) archetype = 'social'
  else if (userWords.includes('shop') || userWords.includes('store') || userWords.includes('product')) archetype = 'ecommerce'
  else if (userWords.includes('book') || userWords.includes('appointment') || userWords.includes('schedule')) archetype = 'booking'
  else if (userWords.includes('deliver') || userWords.includes('ride') || userWords.includes('pickup')) archetype = 'ondemand'
  else if (userWords.includes('blog') || userWords.includes('article') || userWords.includes('content')) archetype = 'content'
  else if (userWords.includes('team') || userWords.includes('internal') || userWords.includes('workflow')) archetype = 'internal'
  return {
    appName: 'Your App',
    tagline: 'Built for you, by Vbild',
    archetype,
    targetUser: 'Your target users',
    coreProblem: 'The problem you described',
    features: ['Core feature 1', 'Core feature 2', 'Core feature 3', 'Core feature 4', 'Core feature 5'],
    screens: ['Home', 'Explore', 'Profile'],
    techStack: ['Next.js', 'Supabase', 'Stripe'],
  }
}

/* ══════════════════════════════════════════════════
   PROTOTYPE SCREENS — 8 archetypes × 3 screens each
══════════════════════════════════════════════════ */

type ScreenProps = { prd: PRD; screen: number; setScreen: (n: number) => void }

/* ── MARKETPLACE ── */
function MarketplaceHome({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: 'linear-gradient(160deg,#022c22,#064e3b)' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-search-bar">🔍 Search {prd.appName}…</div>
      <div className="ps-section-label">TRENDING</div>
      <div className="ps-grid-2">
        {['Digital Art', 'Handmade Crafts', 'Vintage Finds', 'Tech Gear'].map((c, i) => (
          <div key={i} className="ps-category-card" onClick={() => setScreen(1)}
            style={{ background: `hsl(${150 + i * 25},60%,${12 + i * 3}%)` }}>
            <span className="ps-cat-emoji">{['🎨','🧶','🏺','💻'][i]}</span>
            <span>{c}</span>
          </div>
        ))}
      </div>
      <div className="ps-section-label">FEATURED SELLERS</div>
      {['Crafts by Maria', 'TechVault Store'].map((s, i) => (
        <div key={i} className="ps-seller-row" onClick={() => setScreen(1)}>
          <div className="ps-seller-avatar" style={{ background: `hsl(${150 + i * 30},60%,30%)` }}>{s[0]}</div>
          <div><div className="ps-seller-name">{s}</div><div className="ps-seller-meta">⭐ 4.{8 + i} · {120 + i * 30} sales</div></div>
          <div className="ps-arrow">›</div>
        </div>
      ))}
    </div>
  )
}
function MarketplaceBrowse({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#022c22' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Browse</div>
      <div className="ps-search-bar active">🔍 Handmade jewelry…</div>
      <div className="ps-filter-row">
        {['All','Under $50','Top Rated','New'].map((f,i) => (
          <div key={i} className={`ps-filter-chip ${i===0?'active':''}`}>{f}</div>
        ))}
      </div>
      <div className="ps-grid-2">
        {[
          {n:'Silver Ring Set',p:'$24',r:'⭐ 4.9'},
          {n:'Gold Necklace',p:'$48',r:'⭐ 4.8'},
          {n:'Boho Bracelet',p:'$18',r:'⭐ 4.7'},
          {n:'Pearl Earrings',p:'$32',r:'⭐ 5.0'},
        ].map((item, i) => (
          <div key={i} className="ps-product-card" onClick={() => setScreen(2)}>
            <div className="ps-product-img" style={{ background: `hsl(${150+i*20},40%,20%)` }}>💎</div>
            <div className="ps-product-name">{item.n}</div>
            <div className="ps-product-row"><span className="ps-product-price">{item.p}</span><span className="ps-product-rating">{item.r}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
function MarketplaceProduct({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#022c22' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(1)}>‹ Results</div>
      <div className="ps-product-hero" style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)' }}>💎</div>
      <div className="ps-product-detail-name">Silver Ring Set</div>
      <div className="ps-product-detail-sub">by Crafts by Maria · ⭐ 4.9 (89 reviews)</div>
      <div className="ps-product-detail-price">$24.00</div>
      <div className="ps-product-detail-desc">Handcrafted sterling silver ring set. Available in sizes 5–10. Ships in 2–3 days.</div>
      <div className="ps-btn-row">
        <div className="ps-btn-outline">❤️ Save</div>
        <div className="ps-btn-solid" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>Add to Cart</div>
      </div>
    </div>
  )
}

/* ── SAAS ── */
function SaasDashboard({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0f172a' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-saas-header">
        <div className="ps-saas-logo" style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>{prd.appName[0]}</div>
        <div className="ps-saas-title">{prd.appName}</div>
        <div className="ps-saas-notif">🔔</div>
      </div>
      <div className="ps-kpi-grid">
        {[{l:'Total Users',v:'2,847',d:'+12%'},{l:'Active Today',v:'341',d:'+5%'},{l:'Revenue',v:'$18.4k',d:'+23%'},{l:'Churn',v:'1.2%',d:'-0.3%'}].map((k,i) => (
          <div key={i} className="ps-kpi-card" onClick={() => setScreen(1)}>
            <div className="ps-kpi-label">{k.l}</div>
            <div className="ps-kpi-value">{k.v}</div>
            <div className="ps-kpi-delta" style={{ color: k.d.startsWith('+') ? '#10b981' : '#f43f5e' }}>{k.d}</div>
          </div>
        ))}
      </div>
      <div className="ps-section-label" style={{ marginTop: 8 }}>RECENT ACTIVITY</div>
      {['New user: sarah@co.com','Payment received: $299','Feature request logged'].map((a,i) => (
        <div key={i} className="ps-activity-row">
          <div className="ps-activity-dot" style={{ background: ['#6366f1','#10b981','#f59e0b'][i] }} />
          <div className="ps-activity-text">{a}</div>
          <div className="ps-activity-time">{2+i}m</div>
        </div>
      ))}
    </div>
  )
}
function SaasAnalytics({ setScreen }: ScreenProps) {
  const bars = [40, 65, 55, 80, 70, 90, 75]
  return (
    <div className="ps-wrap" style={{ background: '#0f172a' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Dashboard</div>
      <div className="ps-page-title">Analytics</div>
      <div className="ps-tab-row">
        {['7D','30D','90D','1Y'].map((t,i) => (
          <div key={i} className={`ps-time-tab ${i===1?'active':''}`}>{t}</div>
        ))}
      </div>
      <div className="ps-chart-area">
        <div className="ps-chart-bars">
          {bars.map((h,i) => (
            <div key={i} className="ps-chart-bar-wrap">
              <div className="ps-chart-bar" style={{ height: `${h}%`, background: 'linear-gradient(0deg,#6366f1,#3b82f6)' }} />
            </div>
          ))}
        </div>
        <div className="ps-chart-labels">
          {['M','T','W','T','F','S','S'].map((d,i) => <span key={i}>{d}</span>)}
        </div>
      </div>
      <div className="ps-metric-list">
        {[{l:'Page Views',v:'12,450'},{l:'Avg Session',v:'4m 32s'},{l:'Bounce Rate',v:'28.4%'}].map((m,i) => (
          <div key={i} className="ps-metric-row">
            <span className="ps-metric-label">{m.l}</span>
            <span className="ps-metric-val">{m.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function SaasSettings({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0f172a' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Dashboard</div>
      <div className="ps-page-title">Settings</div>
      <div className="ps-settings-avatar">ST</div>
      {[{l:'Email',v:'shayan@vbild.ai'},{l:'Plan',v:'Pro · $99/mo'},{l:'Team',v:'4 members'},{l:'API Key',v:'sk-••••••••'}].map((s,i) => (
        <div key={i} className="ps-setting-row">
          <div className="ps-setting-label">{s.l}</div>
          <div className="ps-setting-val">{s.v} <span className="ps-arrow">›</span></div>
        </div>
      ))}
      <div className="ps-btn-solid" style={{ marginTop: 12, background: 'linear-gradient(135deg,#6366f1,#3b82f6)', textAlign: 'center', borderRadius: 8, padding: '10px', fontSize: '12px', cursor: 'pointer' }}>
        Save Changes
      </div>
    </div>
  )
}

/* ── SOCIAL ── */
function SocialFeed({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0d0118' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-social-header">
        <div className="ps-social-logo" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>{prd.appName[0]}</div>
        <div className="ps-social-title">{prd.appName}</div>
        <div>🔔</div>
      </div>
      <div className="ps-stories-row">
        {['You','Alex','Sam','Jordan'].map((u,i) => (
          <div key={i} className="ps-story">
            <div className="ps-story-ring" style={{ background: i===0?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#a855f7,#ec4899)' }}>
              <div className="ps-story-avatar">{u[0]}</div>
            </div>
            <div className="ps-story-name">{u}</div>
          </div>
        ))}
      </div>
      {[{u:'Alex Chen',t:'Just shipped a new feature 🚀 Really excited about this one!',l:42,c:8},{u:'Sam Rivera',t:'Morning run done ✅ Nothing beats the early hours for focus',l:89,c:15}].map((p,i) => (
        <div key={i} className="ps-post" onClick={() => setScreen(1)}>
          <div className="ps-post-header">
            <div className="ps-post-avatar" style={{ background: `hsl(${270+i*30},60%,35%)` }}>{p.u[0]}</div>
            <div><div className="ps-post-name">{p.u}</div><div className="ps-post-time">{2+i}h ago</div></div>
          </div>
          <div className="ps-post-text">{p.t}</div>
          <div className="ps-post-actions">
            <span>❤️ {p.l}</span><span>💬 {p.c}</span><span>↗️ Share</span>
          </div>
        </div>
      ))}
    </div>
  )
}
function SocialProfile({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0d0118' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Feed</div>
      <div className="ps-profile-header">
        <div className="ps-profile-pic" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>AC</div>
        <div className="ps-profile-name">Alex Chen</div>
        <div className="ps-profile-bio">Builder · Creator · Coffee addict ☕</div>
      </div>
      <div className="ps-profile-stats">
        {[{l:'Posts',v:'142'},{l:'Followers',v:'2.4k'},{l:'Following',v:'389'}].map((s,i) => (
          <div key={i} className="ps-profile-stat"><div className="ps-stat-val">{s.v}</div><div className="ps-stat-label">{s.l}</div></div>
        ))}
      </div>
      <div className="ps-profile-btn" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>Follow</div>
      <div className="ps-post-grid">
        {Array.from({length:6}).map((_,i) => (
          <div key={i} className="ps-post-thumb" style={{ background: `hsl(${270+i*20},40%,${15+i*3}%)` }} />
        ))}
      </div>
    </div>
  )
}
function SocialMessages({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0d0118' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Feed</div>
      <div className="ps-page-title">Messages</div>
      {[{u:'Sam Rivera',m:'Hey! Loved your last post 🔥',t:'2m',unread:true},{u:'Jordan Kim',m:'Are you coming to the meetup?',t:'1h',unread:false},{u:'Alex Chen',m:'Thanks for the follow!',t:'3h',unread:false}].map((c,i) => (
        <div key={i} className="ps-convo-row">
          <div className="ps-convo-avatar" style={{ background: `hsl(${270+i*30},60%,30%)` }}>{c.u[0]}</div>
          <div className="ps-convo-body">
            <div className="ps-convo-name">{c.u}{c.unread && <span className="ps-unread-dot" />}</div>
            <div className="ps-convo-preview">{c.m}</div>
          </div>
          <div className="ps-convo-time">{c.t}</div>
        </div>
      ))}
    </div>
  )
}

/* ── ECOMMERCE ── */
function EcomStore({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#1a0a00' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-ecom-header">
        <div className="ps-ecom-logo">{prd.appName}</div>
        <div>🛒 3</div>
      </div>
      <div className="ps-search-bar">🔍 Search products…</div>
      <div className="ps-ecom-banner" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
        <div className="ps-banner-title">Summer Sale</div>
        <div className="ps-banner-sub">Up to 40% off</div>
      </div>
      <div className="ps-grid-2" style={{ marginTop: 8 }}>
        {[{n:'Wireless Buds',p:'$49',old:'$79'},{n:'Smart Watch',p:'$129',old:'$199'},{n:'Phone Stand',p:'$19',old:'$29'},{n:'LED Lamp',p:'$35',old:'$55'}].map((item,i) => (
          <div key={i} className="ps-product-card" onClick={() => setScreen(1)}>
            <div className="ps-product-img" style={{ background: `hsl(${30+i*20},60%,20%)` }}>{'📦'}</div>
            <div className="ps-product-name">{item.n}</div>
            <div className="ps-product-row">
              <span className="ps-product-price">{item.p}</span>
              <span style={{ fontSize: 9, color: '#64748b', textDecoration: 'line-through' }}>{item.old}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
function EcomProduct({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#1a0a00' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Store</div>
      <div className="ps-product-hero" style={{ background: 'linear-gradient(135deg,#92400e,#b45309)' }}>🎧</div>
      <div className="ps-product-detail-name">Wireless Buds Pro</div>
      <div className="ps-product-detail-sub">⭐ 4.8 · 234 reviews · In stock</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
        <div className="ps-product-detail-price">$49</div>
        <div style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>$79</div>
        <div style={{ fontSize: 10, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>-38%</div>
      </div>
      <div className="ps-product-detail-desc">True wireless. 30hr battery. ANC. Comfortable fit for all-day wear.</div>
      <div className="ps-size-row">
        {['White','Black','Blue'].map((c,i) => (
          <div key={i} className="ps-color-chip" style={{ background: ['#f8fafc','#1e293b','#1d4ed8'][i], border: i===0?'2px solid #f59e0b':'2px solid transparent' }} />
        ))}
      </div>
      <div className="ps-btn-row">
        <div className="ps-btn-outline">❤️</div>
        <div className="ps-btn-solid" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', flex: 1 }} onClick={() => setScreen(2)}>Add to Cart</div>
      </div>
    </div>
  )
}
function EcomCart({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#1a0a00' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(1)}>‹ Product</div>
      <div className="ps-page-title">Your Cart (2)</div>
      {[{n:'Wireless Buds Pro',p:'$49',qty:1},{n:'Phone Stand',p:'$19',qty:2}].map((item,i) => (
        <div key={i} className="ps-cart-row">
          <div className="ps-cart-img" style={{ background: `hsl(${30+i*20},60%,20%)` }}>{'📦'}</div>
          <div className="ps-cart-info"><div className="ps-cart-name">{item.n}</div><div className="ps-cart-price">{item.p}</div></div>
          <div className="ps-qty-ctrl"><span>−</span><span>{item.qty}</span><span>+</span></div>
        </div>
      ))}
      <div className="ps-order-summary">
        <div className="ps-summary-row"><span>Subtotal</span><span>$87</span></div>
        <div className="ps-summary-row"><span>Shipping</span><span style={{ color: '#10b981' }}>Free</span></div>
        <div className="ps-summary-row" style={{ fontWeight: 700 }}><span>Total</span><span>$87</span></div>
      </div>
      <div className="ps-btn-solid" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', textAlign: 'center', borderRadius: 8, padding: 10, fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
        Checkout →
      </div>
    </div>
  )
}

/* ── BOOKING ── */
function BookingHome({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#001a2e' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-booking-header" style={{ background: 'linear-gradient(135deg,#22d3ee,#6366f1)', padding: '12px', borderRadius: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{prd.appName}</div>
        <div style={{ fontSize: 10, opacity: 0.8 }}>Book your appointment</div>
      </div>
      <div className="ps-section-label">SERVICES</div>
      {[{n:'30 Min Consultation',p:'Free',d:'Video call'},{n:'1-Hour Deep Dive',p:'$150',d:'In person or video'},{n:'90 Min Workshop',p:'$250',d:'Group session'}].map((s,i) => (
        <div key={i} className="ps-service-row" onClick={() => setScreen(1)}>
          <div className="ps-service-icon" style={{ background: `hsl(${190+i*20},70%,20%)` }}>{'📋'}</div>
          <div><div className="ps-service-name">{s.n}</div><div className="ps-service-meta">{s.d}</div></div>
          <div className="ps-service-price">{s.p} <span>›</span></div>
        </div>
      ))}
    </div>
  )
}
function BookingCalendar({ setScreen }: ScreenProps) {
  const days = [14,15,16,17,18,19,20]
  const times = ['9:00am','10:00am','11:00am','2:00pm','3:00pm']
  return (
    <div className="ps-wrap" style={{ background: '#001a2e' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Services</div>
      <div className="ps-page-title">Pick a time</div>
      <div className="ps-cal-row">
        {days.map((d,i) => (
          <div key={i} className={`ps-cal-day ${d===18?'active':''}`} style={d===18?{background:'linear-gradient(135deg,#22d3ee,#6366f1)'}:{}}>
            <div className="ps-cal-weekday">{['M','T','W','T','F','S','S'][i]}</div>
            <div className="ps-cal-num">{d}</div>
          </div>
        ))}
      </div>
      <div className="ps-section-label">AVAILABLE TIMES</div>
      <div className="ps-times-grid">
        {times.map((t,i) => (
          <div key={i} className={`ps-time-slot ${i===1?'active':''}`}
            style={i===1?{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'#fff',borderColor:'transparent'}:{}}
            onClick={() => setScreen(2)}>{t}</div>
        ))}
      </div>
    </div>
  )
}
function BookingConfirm({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#001a2e' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(1)}>‹ Calendar</div>
      <div className="ps-confirm-icon">✅</div>
      <div className="ps-confirm-title">Booking Confirmed!</div>
      <div className="ps-confirm-card" style={{ border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.05)', borderRadius: 10, padding: 12, margin: '10px 0' }}>
        <div className="ps-confirm-row"><span>Service</span><span>30 Min Consultation</span></div>
        <div className="ps-confirm-row"><span>Date</span><span>Jun 18, 2026</span></div>
        <div className="ps-confirm-row"><span>Time</span><span>10:00am PST</span></div>
        <div className="ps-confirm-row"><span>Format</span><span>Google Meet</span></div>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Confirmation sent to your email</div>
    </div>
  )
}

/* ── ON-DEMAND ── */
function OndemandHome({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#001200' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div style={{ padding: '8px', background: 'rgba(132,204,22,0.1)', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📍</span><span style={{ fontSize: 11 }}>123 Main St, San Francisco</span>
      </div>
      <div className="ps-map-placeholder" style={{ background: 'linear-gradient(135deg,#052e16,#064e3b)', height: 100, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 10 }}>
        🗺️
      </div>
      <div className="ps-section-label">ORDER AGAIN</div>
      {[{n:'Burrito Bowl',r:'5 min',p:'$12'},{n:'Green Smoothie',r:'3 min',p:'$8'}].map((item,i) => (
        <div key={i} className="ps-service-row" onClick={() => setScreen(1)}>
          <div className="ps-service-icon" style={{ background: `hsl(${120+i*20},60%,15%)` }}>{'🍱'}</div>
          <div><div className="ps-service-name">{item.n}</div><div className="ps-service-meta">⏱ {item.r} · {item.p}</div></div>
          <div className="ps-service-price">Order <span>›</span></div>
        </div>
      ))}
      <div className="ps-btn-solid" style={{ background: 'linear-gradient(135deg,#84cc16,#10b981)', textAlign: 'center', borderRadius: 8, padding: 10, fontSize: 12, cursor: 'pointer', marginTop: 8 }} onClick={() => setScreen(1)}>
        🚀 New Order
      </div>
    </div>
  )
}
function OndemandTrack({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#001200' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Home</div>
      <div className="ps-page-title">Order Tracking</div>
      <div className="ps-map-placeholder" style={{ background: 'linear-gradient(135deg,#052e16,#064e3b)', height: 120, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 10 }}>
        🏍️→🏠
      </div>
      <div className="ps-track-steps">
        {[{l:'Order confirmed',done:true},{l:'Being prepared',done:true},{l:'On the way',done:true},{l:'Delivered',done:false}].map((s,i) => (
          <div key={i} className="ps-track-step">
            <div className="ps-track-dot" style={{ background: s.done ? 'linear-gradient(135deg,#84cc16,#10b981)' : 'rgba(255,255,255,0.1)' }}>
              {s.done ? '✓' : ''}
            </div>
            <div className="ps-track-label" style={{ opacity: s.done ? 1 : 0.4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="ps-eta-badge" style={{ background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.3)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#84cc16' }}>3 min</div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>Estimated arrival</div>
      </div>
    </div>
  )
}
function OndemandComplete({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#001200', alignItems: 'center', textAlign: 'center' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div style={{ fontSize: 48, marginTop: 20 }}>🎉</div>
      <div className="ps-confirm-title" style={{ marginTop: 8 }}>Order Delivered!</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Your order arrived at 9:44 AM</div>
      <div style={{ background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.3)', borderRadius: 10, padding: 12, width: '100%', textAlign: 'left' }}>
        <div style={{ fontSize: 10, color: '#84cc16', marginBottom: 6 }}>RATE YOUR EXPERIENCE</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', fontSize: 20 }}>
          {'⭐⭐⭐⭐⭐'.split('').map((s,i) => <span key={i}>{s}</span>)}
        </div>
      </div>
      <div className="ps-btn-solid" style={{ background: 'linear-gradient(135deg,#84cc16,#10b981)', borderRadius: 8, padding: '10px 20px', fontSize: 12, marginTop: 12, cursor: 'pointer' }} onClick={() => setScreen(0)}>
        Order Again
      </div>
    </div>
  )
}

/* ── CONTENT ── */
function ContentHome({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#1a0010' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#f43f5e,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{prd.appName}</div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>🔔 ⚙️</div>
      </div>
      <div className="ps-featured-card" style={{ background: 'linear-gradient(135deg,#4a0020,#2d0040)', borderRadius: 10, padding: 12, marginBottom: 12 }} onClick={() => setScreen(1)}>
        <div style={{ fontSize: 9, color: '#f43f5e', fontWeight: 700, marginBottom: 4 }}>FEATURED · 5 min read</div>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>The Future of AI-First Products in 2026</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>S</div>
          <span style={{ fontSize: 9, color: '#94a3b8' }}>Sarah Kim · 2.4k reads</span>
        </div>
      </div>
      <div className="ps-section-label">TRENDING</div>
      {['Building in Public: 90 Days Later','Why Developers Choose Edge Functions'].map((title,i) => (
        <div key={i} className="ps-article-row" onClick={() => setScreen(1)}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{3+i} min · {890+i*200} views</div>
          </div>
          <div className="ps-article-thumb" style={{ background: `hsl(${320+i*30},50%,20%)` }} />
        </div>
      ))}
    </div>
  )
}
function ContentArticle({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#1a0010' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Home</div>
      <div style={{ padding: '8px 0' }}>
        <div style={{ fontSize: 9, color: '#f43f5e', fontWeight: 700, marginBottom: 6 }}>PRODUCT · 5 min read</div>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, marginBottom: 10 }}>The Future of AI-First Products in 2026</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>S</div>
          <div><div style={{ fontSize: 10, fontWeight: 600 }}>Sarah Kim</div><div style={{ fontSize: 9, color: '#94a3b8' }}>Jun 17 · 2,419 reads</div></div>
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
          {`AI is no longer a feature — it’s the foundation. The products winning in 2026 didn’t bolt on AI; they were designed around it from day one. Here’s what that looks like in practice…`}
        </div>
        <div style={{ borderLeft: '2px solid #f43f5e', paddingLeft: 8, margin: '10px 0', fontSize: 10, color: '#e2e8f0', fontStyle: 'italic' }}>
          {`"The best AI products don't feel like AI. They feel like magic."`}
        </div>
      </div>
      <div className="ps-article-actions">
        <span>❤️ 142</span><span>💬 23</span><span>🔖 Save</span>
      </div>
    </div>
  )
}
function ContentCreator({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#1a0010' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(1)}>‹ Article</div>
      <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 6px' }}>S</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Sarah Kim</div>
        <div style={{ fontSize: 9, color: '#94a3b8' }}>Product Designer · AI Researcher</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '8px 0' }}>
          {[{l:'Articles',v:'48'},{l:'Followers',v:'12k'},{l:'Reads',v:'89k'}].map((s,i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.v}</div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="ps-btn-solid" style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', display: 'inline-block', borderRadius: 6, padding: '6px 20px', fontSize: 11 }}>Follow</div>
      </div>
    </div>
  )
}

/* ── INTERNAL ── */
function InternalTasks({ prd, setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0d1117' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{prd.appName}</div>
        <div style={{ fontSize: 18 }}>⊕</div>
      </div>
      <div className="ps-filter-row" style={{ marginBottom: 10 }}>
        {['All','In Progress','Review','Done'].map((f,i) => (
          <div key={i} className={`ps-filter-chip ${i===0?'active':''}`}>{f}</div>
        ))}
      </div>
      {[{t:'Design system audit',s:'In Progress',a:'ST',p:'High'},{t:'API rate limit fix',s:'Review',a:'AC',p:'Critical'},{t:'Q2 analytics report',s:'Done',a:'JK',p:'Med'}].map((task,i) => (
        <div key={i} className="ps-task-row" onClick={() => setScreen(1)}>
          <div className="ps-task-status-dot" style={{ background: ['#f59e0b','#6366f1','#10b981'][i] }} />
          <div className="ps-task-body">
            <div className="ps-task-title">{task.t}</div>
            <div className="ps-task-meta">{task.s} · {task.a}</div>
          </div>
          <div className="ps-priority-badge" style={{ background: ['rgba(245,158,11,0.15)','rgba(239,68,68,0.15)','rgba(100,116,139,0.15)'][i], color: ['#f59e0b','#ef4444','#64748b'][i] }}>
            {task.p}
          </div>
        </div>
      ))}
    </div>
  )
}
function InternalDetail({ setScreen }: ScreenProps) {
  return (
    <div className="ps-wrap" style={{ background: '#0d1117' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Tasks</div>
      <div style={{ padding: '8px 0' }}>
        <div style={{ fontSize: 9, background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'inline-block', padding: '2px 8px', borderRadius: 4, marginBottom: 8 }}>CRITICAL</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>API rate limit fix</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>Assigned to Alex Chen · Due Jun 20</div>
        <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
          Users hitting rate limits during peak hours. Need to implement request queuing + exponential backoff. Also add monitoring alerts.
        </div>
        <div style={{ fontSize: 9, color: '#6366f1', marginBottom: 6 }}>COMMENTS (3)</div>
        {['Started on the queue impl','Rate of 500 req/min should work','Need to test under load'].map((c,i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 10, color: '#94a3b8' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: `hsl(${220+i*30},60%,30%)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>{['A','S','J'][i]}</div>
            <span>{c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function InternalReport({ setScreen }: ScreenProps) {
  const bars = [55, 70, 45, 85, 65, 90, 50]
  return (
    <div className="ps-wrap" style={{ background: '#0d1117' }}>
      <div className="ps-status-bar"><span>9:41</span><span>●●●</span></div>
      <div className="ps-nav-back" onClick={() => setScreen(0)}>‹ Tasks</div>
      <div className="ps-page-title">Team Report · Q2</div>
      <div className="ps-kpi-grid">
        {[{l:'Completed',v:'47'},{l:'In Progress',v:'12'},{l:'Velocity',v:'8.4'},{l:'On Time',v:'94%'}].map((k,i) => (
          <div key={i} className="ps-kpi-card">
            <div className="ps-kpi-label">{k.l}</div>
            <div className="ps-kpi-value">{k.v}</div>
          </div>
        ))}
      </div>
      <div className="ps-chart-area">
        <div className="ps-chart-bars">
          {bars.map((h,i) => (
            <div key={i} className="ps-chart-bar-wrap">
              <div className="ps-chart-bar" style={{ height: `${h}%`, background: 'linear-gradient(0deg,#64748b,#94a3b8)' }} />
            </div>
          ))}
        </div>
        <div className="ps-chart-labels">
          {['W1','W2','W3','W4','W5','W6','W7'].map((d,i) => <span key={i}>{d}</span>)}
        </div>
      </div>
    </div>
  )
}

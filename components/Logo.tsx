'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Vbild mark: three isometric blocks forming a V. Inline SVG so it scales crisply and themes with CSS. */
export function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="10 8 52 54" aria-hidden focusable="false">
      <path d="M14 18l12-7 12 7-12 7z" fill="#a78bfa" /><path d="M14 18v14l12 7V25z" fill="#5b21b6" /><path d="M38 18v14l-12 7V25z" fill="#7c3aed" />
      <path d="M34 18l12-7 12 7-12 7z" fill="#818cf8" /><path d="M34 18v14l12 7V25z" fill="#3730a3" /><path d="M58 18v14l-12 7V25z" fill="#4f46e5" />
      <path d="M24 38l12-7 12 7-12 7z" fill="#c4b5fd" /><path d="M24 38v14l12 7V45z" fill="#6d28d9" /><path d="M48 38v14l-12 7V45z" fill="#8b5cf6" />
    </svg>
  )
}

export default function Logo({ href = '/', size = 28, wordmark = true, className = '' }: { href?: string | null; size?: number; wordmark?: boolean; className?: string }) {
  const inner = (
    <span className={`logo ${className}`}>
      <Mark size={size} />
      {wordmark && <span className="logo-word">Vbild</span>}
    </span>
  )
  const path = usePathname()
  if (!href) return inner
  const onClick = (e: React.MouseEvent) => { if (href === '/' && path === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); window.history.replaceState(null, '', '/') } }
  return <Link href={href} className="logo-link" aria-label="Vbild home" onClick={onClick}>{inner}</Link>
}

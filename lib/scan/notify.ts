import nodemailer from 'nodemailer'
import type { Lead } from './db'
import type { Scan } from './types'

const TO = process.env.LEAD_NOTIFY_EMAIL || 'shayan.s.toor@gmail.com'

export async function notifyLead(lead: Lead, scan: Scan, origin: string) {
  const r = scan.report
  const url = `${origin}/admin/leads`
  const text = `New Vbild Scan lead
${lead.name} · ${lead.phone ?? ''} · ${lead.email ?? ''}
${r?.businessName ?? scan.input} · ${r?.categoryId ?? ''}/${r?.subVertical ?? ''} · score ${scan.score ?? '—'}
Top opportunity: ${r?.opportunities[0]?.title ?? '—'} (${r?.opportunities[0]?.tier ?? ''})
${lead.note ? `Note: ${lead.note}\n` : ''}Report: ${origin}/scan/${scan.id}
Admin: ${url}`
  // SMS via Twilio if configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM && process.env.LEAD_NOTIFY_PHONE) {
    try {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: process.env.TWILIO_FROM, To: process.env.LEAD_NOTIFY_PHONE, Body: text.slice(0, 1500) }),
      })
    } catch { /* best effort */ }
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
      const t = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } })
      await t.sendMail({ from: process.env.GMAIL_USER, to: TO, subject: `Scan lead · ${r?.businessName ?? scan.input} · ${lead.name}`, text })
    } catch { /* best effort */ }
  } else {
    console.log('[lead]', text)
  }
}

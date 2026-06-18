import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { prd, calendarLink } = await req.json()

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS

  if (!gmailUser || !gmailPass) {
    // Silent fail — don't block the user experience
    console.warn('Gmail credentials not configured, skipping notification')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  const featureList = (prd.features || []).map((f: string) => `  • ${f}`).join('\n')

  const text = `
🎯 NEW BILDR LEAD — ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}

App Name: ${prd.appName}
Tagline: ${prd.tagline}
Archetype: ${prd.archetype}
Target User: ${prd.targetUser}
Core Problem: ${prd.coreProblem}

Key Features:
${featureList}

Screens: ${(prd.screens || []).join(', ')}
Tech Stack: ${(prd.techStack || []).join(', ')}

${calendarLink ? `📅 Booking link shown: ${calendarLink}` : ''}

---
This lead came through the Bildr voice intake at vbild.ai/start
  `.trim()

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#06060e;color:#f8fafc;padding:32px;border-radius:12px">
  <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:2px;border-radius:10px;margin-bottom:24px">
    <div style="background:#06060e;border-radius:8px;padding:20px">
      <h1 style="margin:0;font-size:24px;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">🎯 New Bildr Lead</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</p>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;color:#94a3b8;font-size:13px;width:140px">App Name</td><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;font-weight:700;font-size:18px">${prd.appName}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;color:#94a3b8;font-size:13px">Tagline</td><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;font-style:italic">${prd.tagline}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;color:#94a3b8;font-size:13px">Archetype</td><td style="padding:10px 0;border-bottom:1px solid #1e1e3a"><span style="background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);padding:2px 10px;border-radius:999px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em">${prd.archetype}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;color:#94a3b8;font-size:13px">Target User</td><td style="padding:10px 0;border-bottom:1px solid #1e1e3a">${prd.targetUser}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e3a;color:#94a3b8;font-size:13px">Core Problem</td><td style="padding:10px 0;border-bottom:1px solid #1e1e3a">${prd.coreProblem}</td></tr>
  </table>

  <div style="margin-top:20px">
    <p style="color:#94a3b8;font-size:13px;margin-bottom:10px">KEY FEATURES</p>
    <ul style="margin:0;padding:0 0 0 20px">
      ${(prd.features || []).map((f: string) => `<li style="padding:4px 0;color:#e2e8f0">${f}</li>`).join('')}
    </ul>
  </div>

  ${calendarLink ? `
  <div style="margin-top:24px;padding:16px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px">
    <p style="margin:0;font-size:14px">📅 Booking link was shown — <strong>follow up now</strong></p>
  </div>` : ''}

  <p style="margin-top:24px;font-size:12px;color:#64748b">Lead source: vbild.ai/start — Bildr voice intake</p>
</div>
  `.trim()

  await transporter.sendMail({
    from: `"Bildr" <${gmailUser}>`,
    to: 'shayan.s.toor@gmail.com',
    subject: `🎯 New Bildr Lead: ${prd.appName} (${prd.archetype})`,
    text,
    html,
  })

  return NextResponse.json({ ok: true })
}

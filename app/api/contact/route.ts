import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Set these in Vercel → Project → Settings → Environment Variables:
//   GMAIL_USER        e.g. hello@vbild.ai  (or your Gmail address)
//   GMAIL_APP_PASSWORD  your 16-char Gmail App Password
//     → myaccount.google.com → Security → 2-Step Verification → App passwords

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, message } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    await transporter.sendMail({
      from: `"Vbild Contact Form" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New lead from vbild.ai${name ? ` — ${name}` : ''}`,
      text: `Email: ${email}\nName: ${name || '—'}\n\n${message || '(no message)'}`,
      html: `
        <h2>New contact from vbild.ai</h2>
        <p><strong>Email:</strong> ${email}</p>
        ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
        ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

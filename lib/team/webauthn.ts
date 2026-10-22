/** Relying-party identity derived from the request so the same code works on vbild.ai, www.vbild.ai, previews and localhost. */
export function rp(req: Request) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000').split(',')[0].trim()
  const hostname = host.split(':')[0]
  const rpID = hostname.endsWith('vbild.ai') ? 'vbild.ai' : hostname
  const proto = hostname === 'localhost' ? 'http' : 'https'
  return { rpID, rpName: 'Vbild Team', origin: `${proto}://${host}` }
}

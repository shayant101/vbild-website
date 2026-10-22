import { NextResponse } from 'next/server'
/** Password login was replaced by passkeys (Oct 2026). Kept so old bookmarks get a clear answer. */
export async function POST() { return NextResponse.json({ error: 'Password sign-in has been retired. Use your passkey, or an invite link to enrol.' }, { status: 410 }) }

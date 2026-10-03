# Vbild v2 — handoff (Oct 2–3, 2026)

**Branch:** `v2` on github.com/shayant101/vbild-website (production `main` is untouched; live vbild.ai still serves the previous version).
**Preview:** every push to `v2` deploys to Vercel. Stable URL: https://vbild-git-v2-shayans-projects-401c4a5f.vercel.app (requires your Vercel login — preview protection is on; custom domains are exempt).
**Go live:** open a PR `v2 → main` and merge. Vercel deploys `main` to vbild.ai automatically.

## What's new

| Route | What it is |
|---|---|
| `/` | Rewritten homepage: new hero + proof strip, embedded live demo, sourced "Why now", real portfolio (from `lib/data/portfolio.ts`), founder section, investor strip. Nav: Demo · Work · How it works · Pricing · Investors · New World · Book a call. |
| `/demo` | Full-screen presenter demo. 4 scenarios (restaurant, smoke shop, VR arena, ranch): interview → spec → build → **interactive prototype** → result. Keys `1–4`, `→`/space, `←`, `A` auto, `R` restart, `F` fullscreen. Works with no API key; set `ANTHROPIC_API_KEY` to let Claude write the spec from any typed description. |
| `/investors` | Thesis, bottoms-up TAM/SAM/SOM with every source, business model, competitive quad, GTM, the ask. `noindex`. |
| `/admin` | Team portal. Overview KPIs, projects (+ detail pages), agents stream (10 agents), investor room (shows which numbers still need verifying). Env-var login — see below. |

Investor deck: `investor-materials/Vbild-PreSeed-Deck.pptx` (+ PDF, + the generator script). 16 slides, every market figure cited; company metrics you must confirm are tagged **VERIFY** in yellow.

## Before anything goes external — 3 things only you can do

1. **Vercel env vars** (Project → Settings → Environment Variables; add to Production *and* Preview):
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (32+ random chars) → enables `/admin`.
   - `ANTHROPIC_API_KEY` → enables Bildr (`/start`) and live mode on `/demo`.
   - `NEXT_PUBLIC_DEEPGRAM_API_KEY`, `GMAIL_USER`, `GMAIL_PASS` → Bildr voice + sales emails + contact form.
   None of these exist on Vercel today, so `/start` and the contact form are non-functional on the live site too.
2. **Fill the traction numbers** in `lib/data/market.json → company.traction` (paying customers, MRR, pipeline, exact days-to-ship). The homepage, `/investors` and the deck read from this one file. Re-run `node investor-materials/build-deck.js` (from the repo root, it reads `lib/data/market.json`) to regenerate the deck.
3. **Confirm the public claims**: "5 apps live", "3–21 days to ship", client names shown publicly (OC Smoke Shack, SN Ranch, Odyssey VR Arena). Flip `public: false` in `portfolio.ts` for anything a client hasn't approved.

## Research used (sourced, in `docs/research/README.md` and `lib/data/market.json`)
- YC W27 deadline **Nov 2, 2026 8pm PT**; four batches/yr; relevant RFS "A Cloud for Small Software" + "AI-Native Service Companies".
- Pre-seed norms (Carta): median SAFE cap $10M for $250K–$1M; 49% of pre-seed $ → AI (H1 2026).
- TAM $4.4B (968K US businesses × $4.5K ACV) · SAM $1.4B · SOM $2.7M base case (600 customers, yr 3).

## Also fixed on `main` tonight
Restored the New World / theme-toggle / light-theme CSS that an earlier Bildr commit had overwritten, fixed the hero typewriter clipping, upgraded Next.js 15.3.9 → 15.5.18 (May 2026 security release).

## Security notes
The GitHub token you pasted in chat is still active — delete it at github.com/settings/tokens when this work is done. The old Vercel token from a prior session has expired. `.env.local` (local test creds) is gitignored and only on your machine.

# Vbild admin portal (/admin)

**Login:** email + password from environment variables. Set in Vercel → Project → Settings → Environment Variables (Production + Preview):

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` | the team login email |
| `ADMIN_PASSWORD` | the team password (use a long one; rotate when someone leaves) |
| `ADMIN_SESSION_SECRET` | 32+ random chars; signs the session cookie (`openssl rand -base64 32`) |

Sessions are HS256 JWTs in an httpOnly cookie (`vbild_admin`, 7 days). `middleware.ts` protects `/admin/*`. Login is rate-limited to 10 attempts / 15 min / IP.

**Data lives in code** (no database yet):
- `lib/data/portfolio.ts` — projects. `public: true` → shown on the marketing site.
- `lib/data/agents.ts` — the agents stream.
- `lib/data/market.json` — every number on `/investors` and in the deck, with sources. `company.traction.*` fields marked `verify: true` must be filled in before the deck goes to investors.

Editing any of these files and pushing redeploys the site; admin, homepage, investors page and the deck generator (`investor-materials/build-deck.js`) all read the same data.

**Upgrade path:** when the team needs to edit without a deploy, move `PROJECTS` and `AGENTS` into Supabase tables with the same shape, swap the two imports for a fetch, and add Google sign-in via NextAuth. Nothing else changes.

## Live demo (/demo)
Runs fully scripted with no keys. Set `ANTHROPIC_API_KEY` in Vercel to enable live mode (free-text business → Claude writes the spec). Presenter keys: `1–4` pick business, `→`/space next, `←` back, `A` auto/manual, `R` restart, `F` fullscreen.

## Bildr (/start)
Needs `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_DEEPGRAM_API_KEY`, `GMAIL_USER`, `GMAIL_PASS`. None are set on Vercel as of Oct 2, 2026, so /start shows its fallback behaviour.

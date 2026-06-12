# Vbild Inc Website — Developer Handoff

**Live site:** https://vbild.ai  
**GitHub repo:** https://github.com/shayant101/vbild-website  
**Vercel project:** vbild (team: shayans-projects-401c4a5f)  
**Last updated:** June 2026

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.9 (App Router) |
| Language | TypeScript |
| Styling | Custom CSS (globals.css) + Tailwind config present but mostly unused |
| 3D / WebGL | Three.js v0.169 |
| Animation | Framer Motion v11 |
| Deployment | Vercel (auto-deploy on push to `main`) |
| Domain | Namecheap → DNS A record pointing to Vercel |
| Analytics | Vercel Analytics + GA4 + Meta Pixel |
| Contact form | Nodemailer + Gmail (API route) |

---

## Repository Structure

```
vbild-nextjs/
├── app/
│   ├── layout.tsx          # Root layout — fonts, analytics, SEO meta
│   ├── page.tsx            # Composes all sections in order
│   ├── globals.css         # ALL styles — single CSS file, no modules
│   ├── robots.ts           # SEO robots
│   ├── sitemap.ts          # SEO sitemap
│   └── api/contact/
│       └── route.ts        # Contact form → Nodemailer → Gmail
├── components/
│   ├── HeroSection.tsx     # Hero layout + typewriter word cycling
│   ├── Hero3DObject.tsx    # ⭐ Three.js particle cloud (see below)
│   ├── Hero3DLoader.tsx    # SSR-safe dynamic import wrapper for Hero3DObject
│   ├── HeroCanvas.tsx      # Background canvas — spider-web cursor lines
│   ├── NavBar.tsx
│   ├── MarqueeBar.tsx      # Scrolling logo/text bar
│   ├── ProblemSection.tsx
│   ├── SolutionSection.tsx
│   ├── HowSection.tsx
│   ├── VerticalsSection.tsx
│   ├── PortfolioSection.tsx
│   ├── PricingSection.tsx
│   ├── CTASection.tsx
│   ├── VisionSection.tsx
│   ├── PaySection.tsx
│   ├── Footer.tsx
│   ├── MagneticButton.tsx  # Framer Motion magnetic hover CTA button
│   ├── TiltCard.tsx        # Framer Motion 3D tilt + shimmer card
│   ├── FadeIn.tsx          # Framer Motion scroll reveal wrapper
│   ├── CursorEffects.tsx   # Custom cursor dot + ring + spotlight
│   └── CursorLoader.tsx    # SSR-safe wrapper for CursorEffects
├── three-types.d.ts        # TypeScript shim: declare module 'three'
├── next.config.ts
├── vercel.json
└── package.json
```

---

## Key Implementation Details

### Hero 3D Particle Cloud (`Hero3DObject.tsx`)

This is the most complex component and the area still being actively tuned. It uses Three.js `InstancedMesh` to render 2,400 particles as actual 3D geometry (spheres, cubes, rings) with spring physics and mouse repulsion.

**How it works:**
- Three.js is loaded via dynamic `import('three')` inside `useEffect` — required because Next.js SSR cannot run WebGL
- `Hero3DLoader.tsx` wraps it with `dynamic(() => import(...), { ssr: false })` to keep SSR clean
- 2,400 particles in three shape types: `SphereGeometry`, `BoxGeometry`, `RingGeometry`
- Each particle has a base position (`bp`), current position (`pos`), and velocity (`vel`)
- Per-frame: mouse repulsion force + spring-back toward base position + organic drift + damping
- Mouse position is unprojected from 2D screen to 3D z=0 plane via `Raycaster.ray.intersectPlane()`
- `m3d.lerp(m3dRaw, 0.08)` each frame smooths mouse tracking (eliminates jitter)
- NDC calculation uses live `r.width/r.height` from `getBoundingClientRect()` — NOT stale mount-time values — this is important, don't revert it

**Current tuning state (June 2026):**
The particle cloud is still being dialled in. The target aesthetic is:
- Feels like a galaxy/nebula — not confetti or a uniform random scatter
- Dense concentration at center, sparse outliers at edges (Gaussian distribution)
- Visible shape diversity: cubes, rings, and spheres should all be distinguishable
- Monochromatic indigo/violet palette only

**Key constants to tune (all in `Hero3DObject.tsx`):**
```ts
const REPEL_R  = 0.50   // Cursor repulsion radius (world units)
const REPEL_F  = 0.14   // Repulsion force strength
const SPRING_K = 0.045  // How fast particles spring back to base position
const DAMPING  = 0.88   // Velocity damping per frame (0.88 = 12% energy loss/frame)

// Distribution σ values in sample() — controls cloud tightness
// Smaller σ = tighter/denser core; larger σ = more spread out
const x = gauss() * 0.65   // horizontal spread
const y = gauss() * 0.85   // vertical spread (taller than wide)
const z = gauss() * 0.13   // depth (very flat / disk-like)

// Particle sizes — small enough to feel like particles, large enough to read shape
SphereGeometry(0.010, 5, 4)       // sphere radius
BoxGeometry(0.013, 0.013, 0.013)  // cube side
RingGeometry(0.007, 0.013, 6)     // ring inner/outer radius

// Scale range per particle — each particle is randomly scaled within this range
sc: 0.3 + Math.random() * 1.1   // 0.3–1.4× the base geometry size

// Particle counts (NS + NB + NR = 2400)
const NS = 1100  // spheres
const NB = 800   // cubes (boxes)
const NR = 500   // rings
```

**What NOT to do (learned from iteration):**
- Do NOT switch to `THREE.Points` / `PointsMaterial` — this was tried and rejected because it renders flat pixel dots, losing all shape diversity. Always use `InstancedMesh` for all three shape types.
- Do NOT set σ too wide (e.g. 1.15/1.50/0.20) — this spreads particles across the entire right half of the screen, making it look like a scattered confetti pattern rather than a concentrated cloud.
- Do NOT make shapes too large (e.g. scale up to 2.0 with base size 0.026) — individual shapes become dominant and it looks like confetti again.

**Layout:**
- `.hero-3d-wrap` in `globals.css`: `position: absolute; right: 0; top: 0; bottom: 0; width: 48%; z-index: 1`
- `.hero-content`: left-aligned, `max-width: 560px; padding: 0 0 0 6%` — occupies left ~52%
- On mobile (`< 960px`): `.hero-3d-wrap` is hidden, content centres

---

### Typewriter Effect (`HeroSection.tsx`)

Cycles through `WORDS = ['restaurant', 'smoke shop', 'gaming venue', 'ranch event', 'booking venue', 'business']` with 90ms type / 55ms delete timing and a 2200ms pause at full word.

**Known fix applied:** "gaming venue" (12 chars) caused layout height jumps at large font sizes. Fixed with:
- Font capped at `clamp(2.4rem, 5.2vw, 4.8rem)` (was 6rem)
- `white-space: nowrap` on `.type-target`
- `min-height: 1.1em; overflow: hidden` on `.hero-headline .line2`

---

### Contact Form (`app/api/contact/route.ts`)

Uses Nodemailer with Gmail. Requires these environment variables in Vercel dashboard:
- `GMAIL_USER` — the Gmail address sending the email
- `GMAIL_PASS` — Gmail App Password (not the account password — generate at myaccount.google.com → Security → App Passwords)

---

### Custom Cursor (`CursorEffects.tsx`)

Three-layer cursor: 6px dot, 28px ring (slightly delayed), 300px radial gradient spotlight. Loaded via `CursorLoader.tsx` with `ssr: false`.

---

### Spider-Web Canvas (`HeroCanvas.tsx`)

Background canvas that draws animated lines between particles near the cursor. Separate from the Three.js cloud — runs on a 2D `<canvas>` behind the hero content.

---

### TypeScript Shim (`three-types.d.ts`)

Contains `declare module 'three'` which suppresses all Three.js type checking. This was required to avoid TS errors from the dynamic import pattern used in `Hero3DObject.tsx`. A `// eslint-disable @typescript-eslint/no-explicit-any` comment is also at the top of that file — do not remove it.

---

## Deployment Workflow

Every push to `main` on GitHub auto-deploys to Vercel via webhook. No CI needed.

**Steps:**
1. Edit files in `vbild-nextjs/`
2. `cd /path/to/repo && git add -A && git commit -m "message" && git push origin main`
3. Vercel webhook fires → build starts (~35–45 seconds)
4. Monitor at: https://vercel.com/shayans-projects-401c4a5f/vbild

**Known gotcha — webhook miss:** Vercel's GitHub webhook occasionally misses a push (rare). If a commit is on GitHub but Vercel hasn't started a build after ~2 minutes, push an empty commit to re-trigger:
```bash
git commit --allow-empty -m "chore: trigger deploy" && git push origin main
```

---

## Environment Variables (Vercel)

Set at: Vercel dashboard → Project → Settings → Environment Variables

| Variable | Purpose |
|---|---|
| `GMAIL_USER` | Sender address for contact form emails |
| `GMAIL_PASS` | Gmail App Password |

---

## Aesthetic / Design Intent

- **Background:** Deep navy `#030712`
- **Palette:** Indigo/violet only — no cyan, no green, no warm tones
- **Gradient:** `--grad: linear-gradient(135deg, #6366f1, #a78bfa, #818cf8)` — used on typewriter text, stat numbers, etc.
- **Typography:** Space Grotesk (headings) + Inter (body) — loaded via `next/font/google` in `layout.tsx`
- **Motion philosophy:** Subtle. Framer Motion whileInView fades, magnetic buttons, no aggressive animations.
- **Brand voice:** Direct, confident, SMB-focused ("Apps for every business", "$0 discovery fee")

---

## Page Sections (in order)

1. Hero — Typewriter headline + 3D particle cloud + stats
2. Marquee bar — Scrolling social proof / industry logos
3. Problem — What agencies charge vs what we do
4. Solution — The AI-first approach
5. How — 3-step process
6. Verticals — Industry cards (restaurant, smoke shop, gaming venue, etc.)
7. Portfolio — Live work showcase
8. Pricing — Tier cards
9. CTA — Get started form (posts to `/api/contact`)
10. Vision — Company direction
11. Pay — Payment options
12. Footer

---

## Open Work / What Needs Attention

1. **Hero particle cloud aesthetic** — The current σ=0.65/0.85/0.13 tuning is close but the owner wants to confirm the final look. The goal: galaxy-like dense core with visible outliers, all three shape types (cubes, rings, spheres) individually readable, monochromatic indigo. The main levers are the σ values in `sample()` and the geometry base sizes.

2. **No TypeScript safety on Three.js** — `three-types.d.ts` suppresses all Three.js types. If you want proper types, install `@types/three` and remove the shim, then fix the resulting TS errors in `Hero3DObject.tsx`.

3. **Tailwind mostly unused** — The project was scaffolded with Tailwind but all styles ended up in `globals.css`. The config can be removed or adopted more widely.

4. **No tests** — None exist. The site is purely presentational so this was deprioritised.

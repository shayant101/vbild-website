# Research behind v2 (Oct 2, 2026)

Two research passes feed `lib/data/market.json`, `/investors`, and the deck:

1. **YC, Claude for Startups, pre-seed norms** — YC runs four batches/year; W27 deadline Nov 2, 2026 (8pm PT), decisions Dec 11. Standard deal $500K ($125K for 7% + $375K uncapped MFN). Relevant RFS: "A Cloud for Small Software" (F26) and "AI-Native Service Companies" (S26). Claude for Startups has an open tier (community/events) and a credits tier (needs institutional funding, <4 yrs old). Carta: median post-money SAFE cap $10M for $250K–$1M rounds (2025); 49% of pre-seed dollars → AI in H1 2026; 93% of rounds use SAFEs.
2. **Market sizing + competition** — bottoms-up TAM $4.4B (968K US businesses × $4.5K ACV; $9.1B incl. salons), SAM $1.4B (320K), SOM $1.05M / $2.7M / $5.5M at 300 / 600 / 1,000 customers. Comps: Toast $2.4B ARR / 180K locations; Owner.com $100M+ ARR; Lovable ~$600M ARR / $13.3B; Base44 → Wix. Agency benchmark: Clutch median $171K, ~13 months; Standish 31% success.

Every figure in `market.json` carries a `source` key resolving to a URL in `market.json → sources`. Figures with `verify: true` or notes like "composite" / "assumption" are flagged on the admin Investor Room and in the deck.

Known gaps: no clean Census count for VR arcades or ranch event venues (composites used); "SMBs who want custom software but can't afford it" has no reliable survey — not claimed anywhere; Claude for Startups credit amounts are not published; the "3–21 days to ship" figure is from the founder's delivery notes, not an audited log.

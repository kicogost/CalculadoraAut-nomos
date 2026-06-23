# COMPETITORS.md — Spanish autónomo software landscape

Competitive research (website + third-party reviews: Trustpilot, Capterra, GetApp,
Google Play, Reddit). Used to find Provisio's edge and steer the roadmap.

> Pricing/ratings shift and review samples are small/self-selected — treat as
> directional. Sources cited per competitor.

## At a glance

| Tool | Target | Free tier | Price (€/mo) | Bank auto-sync | Files taxes for you | Human advisor | Biggest weakness (reviews) |
|---|---|---|---|---|---|---|---|
| **Anfix** | autónomo + pyme + asesoría | ❌ | 5.99–99.99 | ✅ (flaky on some banks) | prepares/submits | ❌ | price hikes "sin avisar", bugs, AEAT files fail, no papelera |
| **Quipu** (TeamSystem) | autónomo + pyme + asesoría | ❌ (15-day trial) | 14–49 | ✅ (Premium) | colaborador social | ❌ | slow support ("2 meses"), bugs, weak invoice search, price↑ |
| **Holded** | autónomo → pyme → asesoría (ERP) | ❌ (14-day trial) | 7.50–99.50 | ✅ | prepares | ❌ | overkill/complex for solos, price escalation/upsell, bot support |
| **Contasimple** (Cegid) | autónomo + pyme | ✅ €0 Básico | 0 / ~11 / ~16–20 | ✅ | model generation (broad) | ❌ | downtime, zero support, security breaches, data lockout |
| **Cuéntica** | autónomo-first (+ pequeñas empresas) | ❌ (15-day trial) | 9 / 19 / 29 / 59 / 129 | ◐ weak/manual | done-for-you (Tutelada €59) | ✅ (Fiscalidad tiers) | weak/manual bank sync, no mid-tier, no real mobile app |
| **Declarando** | autónomo (asesoría fiscal) | ❌ | 29.90–49.90 | ◐ | ✅ they file (303/130/100) | ✅ (core model) | expensive/hidden upsells, bank-financed lock-in, AI support |
| **Taxfix / TaxScouts** | autónomo (hybrid) | ❌ | (pack autónomos) | ✅ open banking | ✅ advisor files | ✅ (core model) | entries lock after sending to advisor; advisor-gated |
| **Provisio** (us) | **autónomo only** | ❌ (14-day trial) | **Core €79–89/yr · Automatización €149–199/yr** (see UNIT-ECONOMICS.md) | planned (open banking) | self-file (casillas) → 1-click planned | ❌ (refer) | not yet hands-off (no bank sync / submission yet) |

## Per-competitor notes

**Anfix** — invoicing + accounting + bank reconciliation + AEAT models + Verifactu; broad (autónomo/pyme/asesoría). Loved: ease, automation. Hated: **price increases without notice**, bugs, "los archivos para la AEAT no funcionan", bank recon fails for some banks (Abanca), no recycle bin, no duplicate detection, support degraded.

**Quipu** (now TeamSystem) — facturación + OCR ticket scanner (most-praised) + modelos (colaborador social) + Verifactu + AI "Genius" + mobile. Loved: ease, OCR, all-in-one. Hated: support waits "de hasta 2 meses", bugs ("integración con Stripe completamente fallida"), price↑, "searching for an invoice is a nightmare", weak reporting. Capterra 4.5 / Trustpilot ~4.

**Holded** — full ERP (facturación + contabilidad + CRM + inventario + proyectos + RR.HH. + nóminas) + Verifactu + modelos. Loved: "best-looking ERP… like a modern Apple app", all-in-one. Hated: **"un programa excesivo para pequeños autónomos… muy complejo"**, price escalation/upsell ("gancho de entrada"), slow bot support, features locked in low tiers. Capterra 4.6.

**Contasimple** (Cegid) — broadest model coverage (303/130/390/111/115/180/347/349/100/190) + Verifactu + TPV; **the only real free tier**. Loved: simplicity, €0 plan, time savings. Hated (recent, severe): downtime ("30 min en emitir una factura"), "cero atención al cliente", **security breaches / account hijacking (no 2FA)**, account lockouts + data hostage, shallow accounting reports. Ratings sliding post-acquisition (Capterra 3.3).

**Cuéntica** — autónomo-first, simplicity + in-house human advisory. Loved: ease, **responsive human support**, saves tax time. Hated: **bank reconciliation weak/manual** (must upload statements), no mid-tier (advisory jumps price), back-billing onboarding, thin tutorials, no real mobile app.

**Declarando** — asesoría fiscal *for autónomos* (software + humans), sold on **"ahorro fiscal ~€4.000/año"** + antisanción guarantee; they file 303/130/100. Loved: advisors, real savings, peace of mind. Hated: **expensive + hidden upsells**, Esencial capped at 5 gastos/mes, **bank-financed contract lock-in**, AI/slow support, savings promise sometimes fails (one user hit a >€8.000 Hacienda demand). Trustpilot polarized (65% 5★ / 27% 1★).

**Taxfix / TaxScouts** (researched earlier, see INSIGHTS.md) — hybrid software + human asesor who files; AI receipt scan + bank import; Verifactu issuing. Entries **lock once sent to the advisor**; advisor-gated, no in-app set-aside.

## The patterns (every competitor's recurring complaints = our openings)

1. **Pricing is resented** — price hikes, opaque upsells, gated features (Anfix, Quipu, Holded, Declarando); only Contasimple is free and it's the buggiest/least secure. → **transparent, honest pricing, no surprise hikes, no lock-in** (trial-led, two simple tiers — see UNIT-ECONOMICS.md; a free tier doesn't pencil for paid acquisition, so we compete on honesty + value, not on "free").
2. **Price increases / opaque upsells / features gated** — universal (Anfix, Quipu, Holded, Declarando). → **transparent pricing, no hikes, no lock-in**.
3. **Support is slow / bot-led / degrading** — *every* paid tool. → fast, human, honest support is a real early wedge.
4. **Bugs, downtime, AEAT files that don't work** (Anfix, Quipu, Contasimple). → **correctness + reliability** (tested engine, box-verified casillas, AEAT-vector-verified Verifactu).
5. **Too broad / complex for a solo autónomo** (Holded "excesivo", Quipu "interfaz confusa", Anfix). → **purely autónomo, simple by subtraction**.
6. **Bank sync is weak/manual (Cuéntica) or fails for some banks (Anfix)**. → **reliable open-banking auto-sync** is a wedge — but it's table stakes the leaders already have.
7. **Lock-in & data hostage** (Declarando bank-financed contracts; Contasimple lockout). → **own-your-data, export anytime, no contract**.
8. **Data-safety gaps** (Anfix: no recycle bin, no duplicate detection; Contasimple: security). → cheap, differentiating wins.

## Our edge (where Provisio is genuinely different)

The only product that combines: **autónomo-only focus + radical simplicity + honest pricing with no hikes/lock-in + the "cuánto apartar / beneficio neto" hook + verified correctness + privacy.** No competitor has that bundle. The leaders out-*cover* us (bank sync, submission, broad models) but are broad, price-creeping, buggy, and slow-to-support; the advisor models (Declarando, Taxfix, Cuéntica-Tutelada) are pricier and lock you in.

**Pricing context:** the market clusters at ~€9–€30/mo SaaS, advisory tiers €29–€59, done-for-you €49–€129/mo. Provisio's plan: **no free tier** (it can't fund acquisition — see UNIT-ECONOMICS.md), a **14-day trial → Core €79–89/yr + Automatización €149–199/yr**, annual-billed, transparent, no hikes. That undercuts the monthly subscriptions the audience resents while staying viable for paid + organic growth.

## Primary-data check (multi-source, ~Jun 2026) — ~5,640 data points

Pulled real reviews at scale via `tools/review-research/` (Google Play + Apple App
Store + Reddit archive) to ground the thesis instead of hand-reading a few. It
strongly confirms the bug/reliability, price-hike, and degrading-support openings:

| Tool | N | Avg | % ≤2★ | Dominant complaints (verbatim signal) |
|---|---|---|---|---|
| **Holded** | 138 | **2.26★** | **68%** | bugs/blank screens, **price jump "200€/mes"** to unlock features, broken scanner |
| **Anfix** | 98 | **2.41★** | 59% | crashes ("se cuelga"), **broken bank sync** ("conexión con el banco… imposible trabajar"), app unusable |
| **Contasimple** | 68 | 2.85★ | 46% | **"Cegid se ha cargado contasimple"**, price hikes ("empecé pagando 9€… ya van por 18€"), "atención al cliente pésimo" |
| **Quipu** | 110 | 3.15★ | 44% | app barely works ("no puedes hacer casi nada"), photo upload, login |
| **TaxDown** | 5,198 | 3.89★ | 26% | **AI-only support** ("hablas con una IA que no se entera"), "envían tu declaración sin tu consentimiento", upsell pressure |
| Cuéntica / Declarando | web-first | — | — | no app → pull from Trustpilot (run `trustpilot.mjs` locally; 403 from datacenter) |

Takeaways with primary backing: (1) the leaders' **apps are genuinely bad** (Holded
2.26★/68% neg, Anfix 2.41★/59%); (2) **price hikes/upsells are documented, not
anecdotal** (Contasimple 9→18€, Holded 200€/mo gate); (3) **support is degrading to
AI/bots** (TaxDown). All three are our openings: reliability, honest pricing, real
support. Caveat: most autónomo SaaS is web-first, so app stores only give big samples
for mobile-first tools (TaxDown 5k+); Reddit substring search needs tight aliases
("declarando" = the verb). See `tools/review-research/README.md` + `last-run.md`.

## Roadmap moves (what this research says to build/do next)

1. **Bank auto-sync, done *reliably* and *simply*** — table stakes the leaders have, and their soft spot (flaky on some banks / weak & manual). See `BANK-SYNC.md`. **Top priority.**
2. **One-click submission** — leaders submit (colaborador social) or generate; we self-file. Close it (`FILING.md` Phase 3, shared infra with Verifactu).
3. **Reliability + correctness as the brand promise** — "funciona y es correcto" directly attacks the Anfix/Quipu/Contasimple bug reputation. Keep the tested-engine discipline.
4. **Data-safety quick wins** — undo / recycle bin + **duplicate-invoice detection** (explicit Anfix/Contasimple gaps) + the cloud-source-of-truth in `ARCHITECTURE.md`. Cheap, on-brand.
5. **Stay radically simple** — resist ERP/feature creep (Holded's trap). Judge every feature by `GESTOR-REPLACEMENT.md`'s effort test.
6. **Transparent pricing, no hikes, no lock-in, fast human support** — bake into positioning; it counters the #1 universal complaint and the lock-in models.

## Methodology note
Researched via parallel subagents (now web-enabled — see `.claude/settings.json` allowlisting `WebFetch`/`WebSearch`) **plus** massive-sample app-store scraping (`tools/review-research/`). For bigger samples on the web-first leaders, add Trustpilot/Capterra via API or a residential IP (datacenter IPs get 403) — see that tool's README. Add Billin, FacturaDirecta, Sage, or others here later using the same template.

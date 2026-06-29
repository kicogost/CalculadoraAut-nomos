# UNIT-ECONOMICS.md — costs, CAC, LTV, and pricing

A living model for whether Provisio's pricing pencils. **All figures are planning
estimates with stated assumptions** — replace them with measured numbers as soon as
you have them. The two numbers that decide everything: **trial→paid conversion** and
**annual churn**. Measure those first.

> Decision baked in: **no free tier.** A 14-day free trial (card required) is the
> funnel instead — card-required converts ~2× a no-card trial and filters
> tire-kickers, lowering effective CAC.

## 0. The structural constraint that sets the model

Bank auto-sync and the AI reader have **ongoing per-user costs** (aggregator fees per
connected account; Anthropic tokens). You cannot cover a recurring cost with a
one-time payment — so the automated product must be **recurring** (annual-billed
preferred: one Stripe charge/yr, and the audience tolerates annual far better than
monthly). The old "one-time €49" idea dies the moment bank sync is included.

## 1. Cost to serve one paying user (per month)

| Cost | €/user/mo | Note |
|---|---|---|
| Supabase + Vercel (infra) | ~0.10 | client-side compute + "store data, not blobs" keeps this tiny (see ARCHITECTURE.md) |
| AI reader (Anthropic Haiku, PDF-only, ~20 scans) | ~0.15 | metered; scales with usage, credit-gated |
| **Bank auto-sync (open-banking aggregator)** | **~0.50–1.50** | **the swing cost** — charged per connected account/mo above free tiers (see BANK-SYNC.md) |
| Stripe fees | ~0.08–0.30 | favor **annual** billing (one charge/yr) over monthly |
| **Total — with bank sync** | **~€1–2 / user / mo** | the full automated product |
| **Total — without bank sync** | **~€0.30–0.50 / user / mo** | calculator + invoicing + casillas + AI |

Support is the wildcard: founder-time early; ~€1–3/user/mo if staffed at scale.
Gross margin is healthy (~85%) at €8+/mo, but thins (~60%) on a €49/yr plan once bank
sync is included.

## 2. Cost to acquire a customer via paid ads (CAC)

`CAC = CPC ÷ (click→trial × trial→paid)`. Spanish autónomo/fintech keywords:

| Scenario | CPC | click→trial | trial→paid | **CAC** |
|---|---|---|---|---|
| Optimistic | €0.80 | 12% | 25% | **~€27** |
| Realistic | €1.20 | 8% | 15% | **~€100** |
| Pessimistic | €2.00 | 5% | 10% | **~€400** |

**Plan around ~€80–150 CAC** for paid ads until the funnel is measured. Organic
channels (SEO on "modelo 303/130", Reddit/community, referrals) are far cheaper —
**CAC ~€0–20** — and are where a low price point survives.

## 2b. Meta (FB/IG) acquisition — funnel detail

Spanish Meta benchmarks: **CPM ~€4–10**, **CTR ~1–2%** → **CPC ~€0.40–€1.20** (Spain is
cheaper than US/UK; finance-ish audiences sit higher). The friction is that cold Meta
traffic is **low-intent** (nobody's searching) feeding a **card-required trial**.

**Direct funnel: Meta → card-required trial → paid**

| Stage | Poor | Mid | Good |
|---|---|---|---|
| CPC | €1.20 | €0.80 | €0.50 |
| Click → trial (card) | 2% | 4% | 6% |
| → cost / trial | €60 | €20 | €8 |
| Trial → paid | 30% | 40% | 50% |
| **CAC** | **~€200** | **~€50** | **~€17** |

**Plan ~€70–€120 early**, dropping toward **€40–€70** once creative/targeting are tuned;
the high end (€100–€150+) is normal before optimisation.

**Lead-magnet funnel: Meta → free "cuánto apartar" calculator / waitlist → nurture → paid**
- Cost / lead (free, low friction): **~€2–€6** · lead → paid (email + product): **~4–10%**
  → **CAC ~€30–€120**, but with a cheap/measurable front end, more volume to learn from,
  and an **owned email list** that lowers *effective* CAC over time. Doubles as the
  launch waitlist → **the lower-risk way to use Meta.**

**Viability (vs §3 LTV):** for LTV:CAC ≥ 3, keep CAC under ~**€70 (Core €89)** /
~**€130 (Automatización €199)**. So Meta is **marginal for Core, workable for
Automatización** — point ads at the premium/annual tier; keep Core organic-first.

**Notes:** Meta's "autónomo/freelance" interest targeting is thin → win with **broad
targeting + sharp creative** (reuse the "harto de no saber cuánto pagar a Hacienda"
hook). iOS/ATT makes attribution fuzzy → track signups via UTMs + your own backend.
**Retargeting** (site/waitlist visitors) is far cheaper than prospecting. Start
€20–€50/day, optimise for trial/lead first, judge paid after ~15–30 conversions.

## 3. LTV at candidate price points

Assume ~75% gross margin, ~3-year average lifetime (autónomos churn ~25–30%/yr — they
stop being autónomo or switch tools).

| Price | Gross profit/yr | LTV (3 yr) | LTV:CAC @ €100 CAC | CAC payback |
|---|---|---|---|---|
| €49/yr | ~€32 | ~€95 | **~0.9 ❌** | >24 mo |
| €99/yr | ~€74 | ~€220 | ~2.2 ◐ | ~16 mo |
| €9.99/mo (€120/yr) | ~€90 | ~€270 | ~2.7 ◐ | ~13 mo |
| €14.99/mo (€180/yr) | ~€135 | ~€400 | **~4.0 ✅** | ~9 mo |

Healthy SaaS targets: **LTV:CAC ≥ 3** and **payback < 12 months**.

## 4. The verdict

- **A cheap price (€49 one-time or €49/yr) cannot fund paid acquisition** — LTV sits
  at/below a €80–150 CAC. It only works through **near-zero-CAC organic** channels.
- **Paid ads need ≥ ~€120–180/yr equivalent** *and* decent retention to clear the 3×
  rule and a <12-month payback.
- Therefore: a **two-tier, trial-led, annual-billed** model, **organic-first**, with
  paid ads pushing the premium tier once trial→paid is proven.

## 5. Recommended pricing (no free tier)

**14-day free trial (card required) → two annual-billed plans:**

| Plan | Price | Includes | Margin | Role |
|---|---|---|---|---|
| **Core** | ~€8–9/mo (**€79–89/yr**) | calculator, "cuánto apartar / beneficio neto", invoicing (Verifactu issuing), casillas 303/130/349/390, reminders, AI PDF reader | ~85% | affordable wedge; competitive vs Quipu/Cuéntica/Anfix |
| **Automatización** | ~€14–19/mo (**€149–199/yr**) | everything in Core **+ bank auto-sync + one-click filing** | ~70% after bank cost | covers per-account cost, lifts LTV, **makes paid ads work** (LTV:CAC ~4) |

Why this shape:
- Sits inside the market's €9–30/mo SaaS band while being **autónomo-only + simpler**.
- The premium tier is exactly the two gestor-replacement pillars (bank sync +
  submission, see GESTOR-REPLACEMENT.md) — the features worth paying more for.
- Annual billing maximizes margin and matches anti-subscription sentiment better than
  monthly.

## 6. Sensitivity — the levers, biggest first

1. **trial→paid conversion** — doubling it (10%→20%) ~halves CAC. The single biggest
   lever; card-required trial + a great onboarding ("connect → see your number").
2. **Churn / retention** — every extra year of lifetime adds a full year of margin to
   LTV. Annual billing, the data-loss fix (cloud source-of-truth), and the proactive
   quarterly flow all raise retention.
3. **Price / tier mix** — share on Automatización drives blended LTV and ad viability.
4. **CAC channel mix** — organic (SEO/Reddit/referrals) at ~€0–20 vs paid at €80–150;
   stay organic-heavy until the paid funnel is proven on the premium tier.

## 7. What to instrument from day one

Trial starts, trial→paid %, blended CAC by channel, monthly/annual churn, tier mix,
bank-accounts-connected per user (drives the swing cost), AI scans per user. Revisit
this doc once you have 1–2 quarters of real numbers.

## Related
`ARCHITECTURE.md` (infra cost model) · `BANK-SYNC.md` (per-account aggregator cost) ·
`FILING.md` (submission) · `GESTOR-REPLACEMENT.md` (what the premium tier is) ·
`COMPETITORS.md` (price benchmarks) · `INSIGHTS.md` (willingness-to-pay signals).

# PRICING.md — the decided pricing model (single source of truth)

Decided from `COMPETITORS.md` + `UNIT-ECONOMICS.md` + the ~6,800-review research.
If anything elsewhere (ARCHITECTURE.md, old notes) contradicts this, **this wins.**

## The model

- **No free tier.** A **14-day free trial, card required** (≈2× the trial→paid of a
  no-card trial, and filters tire-kickers).
- **Two plans**, billed **monthly or annual** (annual ≈ 2 months free). **Default to
  annual** in the UI; offer monthly as a softer on-ramp after the trial.

| Plan | Monthly | **Annual** | Includes |
|---|---|---|---|
| **Core** | €8.99/mo | **€89/yr** | tax calc + "cuánto apartar / beneficio neto", invoicing (Verifactu issuing), casillas 303/130/349/390, deadline reminders, AI PDF reader (≤50 scans/mo), Clientes/profitability view, JSON export |
| **Automatización** | €19.99/mo | **€199/yr** | Everything in Core **+ bank auto-sync + one-click pre-filled filing** (user authorises with their own Cl@ve/certificate) + AI reader (≤200 scans/mo) |

AI scan caps are soft (cost ≈ €0.005/scan); add top-up packs later if needed.

## Why (one line each)

- **Core €89/yr** — affordable end of the competitor SaaS band; wins on honesty (no
  hikes / no lock-in, the #1 universal complaint). Grows **organically** (SEO/Reddit/
  referral, CAC ≈ €0–20).
- **Automatización €199/yr** — undercuts the human-advisor "done-for-you" tier
  massively (Renn €50–70/mo, Cuéntica-Tutelada €59/mo, gestor ≈ €840/yr) because we
  don't bundle a human (user files with own Cl@ve). LTV ≈ €400 → **LTV:CAC ≈ 4,
  payback < 12 mo** at ~€100 CAC → this is the **paid-ads** tier.
- **Annual-billed** — better margin, less of the monthly model the audience resents.
- **Anchor** against the ~€840/yr gestor and Renn's €600+/yr — never against apps.

## Filing mechanism (decided)

**v1: the user files with their own Cl@ve/certificate.** We pre-fill everything; the
user authorises submission. No apoderamiento / colaboración social, so **no licensing
or professional-liability exposure**. (A "we file for you" tier is a *future business
decision*, not a v1 feature — see `FILING.md`.)

## How it maps to the schema (`entitlements`)

The merged migration's `entitlements` already fits — use these fields:

- `tier` ∈ `('free','core','automation')` — `free` = **locked / no active plan**
  (pre-trial-expiry or churned), not a product offering.
- `subscription_status` ∈ `('inactive','trialing','active','past_due','canceled','unpaid')`.
- `tier_valid_until` — paid-through / trial-end date.
- `ai_credits` — remaining AI scans (refill monthly per plan cap).
- `stripe_customer_id`, `stripe_subscription_id`.

**Subscription-only → drop the legacy one-time fields** in a follow-up migration:
`pro_lifetime` and `verifactu_until` are not used by this model. `tier` +
`subscription_status` + `tier_valid_until` are the source of truth.

## Stripe setup (for the build)

Two products × two intervals = **4 Prices**: Core-monthly, Core-annual,
Automatización-monthly, Automatización-annual. Trial = 14 days, card required
(`trial_period_days` + `payment_method_collection: 'always'`). The webhook writes
`entitlements` (service-role key); `stripe_events` dedupes by event id.

## Gating (which tier unlocks what)

| Feature | Core | Automatización |
|---|---|---|
| Calculator, "cuánto apartar", beneficio neto | ✅ | ✅ |
| Invoicing + Verifactu issuing | ✅ | ✅ |
| Casillas 303 / 130 / 349 / 390 | ✅ | ✅ |
| AI PDF reader | ✅ (≤50/mo) | ✅ (≤200/mo) |
| Reminders, Clientes view, export | ✅ | ✅ |
| **Bank auto-sync (open banking)** | — | ✅ |
| **One-click pre-filled filing (own Cl@ve)** | — | ✅ |

Server endpoints (`/api/extract`, bank sync, filing) **re-check entitlements** before
doing paid work — never trust client-side gating alone.

## Open for later (not v1)

Monthly-vs-annual mix tuning, AI top-up packs, a "we-file-for-you" premium
(apoderamiento), Kit Digital eligibility, compliant affiliate offers (see
ARCHITECTURE.md). Revisit prices once real **trial→paid** and **churn** are measured.

# ARCHITECTURE.md — going live (cloud accounts, payments, scale)

How Provisio moves from a local-only SPA to a multi-user product with accounts,
cloud history, and payments — while staying cheap and fast.

## Guiding principle: cloud accounts, client-side compute

The thing that keeps it cheap/fast at scale is that **computation never moves to the
server**. The tax engine and PDF generation run in the browser; the backend only
does auth, small-record CRUD, payments, and two compute endpoints.

```
Browser (static SPA on CDN)
  ├─ tax engine + PDF (react-pdf)        ← runs locally; scales for free
  ├─ IndexedDB (offline cache)
  └─ supabase-js (HTTP, RLS-enforced)    ← direct CRUD; NO API server to run
        │
        ▼
Supabase (EU region)
  ├─ Auth (email + Google) → profiles
  ├─ Postgres (RLS: auth.uid() = user_id): year_profiles, invoices, expenses,
  │   facturas (jsonb), app_settings, entitlements
  └─ Storage: only archived/immutable PDFs (rare)

Vercel functions (per-request, autoscale)
  ├─ /api/extract          AI reader (gate by entitlement/credits)
  ├─ /api/stripe-webhook   Stripe → writes entitlements (service-role key)
  ├─ /api/checkout         create Stripe Checkout session
  └─ /api/verifactu-submit AEAT submission (cert/apoderamiento) — paid

Stripe (hosted Checkout) ── webhook ──▶ entitlements
```

**Why it scales / stays fast:** static frontend on CDN (user count irrelevant),
per-user compute in the browser, CRUD over Supabase's HTTP API (`supabase-js` →
PostgREST, no Postgres connection exhaustion), spiky compute is per-request
serverless. Indexes in `schema.sql` cover the hot queries.

## Data model

See `supabase/schema.sql`. Mirrors the existing TypeScript types
(`src/engine/types.ts`, `src/types/factura.ts`). Key choices:

- **Store data, not blobs.** A factura is jsonb (~1 KB); its PDF (~50–200 KB) is
  regenerated client-side on download. Keeps storage in MBs even at scale.
- **RLS everywhere** (`auth.uid() = user_id`) → the SPA queries Supabase directly,
  physically isolated per user, with no custom API tier to build or scale.
- **`entitlements`** is read-only to clients; only the Stripe webhook writes it
  (service-role key). Server endpoints re-check it before doing paid work.

## Sync model (cloud source of truth + offline cache)

- Logged in: write to IndexedDB immediately (instant UX) **and** upsert to Supabase.
  On login, pull cloud → hydrate local. Per-row `updated_at` → last-write-wins
  (sufficient for one user across devices).
- Only `src/db/repo.ts` changes — gains a cloud-aware path when a session exists.
  The engine and UI are untouched.
- Logged out: IndexedDB only (still works offline; a "sign in to sync" nudge).

## Auth

Supabase Auth, email magic-link + Google OAuth. `profiles` row auto-created by a
trigger on signup. Account settings screen adds: JSON export (exists), **account
deletion** (RGPD), and region note.

## Payments & entitlements

1. "Hazte Pro / Verifactu" → `/api/checkout` creates a **Stripe Checkout** session
   (one-time for Pro €49; subscription/annual for Verifactu €49/yr).
2. Stripe **webhook** → `/api/stripe-webhook` verifies the signature and upserts
   the `entitlements` row (service-role key bypasses RLS).
3. App reads `entitlements` for UI gating; **server functions re-verify** before
   paid work (`verifactu-submit`, AI beyond credits). The valuable bit (AEAT
   submission) is a server service → can't be pirated by editing client code.

Pricing (see INSIGHTS.md §5): one-time **Pro €49** (power features) + **Verifactu
€49/yr** (issuing + AEAT submission) + **AI reader credits** (cover token cost).
Anchor marketing against the ~€840/yr gestor, not against other apps.

## Affiliates (compliant, not data-selling)

**Never sell personal data** (illegal under RGPD; kills the privacy moat). Instead:
contextual affiliate offers **targeted client-side** from the user's own local data
(e.g. "facturas en USD → Wise/Revolut", digital-certificate providers, RC
insurance). The partner never receives user data; you earn the referral commission.
Optional opt-in lead-gen on top. See INSIGHTS.md.

## Cost & scale (data-not-blobs, MAU on active users)

| Active users | Supabase | + Vercel/Stripe |
|---|---|---|
| 0–10k | ~$25–50/mo | flat CDN + per-txn |
| 10k–100k | ~$100–300/mo | " |
| 100k+ MAU | + ~$0.003/extra MAU | revenue dwarfs it |

Free users cost ~€0.05–0.60/yr (small rows). Dormant signups ≠ MAU. The expensive
resource (compute) is in the browser.

## Unit economics (one-time Pro + annual Verifactu)

- Pro €49 one-time → ~€47 margin, then ~€0.60/yr to serve.
- Verifactu €49/yr → ~€47/yr recurring (funds AEAT-integration upkeep).
- Healthy with organic CAC (~€0 via Reddit/SEO/community); need ~1–2% free→paid.
- **Risk:** Verifactu submission is per-NIF → needs the user's digital certificate
  or an apoderamiento. That's the hard build + support cost; it's why it's the
  annual tier. Marginal per-submission cost ≈ €0.

## Environment variables

Client (Vite, public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Server (Vercel, secret): `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_VERIFACTU`,
`ANTHROPIC_API_KEY` (exists). Verifactu later: certificate handling secrets.

## Build phases

1. **Auth + cloud sync** — Supabase client, login UI, `schema.sql`, cloud-aware
   repo. Delivers profiles/login/cross-device/downloadable historicals.
2. **Payments + entitlements** — Stripe Checkout + webhook + gating; Pro unlock +
   AI credits.
3. **Verifactu submission** — the AEAT service (cert/apoderamiento). Flagship paid.
   **Shared infrastructure with AEAT model filing** (303/130/… one-click submit) —
   the certificate + web-service plumbing is built once and reused for both. See
   `docs/FILING.md`.
4. **Polish** — account deletion, EU region, privacy policy, affiliates page, Kit
   Digital eligibility (state subsidises the tool).

## What's needed from the owner to wire it live

- A **Supabase project (EU region)** → `VITE_SUPABASE_URL` + anon key (Phase 1).
- A **Stripe account** → secret key + two Price IDs + webhook secret (Phase 2).
- A **digital certificate / apoderamiento** path for Verifactu (Phase 3).

# BANK-SYNC.md — automatic income/expense import via open banking

The #1 automation lever toward "connect once → forget it." This doc is the plan for
your developer. **Key point: you do NOT integrate banks one by one — you integrate
ONE open-banking aggregator and get thousands of banks through a single API.**

> Coverage/pricing figures below shift over time — verify against the provider's
> current docs when you pick one. The architecture (one aggregator, not N banks) is
> what's stable.

## Why it's one integration, not hundreds

PSD2 (EU open-banking law) forces every bank to expose a standardized account API.
**Aggregators** sit on top of all of them and normalize the data, so you write one
integration:

- **GoCardless Bank Account Data** (ex-Nordigen) — ~2,500+ banks across 30+ European
  countries, historically a generous free tier. **Recommended to start** (Spain/EU,
  best coverage-for-cost). All major Spanish banks (BBVA, Santander, CaixaBank,
  Sabadell, Bankinter, ING…) come in one go.
- **Tink** (Visa) / **TrueLayer** — strong EU + UK, more enterprise.
- **Plaid** — best for UK/US (add later if expanding).

## Flow

```
User taps "Conectar banco"
  → redirect to the aggregator's HOSTED consent screen (we never see credentials)
  → user logs into their bank + grants consent there
  → aggregator returns NORMALIZED transactions via one API
  → we map them into DraftEntry[] (income/expense, AI/rules-categorized)
  → the EXISTING review-and-confirm screen → user confirms → invoices/expenses
```

**The hardest UI already exists.** Bank transactions feed the same review-and-confirm
flow built for the CSV/AI reader (`src/screens/Importar.tsx`, `src/lib/aiReader.ts`,
`DraftEntry` in `src/types/reader.ts`). Bank sync is a new *source* into that
pipeline, not a new pipeline.

## What to actually build (once)

1. **`/api/bank/connect`** (serverless): create an aggregator "requisition"/link →
   return the hosted-consent URL. Redirect the user there.
2. **`/api/bank/callback`**: on return, store the connection + account ids (and the
   aggregator's access/refresh tokens) in Supabase, server-side only.
3. **`/api/bank/sync`**: fetch new transactions for the user's accounts, normalize to
   `DraftEntry[]`, return for review (or stage them). Run on demand + on a schedule.
4. **Categorization**: rules + the existing AI extraction to set kind
   (income/expense) and a deductible category; user corrects in the review screen.
5. **Reuse the review-and-confirm UI** to commit drafts → `invoices` / `expenses`.

All of this sits on the Supabase + serverless backend in `ARCHITECTURE.md` (tokens in
a server-only table; never in the client). Add a `bank_connections` table
(user_id, aggregator, account_ids, status, consent_expires_at, tokens) with RLS, and
a `synced_transactions` dedupe table (or dedupe by the aggregator's transaction id).

## The real hard parts (NOT per-bank)

1. **Consent lifecycle.** PSD2 consents expire (~every 90 days) and need re-auth
   (SCA). Detect expiry, prompt reconnection, and don't lose history. This is the #1
   ongoing friction — design for it from day one (`consent_expires_at` + a reminder).
2. **Categorization quality.** Raw bank lines → income/expense + deductible category.
   Start with rules (sign, counterparty patterns) + AI for the rest; the user's
   corrections in the review screen are training signal.
3. **Dedup & idempotency.** Re-syncs must not double-import — key on the aggregator's
   stable transaction id.
4. **Per-account cost.** Above free tiers, aggregators charge **per connected account
   per month**. Real cost line that scales with active users → gate bank sync behind
   the **paid tier** (it's a premium "auto-contabilidad" feature, not free).

## Regulatory & privacy

- You generally operate under the **aggregator's AISP license** (they're the
  regulated party) — you usually don't need your own banking license. **Confirm in
  the provider's terms.**
- Transaction data now flows through the aggregator + your backend → update the
  privacy policy, keep it EU-region (RGPD), make the connection **opt-in**, and offer
  easy disconnect + data deletion. Bank sync is a paid, opt-in feature — the free
  tier stays local-first.

## How it changes the product

Turns the experience from "type/import your data" into **"connect bank once → review
a pre-filled quarter → confirm."** Combined with one-click submission (FILING.md
Phase 3), that's the "set-it-and-forget-it" gestor replacement
(see `docs/GESTOR-REPLACEMENT.md` if/when added).

## Build sequencing

Bank sync depends on the backend, so: **ARCHITECTURE.md Phase 1 (Supabase auth +
sync) → Phase 2 (Stripe, to gate it) → then bank sync** as the flagship paid
automation. Start **GoCardless, Spain/EU only**; expand providers later. Estimated
effort: medium, **mostly backend** (one aggregator integration + token storage +
scheduled fetch + 90-day reconnection) feeding the existing reader UI.

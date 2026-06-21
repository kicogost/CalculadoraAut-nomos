# api/ — serverless function contracts

Vercel serverless functions (Node, autoscaling, pay-per-invocation). One exists
today (`extract`); the other three are planned (Phases 2–3 in `ARCHITECTURE.md`).
They exist for the few things the client can't do safely: hold secrets, take
payments, and submit to the AEAT. Everything else (tax math, PDFs) stays client-side.

## Conventions (all functions)

- **POST + JSON** unless noted. Non-POST → `405`.
- **Errors** return `{ "error": "<mensaje en español>" }` with a meaningful status.
- **Secrets** come from Vercel env vars (never the client). See `.env.example`.
- **Auth** (where required): the client sends `Authorization: Bearer <supabase access token>`.
  The function verifies it (Supabase admin `auth.getUser(token)`), giving a trusted
  `user_id`. Never trust a `user_id` from the request body.
- **Entitlement gating** is re-checked **server-side** for paid work — client gating
  is UX only. Read the `entitlements` row with the service-role key.
- **Origin check**: browser-facing endpoints reject requests whose `Origin` isn't our
  deployment (same pattern already in `extract.ts`).

---

## `POST /api/extract` — AI document reader  ✅ built

Extracts invoice/receipt fields from a PDF via Claude.

- **Auth:** none today (origin-checked). Phase 2: require auth + decrement
  `ai_credits` / check Pro.
- **Request:** `{ "fileBase64": string, "mediaType": "application/pdf" }`. Max 3 MB
  (stays under Vercel's body limit after base64).
- **Response:** `{ "fields": { kind, date, counterparty, description, baseAmount,
  ivaRate, ivaAmount, totalAmount, retencionRate, currency, confidence } }`.
- **Env:** `ANTHROPIC_API_KEY` (required), `EXTRACT_MODEL` (default `claude-haiku-4-5`).
- **Errors:** `403` bad origin · `400` missing/non-PDF · `413` too large · `502`
  no structured output · `500` no key / upstream error.

---

## `POST /api/checkout` — create a Stripe Checkout session  ⏳ planned (Phase 2)

- **Auth:** required (Bearer token → `user_id`).
- **Request:** `{ "plan": "pro" | "verifactu" }`.
- **Behavior:** create/reuse the Stripe customer for this user; create a Checkout
  Session — `mode: "payment"` for `pro` (one-time €49), `mode: "subscription"` for
  `verifactu` (annual €49). Put `user_id` in `client_reference_id`/metadata.
- **Response:** `{ "url": string }` → client redirects to it.
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_VERIFACTU`,
  `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`.

---

## `POST /api/stripe-webhook` — Stripe → entitlements  ⏳ planned (Phase 2)

The **only** writer of the `entitlements` table.

- **Auth:** none (Stripe signature instead). Verify with `STRIPE_WEBHOOK_SECRET`.
- **Raw body:** signature verification needs the **unparsed** body — disable body
  parsing for this route (`export const config = { api: { bodyParser: false } }`)
  and read the raw stream.
- **Handle:** `checkout.session.completed` (set `pro = true` or
  `verifactu_until = now + 1y`, and/or add `ai_credits`),
  `customer.subscription.updated/deleted` (extend/expire `verifactu_until`).
- **Write:** upsert `entitlements` for the `user_id` from metadata, using the
  **service-role key** (bypasses RLS). Be **idempotent** (Stripe retries; key on
  event id / dedupe).
- **Response:** `200` to ack (any non-2xx makes Stripe retry).
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
  `VITE_SUPABASE_URL`.

---

## `POST /api/verifactu-submit` — submit a registro to the AEAT  ⏳ planned (Phase 3)

The flagship paid feature. The offline record (huella chain + QR) is already built
and verified (`src/lib/verifactu.ts`); this function does the **remisión**.

- **Auth:** required (Bearer token → `user_id`) **and** entitlement check
  (`verifactu_until >= today`). Reject `402/403` otherwise.
- **Request:** `{ "facturaId": string }` (server reads the factura) or the registro
  payload to submit.
- **Behavior:** build/confirm the `RegistroAlta` XML, sign/submit to the AEAT web
  service. **Requires the user's digital certificate or an apoderamiento** — the
  hard part; design certificate custody carefully (do not store raw certs casually).
- **Response:** `{ "status": "aceptado" | "aceptado_con_errores" | "rechazado",
  "csv"?: string, "detail"?: string }`; persist the result on the factura.
- **Env:** `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, + AEAT/cert config (TBD).
- **Note:** until this ships, the app must not claim full Verifactu compliance
  (see `RESEARCH.md` §8).

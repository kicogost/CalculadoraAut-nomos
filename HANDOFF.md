# HANDOFF.md — developer onboarding (backend / auth / payments)

Welcome. This doc gets you from zero to productive. The frontend + tax engine are
built and tested; **your job is the backend: Supabase auth, cloud sync, Stripe
payments, and (later) the Verifactu submission service.** Read this top to bottom,
then `ARCHITECTURE.md` and `supabase/schema.sql`.

---

## 1. What this is

**Provisio** — a tool for Spanish autónomos that tells them, each month, how much
cash to set aside for taxes (IVA, IRPF/Modelo 130 + Renta, Seguridad Social cuota +
year-end regularización) and shows their real net profit. Plus invoice
generation, a CSV/AI document reader, per-client profitability, and deadline
reminders. Currently a **local-first static SPA**; we're adding cloud accounts.

Read these for context (in order): `README.md`, `ARCHITECTURE.md` (the plan you're
executing), `RESEARCH.md` (where all the tax constants come from — auditable),
`INSIGHTS.md` (user research that drove the roadmap).

## 2. Stack & how to run it

- **Vite + React 19 + TypeScript** (strict), **Tailwind v4**, **Zustand** (state),
  **Dexie/IndexedDB** (local store), **react-pdf** (invoice PDFs), **Vitest** (tests).
- One existing serverless function: `api/extract.ts` (Vercel) — AI document reader,
  calls the Anthropic API with a server-side key.
- Deployed on **Vercel** (static SPA + `/api` functions). `vercel.json` is set up.

```bash
npm install
npm run dev         # localhost:5173
npm test            # 99 tests — keep them green
npm run typecheck   # tsc -b --noEmit — keep it clean
npm run build       # tsc -b && vite build
```

Node 18+. The AI reader needs `ANTHROPIC_API_KEY` in the env (see `.env.example`);
it only runs on Vercel or `vercel dev`, not plain `npm run dev`.

## 3. Repo map

```
src/engine/      PURE tax engine — no UI, no I/O, fully unit-tested. Money in
                 integer cents. Don't add side effects here. (types.ts is the
                 domain model; computeYear.ts is the aggregator; *.test.ts prove it.)
src/lib/         App logic: factura.ts, verifactu.ts, csv.ts, aiReader.ts, ics.ts,
                 clients.ts, countries.ts, obligations.ts (+ tests).
src/db/          db.ts (Dexie schema) + repo.ts (CRUD, JSON/CSV export/import).
                 *** THIS is where cloud sync plugs in. ***
src/store/       useStore.ts (Zustand) — single store; calls db/repo.
src/screens/     Dashboard, FacturasHub, Taxes, AjustesHub, Onboarding, etc.
src/components/  ui.tsx (primitives), FacturaPDF.tsx, Logo.tsx, MoneyInput.tsx.
src/types/       factura.ts, reader.ts.
api/             Vercel serverless functions (extract.ts today).
supabase/        schema.sql — run this in your Supabase project.
```

## 4. How data flows today (and where you come in)

Right now everything is local:

```
UI → useStore (Zustand) → db/repo.ts → Dexie (IndexedDB)
```

The engine is stateless: screens call `useComputation()` (`src/hooks/`) which runs
`computeYear(...)` over the store's invoices/expenses/profile. **You won't touch the
engine or screens.** Your integration seam is **`src/db/repo.ts` + `src/store/useStore.ts`**:
make mutations write-through to Supabase and hydrate from it on login.

Target flow:

```
UI → useStore → repo (write-through) →  IndexedDB (cache, instant)
                                     └→ Supabase (source of truth) when signed in
on login: pull Supabase → hydrate IndexedDB + store
```

## 5. The cloud design (your build) — summary

Full detail in `ARCHITECTURE.md`. The essentials:

- **Supabase** (EU region — RGPD): Auth (email magic-link + Google), Postgres with
  **Row-Level Security** (`auth.uid() = user_id`) so the SPA talks to Supabase
  directly via `supabase-js` — **no API server to build**. Storage only for rare
  archived PDFs.
- **Source of truth = Supabase; IndexedDB = disposable cache.** Clearing the cache
  loses nothing for a signed-in user — log in, it re-syncs. (This is the fix for the
  current local-only data-loss risk.)
- **Compute stays in the browser** (tax engine + PDF). Never move it server-side —
  it's why the app scales cheaply. Store **data, not PDFs** (regenerate client-side).
- **Stripe** for payments → webhook writes the `entitlements` table (service-role
  key). Pricing: one-time **Pro €49** + annual **Verifactu €49/yr** + AI credits.
- **Affiliates, not data-selling** (RGPD + trust). Targeted client-side.

Schema + RLS are ready in `supabase/schema.sql` and mirror the TS types in
`src/engine/types.ts` and `src/types/factura.ts`.

## 6. Your first tasks (Phase 1: auth + cloud sync)

1. **Create the Supabase project (EU region)**, run `supabase/schema.sql`, enable
   email + Google auth. Send the owner the Project URL + anon key (public/safe).
2. `npm i @supabase/supabase-js`; add `src/lib/supabase.ts` reading
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. **Auth UI**: a login screen/modal (magic-link + Google) + a session context. The
   app already gates on `onboardingDone`; add an auth gate alongside (allow
   anonymous local use, with a "sign in to sync/back up" nudge).
4. **Cloud-aware repo**: in `src/db/repo.ts` / `src/store/useStore.ts`, when a
   session exists, write-through every mutation (add/update/delete invoice, expense,
   factura, profile, settings) to Supabase **and** Dexie; on login, pull all rows →
   hydrate. Use per-row `updated_at` last-write-wins.
5. **Sync status + safety**: a "Guardado en la nube ✓ / cambios sin sincronizar"
   indicator; flush pending writes on reconnect.
6. **On-signup migration**: upload any existing anonymous local data into the new
   account (one-time) so nothing entered before signup is lost.
7. **Account settings**: add account deletion (RGPD) next to the existing JSON
   export in `src/screens/Settings.tsx`.

Phases 2 (Stripe + entitlements) and 3 (Verifactu submission) follow — see
`ARCHITECTURE.md` §Build phases. Stripe webhook + Verifactu submission are new
functions under `api/`.

## 7. Invariants — please don't break these

- **Engine stays pure.** `src/engine/*` has no UI/IO/side-effects and is the
  correctness core (tax math verified against official sources in `RESEARCH.md`,
  Verifactu hash verified against AEAT test vectors). Don't add network/storage there.
- **Money is integer cents** everywhere; never floats. Format only at display.
- **Don't rename the IndexedDB store id or backup key** (`'calculadora-autonomos'`
  in `db.ts`/`repo.ts`) — they're data keys; renaming orphans users' local data and
  breaks JSON import.
- **Don't move computation server-side**, and **store data, not PDFs.** These are
  the cost/scale guarantees.
- **Secrets stay server-side**: the Anthropic key, the Supabase **service-role** key
  (webhook only), and Stripe secret live in Vercel env, never in the client bundle.
  The client only ever gets the Supabase **anon** key (RLS-protected).
- **`entitlements` is client-read-only**; only the Stripe webhook writes it.
- **EU data residency** (Supabase EU region) — Spanish financial data, RGPD.
- **Keep `npm test` green and `npm run typecheck` clean** before committing. Add
  tests for new logic (the repo has good coverage; match the style).
- **Verifactu**: the offline records are correct (`src/lib/verifactu.ts`, verified
  vs AEAT vectors) but **submission to AEAT is NOT built** and needs a digital
  certificate / apoderamiento. Don't ship anything claiming full compliance until
  submission exists. See `RESEARCH.md` §8.

## 8. Env vars

Client (public, `VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Server (secret, Vercel): `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_VERIFACTU`,
`ANTHROPIC_API_KEY` (exists), optional `EXTRACT_MODEL`. See `.env.example`.

## 9. Conventions & workflow

- TypeScript strict; `noUnusedLocals` on — the build fails on unused vars.
- UI text is **Spanish** (es-ES); code/comments English.
- Tailwind v4 with design tokens in `src/index.css` (the whole look is CSS
  variables — see the Provisio palette; ink = interactive, lime = sparing accent).
- Commit messages: imperative summary + why. Branch off `main`; PRs welcome.
- Repo: github.com/kicogost/CalculadoraAut-nomos.

Questions: start with `ARCHITECTURE.md` (the plan) and `supabase/schema.sql` (the
data model). Ping the owner for the Supabase/Stripe accounts and the Verifactu
certificate path.

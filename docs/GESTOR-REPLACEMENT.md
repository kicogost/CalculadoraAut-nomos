# GESTOR-REPLACEMENT.md — the north star

The goal: for the **routine fiscal life of a standard autónomo**, replace the
gestoría — and do it **extremely simply and automatically**. This doc is the
yardstick every future feature is judged against.

> **The one test for any feature:** *does it remove user effort toward
> "connect once → review → done"?* Coverage we already have; **effort** is the gap.

## Two axes (don't confuse them)

- **Coverage** — does the tool address the task? **~75–80%** of a simple autónomo's
  routine work today.
- **Automation / simplicity** — how little the user does? **~50%.** The user still
  enters/imports data and self-files. A gestor's real appeal is "I send stuff and
  forget it." Closing *this* axis is the mission.

A better, cheaper, real-time tool that still makes the user do the work is **not** a
gestor replacement. Effortlessness is the product.

## Scorecard — the gestor's jobs vs Provisio

| Gestor job | Status | Notes |
|---|---|---|
| Net profit & "cuánto apartar" | ✅ Better | real-time, legible — gestores don't even do this |
| Bookkeeping (record/classify) | ◐ Partial | manual + CSV + AI PDF, but **user-driven** → bank sync closes it |
| Prepare 303 / 130 / 349 / 390 | ✅ Done | casilla-a-casilla, box-verified |
| **Submit** to Hacienda | ✗ | user self-files w/ Cl@ve → one-click submission closes it |
| Verifactu invoicing | ◐ Prepare | huella+QR done; submission pending |
| Renta (Modelo 100) | ◐ Assist | scoped assist-only (see `MODELO-100.md`) |
| Alta/baja, employees, módulos, foral | ✗ | refer, don't build |
| Advice, representation, fixing errors, liability | ✗ | refer, don't build (estimation tool by design) |

## The two pillars that close the effort gap

Everything else is polish. These two turn "great assistant" into "gestor replacement":

1. **Bank auto-sync (open banking).** Connect the bank once → income/expenses flow in
   automatically, AI-classified → deletes most manual bookkeeping. Plan:
   `docs/BANK-SYNC.md` (one aggregator, not per-bank).
2. **One-click submission.** Turn "here are the casillas, file with your Cl@ve" into
   "tap to present." Plan: `docs/FILING.md` Phase 3 (certificate/apoderamiento,
   shared infra with Verifactu submission).

Add a thin **proactive quarterly flow** on top — *"Tu 303 del 1T está listo: revisa y
presenta"* — and the experience becomes: **connect bank once → review a pre-filled
quarter → tap submit.** That's the gestor replacement for the simple autónomo:
instant, private, ~€49 vs ~€840/yr.

## Refer, don't build (deliberately out of scope)

Chasing these dilutes "simple" and adds liability. **Partner or refer** instead:

- Alta/baja con Hacienda y Seguridad Social.
- Employees / retenciones (111, 115, 190).
- Módulos (estimación objetiva), foral regimes (País Vasco, Navarra).
- The **full** Renta, complex deductions, asset sales.
- Representation before Hacienda (requerimientos, inspecciones), and **personalized
  advice with professional liability**.

The research showed autónomos distrust gestores but still need a human for the messy
~10%. Let that be a **referral** (a clean export + a partner), not your core. The
"do-it-for-you at scale" path (colaboración social) is a **business decision**, not a
feature — see `FILING.md` Phase 3-social.

## Sequencing toward the north star

1. **Backend** — Supabase auth + cloud sync (`ARCHITECTURE.md` Phase 1). Unblocks
   everything; fixes the data-loss risk; gives accounts/history.
2. **Payments** — Stripe + entitlements (Phase 2), to gate the premium automation.
3. **Pillar 1 — bank auto-sync** (`BANK-SYNC.md`), the biggest effort-remover.
4. **Pillar 2 — one-click submission** (`FILING.md` Phase 3), shared infra with
   Verifactu.
5. **Proactive flow** — quarterly "ready to file" nudges; reminders already exist.

## Honest status line

> Today Provisio **replaces the gestor for understanding and preparing** a standard
> autónomo's routine taxes — instantly and far cheaper. It is **not yet hands-off**:
> the user still feeds data and self-files. **Bank auto-sync + one-click submission**
> are the two builds that make it set-it-and-forget-it. Some gestor functions
> (alta/baja, complex cases, full Renta, representation, advice) we deliberately
> **refer rather than replace**.

## Related docs
`ARCHITECTURE.md` · `BANK-SYNC.md` · `FILING.md` · `MODELO-100.md` · `RESEARCH.md` ·
`INSIGHTS.md` · `HANDOFF.md` · `api/README.md`

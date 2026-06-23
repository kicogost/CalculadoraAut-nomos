# MODELO-100.md — scope for the Renta (IRPF annual return)

Scoping doc, not a build. Modelo 100 is the boundary where Provisio **assists** but
deliberately does **not** replace the gestor. This defines exactly how far we go.

## What Modelo 100 is

The annual personal income tax return (Declaración de la Renta). It covers a
person's **entire** income for the year, not just their autónomo activity:

- Rendimientos del **trabajo** (employment)
- **Rendimientos de actividades económicas** ← the autónomo part (our scope)
- Rendimientos del **capital mobiliario** (dividends, interest)
- Rendimientos del **capital inmobiliario** (rentals)
- **Ganancias y pérdidas patrimoniales** (asset sales, crypto, funds)
- Full **mínimo personal y familiar**, and a long list of **deducciones** (estatales
  y autonómicas, vivienda, donativos, planes de pensiones, maternidad…)
- Reconciliation of **pagos a cuenta**: the Modelo 130 payments + retenciones already
  made during the year.

Crucially, the AEAT's **Renta WEB** already pre-fills most of this from the
taxpayer's *datos fiscales* (employer reports, bank reports, the 130s, etc.). So the
job isn't "compute the Renta from scratch" — it's "feed the autónomo section
correctly and reconcile."

## What we already have (engine)

The engine computes, for the autónomo activity, exactly what the actividades-
económicas section needs:
- **Rendimiento neto** = ingresos computables − gastos deducibles (incl. cuota) −
  gastos de difícil justificación (estimación directa simplificada).
- An **IRPF estimate** (state + autonomic scales + mínimo) and the **set-aside**.
- The year's **Modelo 130 payments** and **retenciones** suffered (for reconciliation).

What we do **not** have: the person's other income, their full deductions, or their
complete family situation — so any "Renta result" we show is, by construction, a
**partial estimate of the autónomo portion**, not the final tax.

## Scope — three tiers

### Tier A — "Resumen para tu Renta" (assist) — recommended, low risk
A read-only summary the user hands to their gestor or types into Renta WEB's
actividades-económicas section:
- Rendimiento neto de actividades económicas (with the ingresos / gastos /
  difícil-justificación breakdown).
- Modelo 130 pagado en el año + retenciones soportadas (the pagos a cuenta to
  reconcile against the Renta result).
- Our IRPF estimate + the clear caveat that the real Renta depends on their other
  income/deductions.
- Export to PDF/CSV.

Effort: small (we have all the numbers). Risk: low (informative; no box claims).
Value: closes the annual loop — the user walks into the Renta knowing their
autónomo numbers and what they've prepaid.

### Tier B — casilla mapping for the actividades-económicas section — optional
Map our figures to the specific Renta boxes for *rendimientos de actividades
económicas en estimación directa*. Caveats: **Renta box numbers change yearly** and
must be re-verified each campaign, and **Renta WEB usually pre-fills these from the
130s anyway**, so the ROI is moderate. Do it only if users ask; treat box numbers
like the 303/130 work (verify against the official Renta manual, don't guess).

### Tier C — file the Renta for the user — out of scope
Full Renta filing requires handling all income types, the full deduction logic, and
professional responsibility → that's the **gestoría / colaboración social** boundary
(see `docs/FILING.md` Phase 3-social). Not a feature.

## What NOT to do
- Don't try to **compute or replace the full Renta** — we only see the autónomo
  slice; presenting a "final tax" would be wrong and erode trust.
- Don't **assert Renta box numbers** without per-year verification against the
  official manual.
- Don't imply the autónomo IRPF estimate **is** the Renta result — always frame it
  as a partial estimate to fund and confirm.

## Dependencies / open questions
- Whether Renta WEB exposes any **programmatic import** for the actividades-
  económicas boxes (research; likely it just pre-fills from the 130s).
- Which **autonomic deductions** (per comunidad) are worth surfacing — large, year-
  versioned; probably out of scope beyond linking to the official list.

## Recommendation
Build **Tier A** when the annual loop matters (around Renta campaign, ~Apr–Jun) —
it's cheap, honest, and genuinely useful. Treat **Tier B** as optional and only with
per-year box verification. **Tier C is never** an in-app feature; it's the line where
a gestor (or our future colaboración-social offering) takes over.

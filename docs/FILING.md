# FILING.md — helping users file their AEAT models

How Provisio takes users from "the numbers are computed" to "the model is filed",
in increasing order of regulatory weight. The principle: **prepare everything;
let the user submit with their own Cl@ve/certificate** until we deliberately step
up to filing-on-behalf.

## Phase 1 — casilla-a-casilla view  ✅ shipped

`src/lib/casillas.ts` maps the engine's figures to the **official AEAT box numbers**;
`src/components/CasillasView.tsx` renders them in the Impuestos screen with copy
buttons and a quarter/model selector. The user copies each value into the AEAT
form and submits with their own Cl@ve/certificate. Low regulatory exposure (the
user is the filer), high value (the subs say the quarterly forms are "sencillos
pero parecen difíciles").

**Box numbers (verified against AEAT instructions):**

- **Modelo 130** (estimación directa): 01 ingresos · 02 gastos · 03 rendimiento
  (01−02) · 04 cuota (20% del positivo de 03) · 05 pagos fraccionados previos ·
  06 retenciones · 07 resultado (04−05−06) · 19 resultado a ingresar. Boxes 13
  (minoración rentas bajas), 16 (deducción vivienda), 18 (complementaria) left
  blank unless they apply.
- **Modelo 303** (IVA, régimen general): rate rows 01/02/03, 04/05/06, 07/08/09
  (base/tipo/cuota) · 27 total cuota devengada · 28/29 IVA deducible op. interiores
  · 45 total a deducir · 46 resultado régimen general (27−45) · 71 resultado ·
  72 a compensar / 73 a devolver (4T) · 120 operaciones no sujetas por localización
  (export/EU services).
- **Modelo 349** (recapitulativa UE): per-EU-client rows with base + clave S
  (prestaciones de servicios); NIF-IVA prompted (not stored on income invoices).
- **Modelo 390** (resumen anual IVA): devengado régimen ordinario 01/02 (4%), 03/04
  (10%), 05/06 (21%) · 47 total cuotas · 48/49 deducible op. interiores corrientes ·
  65 resultado régimen general · 86 resultado liquidación · 99 volumen régimen
  general. (SII filers and quarterly simplificado/urban-rental-only filers are
  exempt from 390.)

**Known limitations (flagged in-app):**
- Export (no sujeto) and intracom (UE) operations are **not** auto-placed into the
  informative 303 boxes (e.g. 120/123, 59/60) — they're flagged "revisar", because
  mis-placing them causes errors. A future pass can map these precisely.
- Modelo 303 special regimes (recargo de equivalencia, criterio de caja, bienes de
  inversión beyond corrientes) are out of scope of the v1 mapping.

## Phase 1.5 — predeclaración / import files  ○ next

Generate the AEAT **import file** (the per-model "predeclaración" format) so the
user imports it into the AEAT web form in one step instead of copying boxes. These
formats are fixed-layout and **version-specific per year**; build against the exact
AEAT spec and test imports in the AEAT pre-production portal before shipping. Start
with 303 and 130 (the import-supported, high-volume models).

## Phase 2 — one-click submission (premium "lo presentamos por ti")  ○

Submit directly to the AEAT presentation **web service**. Requires the user's
**digital certificate** or an **apoderamiento** (power of representation registered
with the AEAT for the specific procedure). **This is the same infrastructure as the
Verifactu submission service** (`api/verifactu-submit`, see `api/README.md` and
`RESEARCH.md` §8) — certificate handling + AEAT web service. Build it once, reuse
for Verifactu and for model filing. Gate behind the paid Verifactu tier.

Add a mandatory **review-and-approve** step before any submission — filing wrong =
fines for the user (a recurring fear in the research). Never file silently.

## Phase 3 — colaboración social / gestoría partnership  ○ (business decision)

To file at scale on behalf of users without each one's certificate, register as a
**colaborador social** (or partner with a licensed asesoría). This is how
TaxScouts/Taxfix and Declarando operate (a human advisor submits). It turns
Provisio into / pairs it with a fiscal-services firm: more liability and overhead,
but the deepest "done for you" offering.

## Modelo 100 (Renta) — deliberately not fully automated

100 is the user's **entire** personal income tax return (employment, capital, real
estate, family circumstances…), of which the autónomo activity is one section — and
the AEAT already pre-fills most of it via **Renta WEB / datos fiscales**. Plan:
help with the *rendimiento de actividades económicas* section + the annual set-aside,
and export/guide into Renta WEB. Fully replacing Renta is the boundary where you'd
need to be (or partner with) a gestoría.

**Full scope in [`docs/MODELO-100.md`](./MODELO-100.md)** — three tiers: A (assist:
"Resumen para tu Renta", recommended), B (box mapping, optional, per-year
verification), C (file it — out of scope / gestoría territory).

## Why this ordering

It tracks value-per-effort and regulatory risk: Phase 1 ships today with the engine
we already trust; import files are a contained next step; submission is the heavy,
licensed-adjacent build that doubles as the Verifactu service; colaboración social
is a company-level decision, not a feature.

---

## Research & testing checklist (Phases 2, 3, 5)

> All AEAT specifics below (endpoint names, file layouts, procedure/apoderamiento
> codes, whether 303/130 accept a documented import file) must be **confirmed
> against current AEAT documentation** — they are year-versioned and not asserted
> here from memory. The single most important shared asset for Phases 2–3 is the
> **AEAT preproducción (pruebas) environment + test certificates** — almost all
> testing happens there before touching production.

### Phase 2 — Import files (predeclaración) — *safe to do next; no legal exposure*

Research / specs to obtain (per model, per year):
- The exact **"diseño de registro"** (import layout). Confirm which models accept a
  documented file: informative models (e.g. 349) publish clean fixed-width designs;
  303/130 import via the **Pre303/Pre130** web forms — confirm the accepted format.
- Per field: **position, length, type (num/alfa), decimals & sign, padding,
  encoding (ISO-8859-1 vs UTF-8), record types (tipo 1/tipo 2), line terminators.**
- An **official example file** to diff against (the gold check).

Testing:
- Generate → **import into the AEAT web form** (loads without submitting) → confirm
  every value lands in the right box.
- Edge cases: negative / "a compensar" results, multiple IVA rates, empty quarters,
  accents/special chars in names (349), large amounts.
- **Re-verify every January.**

Prereqs: a Cl@ve/certificate just to log in and test the import (no submission).
Gotcha: an outdated/off layout silently fails or loads wrong values → the
example-file diff + portal load test are non-negotiable.

### Phase 3 — One-click submission — *gated on the legal model; shared infra with Verifactu*

Research:
- The **"presentación por servicios web"** spec per model: endpoint/WSDL (or REST),
  **request XSD**, SOAP envelope, **certificate-based mutual-TLS auth**.
- The **Verifactu/SIF submission** web service (endpoints, envelope, registro XML
  schema) — same plumbing; research together (`api/verifactu-submit`, `RESEARCH.md` §8).
- The **representation model**: apoderamiento (which *procedimiento* code maps to
  filing 303/130; how a user grants it) vs colaboración social (Phase 3-social).
  Decide whether to ever hold a user's certificate — **ideally never** (use
  apoderamiento + a representative cert, or sign client-side).
- Certificate procurement (FNMT / representative / sello) + **test certificates**.

Testing (preproducción first):
- End-to-end submit of dummy declarations with test certs; parse the **acceptance
  response** (`aceptado` / `aceptado con errores` / `rechazado` + CSV).
- Verifactu: confirm the **huella chain is accepted** (we already match AEAT's hash
  vectors) and duplicate/idempotency handling.
- Security: certificate custody (no key leakage), audit logging, and the mandatory
  **review-and-approve gate** before any real filing.

Prereqs: AEAT web-service + preproducción access; test certs; for production, a
real apoderamiento / colaborador-social registration, a legal entity, and
**professional liability cover + a fiscal-advisor / legal review**.
Gotcha: real legal responsibility starts here (wrong filings = client fines).

### Phase 5 — Modelo 100 (Renta) — *accuracy validation, not submission*

Research:
- Mapping the engine's outputs into the **"rendimientos de actividades económicas
  en estimación directa"** section of Modelo 100; whether **Renta WEB** offers any
  programmatic import (mostly AEAT pre-fills via *datos fiscales* → target is
  prepare + guide, not file).
- IRPF reductions/deductions not yet modelled that affect the autónomo section.
- What a clean **export to hand to a gestor / paste into Renta WEB** should contain.

Testing:
- Compute the *rendimiento de actividades económicas* for several profiles and
  **compare against the actual Renta WEB result** (cent-for-cent).
- Sanity-check a few real returns against a **gestor's** numbers.

Prereqs: Renta WEB access (campaign only, ~Apr–Jun) with test data; ideally a
gestor to validate. Scope: the test is "does our number equal Renta WEB's?", not
end-to-end filing.

### Who does what
- **Developer:** Phase 2 (file layout + portal load tests) and Phase 3 (web-service
  integration + preproducción submission + certificate handling).
- **Owner:** Phase 3 legal track (certificate procurement, apoderamiento vs
  colaboración social, liability cover, fiscal-advisor review); Phase 5 gestor
  validation.
- Do **Phase 2 next** (no legal exposure). Resolve **apoderamiento vs colaboración
  social before building Phase 3.** Phase 5 is mainly accuracy validation vs Renta WEB.

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
  72 a compensar / 73 a devolver (4T).

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

## Why this ordering

It tracks value-per-effort and regulatory risk: Phase 1 ships today with the engine
we already trust; import files are a contained next step; submission is the heavy,
licensed-adjacent build that doubles as the Verifactu service; colaboración social
is a company-level decision, not a feature.

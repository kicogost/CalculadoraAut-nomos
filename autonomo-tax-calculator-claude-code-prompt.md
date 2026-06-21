# Build prompt: Spanish Autónomo Tax & Cash-Flow Calculator

> Paste this whole document into Claude Code as the opening brief. Work through it top to bottom. **Do not skip Phase 0 (research).** The quality of this tool depends almost entirely on getting the Spanish tax constants and rules right for the current year, and those move every January. Treat every number in this brief as a *baseline to verify*, not as ground truth.

---

## 0. Mission

Build a local-first web app that lets any Spanish autónomo enter their income and expenses month by month and instantly see:

1. What they are actually earning (gross, net, after-tax take-home).
2. How much cash they must set aside, **right now, this month**, to cover every future tax and Seguridad Social obligation: IVA, IRPF (via Modelo 130 and the annual Renta), the monthly cuota de autónomos, and the year-end Seguridad Social regularización.
3. When each obligation falls due, and how much each quarterly and annual filing will cost.

The core emotional job of this tool: kill the year-end surprise. A Spanish autónomo should open it, log everything, and never again be caught short when Hacienda or the Seguridad Social comes calling.

It must serve two layers of user from one codebase:

- **Layer A, the standard autónomo.** Invoices Spanish and EU clients, charges 21% IVA, may suffer 15% retención on invoices, files 303 / 130 / 349 / 390 / 100. The full domestic picture.
- **Layer B, the export-services autónomo.** Invoices non-EU companies (for example a US company) for services, in which case the income is typically *no sujeto* to Spanish output IVA (place-of-supply rules), suffers no retención (so Modelo 130 becomes mandatory rather than optional), and ends up with IRPF plus Seguridad Social as the dominant set-aside. The tool must handle this case correctly and not assume 21% IVA on every euro.

The same person can have a mix (some export income, some domestic), so model income at the **invoice level** with a client/place-of-supply type, not as one global setting.

---

## 1. Phase 0: research and verification (do this before writing any feature code)

Spend real effort here. Produce a short written `RESEARCH.md` in the repo capturing what you confirmed, the source URL, and the date checked, so the constants are auditable later. Build a single versioned config module (see Section 5) and fill it from this research.

### 1.1 Tax-domain research checklist (verify each against an official or high-quality source for the CURRENT tax year)

Prefer official sources: the **Agencia Tributaria (sede.agenciatributaria.gob.es)**, the **Seguridad Social / Import@ss (importass.seguridad-social.gob.es)**, and the **BOE** for the governing Real Decreto. Cross-check against reputable gestorías (Infoautónomos, Declarando, TaxDown, Holded) but treat them as secondary.

Confirm and record:

**Seguridad Social (RETA):**
- The full 15-tramo table for the current year: each tramo's rendimientos-netos range, minimum base, maximum base, and resulting monthly cuota.
- The combined contribution rate applied to the chosen base (baseline: 31.5% for 2026), and its breakdown (contingencias comunes, profesionales, cese de actividad, formación, MEI).
- The MEI rate for the year (baseline: 0.9% in 2026) and that it rises ~0.1pp per year.
- Tarifa plana: nominal amount, the real amount once MEI is added (baseline: 80 nominal, 88.64 EUR/month in 2026), the first-12-months rule, and the second-12-months prórroga condition (rendimientos netos below SMI).
- The current **SMI** annual figure (baseline: 17,094 EUR for 2026 per RD 126/2026), since it gates the prórroga.
- How the **year-end regularización** works: AEAT reports real rendimientos to the Seguridad Social, which then refunds overpayment or bills underpayment against the tramo the person actually landed in.
- That the cuota de autónomos is itself a **deductible expense** for IRPF.

**IRPF:**
- The **state** general scale for the year (the half that is uniform across Spain). Baseline state-only marginal rates ~9.5 / 12 / 15 / 18.5 / 22.5 / 24.5% across the brackets 0–12,450 / 12,450–20,200 / 20,200–35,200 / 35,200–60,000 / 60,000–300,000 / 300,000+.
- The **autonomic** general scale for **each comunidad autónoma** you support. These differ in number of brackets, thresholds, and rates. At minimum ship Madrid and Illes Balears correct; ideally all 15 common-regime communities. Note that País Vasco and Navarra are foral regimes with their own systems: either implement them properly or clearly mark them as out of scope in v1.
- That the familiar "19 / 24 / 30 / 37 / 45 / 47%" figures are the **combined** reference scale (state + the standard cession autonomic scale), useful only as a sanity check, not the thing to hard-code per community.
- **Mínimo personal y familiar** (baseline general: 5,550 EUR) and how it is applied (it is taxed at the first-bracket rate and subtracted as a credit, not simply deducted from the base; implement the actual mechanic, do not approximate).
- Reductions relevant to autónomos in estimación directa, including the **gastos de difícil justificación**: 5% of rendimiento neto previo, capped at 2,000 EUR/year (estimación directa simplificada). Confirm the current cap.
- Whether estimación directa **simplificada** vs **normal** changes anything you need to model (turnover threshold for simplificada, currently ~600k EUR).
- Módulos (estimación objetiva) can be declared out of scope for v1, but say so explicitly in the UI.

**Modelo 130 (pago fraccionado de IRPF):**
- The rate (baseline: 20% of accumulated net profit for the year to date).
- That it is **cumulative**: each quarter you compute 20% of Jan-to-quarter-end net profit, then subtract prior 130 payments this year and any retenciones already suffered.
- The exemption rule: an autónomo is **not** obliged to file 130 if at least 70% of their income had retención. The export-services user (foreign clients, no retención) therefore **must** file 130. Encode this as a derived flag, and explain it to the user.
- Filing deadlines (Q1 ~Apr 20, Q2 ~Jul 20, Q3 ~Oct 20, Q4 ~Jan 30). Confirm exact dates for the year.

**IVA (Modelo 303 and friends):**
- Standard rate 21%, reduced 10%, superreducido 4%; let the user pick per invoice line, default 21%.
- **Place-of-supply rules for services**, because this is the crux of Layer B:
  - Services to a **business outside the EU** (e.g. US B2B): generally *no sujeto* to Spanish IVA. No output IVA charged.
  - Services to a **business in another EU country**: reverse charge (inversión del sujeto pasivo), no Spanish IVA on the invoice, reported in **Modelo 349**.
  - Services to a **Spanish** client: 21% (or applicable) output IVA charged.
  - B2C and certain service categories have their own rules; keep v1 to the B2B service cases above plus domestic, and flag anything else.
- 303 mechanics: IVA repercutido (output) minus IVA soportado (input/deductible) per quarter, settle the difference. Note that input IVA on expenses tied to non-sujeto export activity has its own deductibility nuances; research and document the simplified stance you take.
- **Modelo 390** (annual IVA summary) and **Modelo 349** (recapitulativa intracomunitaria) as informational filings to surface on the calendar.
- Quarterly deadlines, aligned with 130.

**Retenciones (IRPF withholding on invoices):**
- Standard 15% retención that Spanish business clients withhold from a professional's invoice.
- The reduced **7%** rate available during the year of starting activity and the two following years.
- That foreign clients withhold nothing (relevant to Layer B and to the 130 obligation).

### 1.2 Technical and infrastructure research
- Confirm the current recommended setup for a Vite + React + TypeScript app deployable to Vercel as a static SPA.
- Pick a local-first persistence layer (see Section 5). Verify the API of whatever you choose (for example Dexie for IndexedDB) against current docs.
- Decide on a money library to avoid floating-point errors on currency (for example dinero.js or a minimal integer-cents approach). Verify current API.

### 1.3 Design research
- Look at how the best modern fintech and tax tools present a "set aside this much" number and a cash-flow calendar. Aim for calm, trustworthy, legible. The hero of every screen is one big honest number.

**Output of Phase 0:** a `RESEARCH.md` with confirmed constants + sources + dates, and a populated `taxConfig` module. Only then start building.

---

## 2. Users and the core promise

Write the product so a non-accountant understands it. Two personas:

- **Marta, standard autónoma.** Graphic designer in Valencia. Spanish and EU clients. Charges 21% IVA, suffers 15% retención. Wants to know her real quarterly IVA and IRPF bills and her annual Renta result.
- **Francisco, export-services autónomo.** Operator invoicing a US company in USD-equivalent EUR amounts (this tool is EUR-only, see Section 4). No output IVA, no retención, on tarifa plana in year one. His set-aside is dominated by IRPF + cuota, and he must file Modelo 130. He wants to know exactly what to park each month and when his cuota jumps after tarifa plana ends.

The promise, shown plainly: **"You earned X. Set aside Y. Keep Z. Here is when each bill is due."**

---

## 3. Domain model: the rules to implement

This section is the functional spec for the tax engine. Implement it as **pure functions** over typed inputs, fully unit-tested, with **zero UI dependencies**. All rates and tables come from the versioned `taxConfig` (Section 5), never inline literals.

### 3.1 Seguridad Social (RETA)
- The user has, per year, a Seguridad Social **status**: `tarifa_plana_y1`, `tarifa_plana_y2`, or `tramo_<n>`. **Let the user pick** their tramo/status; do not auto-force it. But the tool must:
  - Show the projected rendimientos netos and **suggest** the matching tramo (with the cuota it implies), which the user can accept or override.
  - **Tell the user when their situation is about to change**, for example: "Your tarifa plana first year ends in May 2027; from June your cuota moves to the tramo for your income, roughly X EUR/month. You can renew for a second year at 80 EUR (88.64 with MEI) only if your net stays under the SMI."
  - Model the monthly cuota as a recurring cost and roll it into both the monthly P&L and the deductible-expenses total.
  - At year end, compute the **regularización**: compare cuotas actually paid against the cuota implied by real rendimientos, and show an estimated refund or extra payment.
- Multi-year aware: first year of activity might be all tarifa plana; later years are tramo-based. The transition can fall mid-year, so handle a year that is partly tarifa plana and partly tramo.

### 3.2 IRPF (the progressive engine)
- Compute **rendimiento neto** = ingresos computables − gastos deducibles. In estimación directa simplificada, subtract **gastos de difícil justificación** (5% of rendimiento neto previo, capped per the verified annual cap) to reach the taxable rendimiento.
- Apply the **state scale** and the **selected comunidad's autonomic scale** separately, then sum, exactly as the real computation does. Do not apply the combined 19–47% scale as a shortcut; that produces wrong results for most communities (Madrid and Balears both differ from the reference).
- Apply the **mínimo personal y familiar** using the real mechanic (it reduces the quota, computed at the bracket rates, not a flat subtraction from the base). Let the user enter basic personal/family circumstances that affect the mínimo (age bands, number of children/dependants, disability), but keep the v1 form short and label assumptions.
- Output: estimated **annual IRPF**, the **average effective rate**, and the **marginal rate** on the next euro (useful and motivating to show).

### 3.3 Comunidad autónoma and the split-year case
- The user picks their comunidad autónoma of fiscal residence for the year. This drives the autonomic scale and any autonomic deductions you choose to support.
- Handle the relocation case: fiscal residence for a year is generally the community where the person spent the most days that year. If a user moves mid-year, let them set the comunidad that will govern the year, with a short note explaining the "most days in the year" rule. Do **not** try to pro-rate two autonomic scales within one year; that is not how it works. One comunidad governs the whole year.

### 3.4 Modelo 130 (quarterly IRPF prepayment)
- Derive whether 130 is **required**: required if less than 70% of income (by amount) suffered retención. Surface the flag and the reason.
- Each quarter, compute: 20% × (accumulated net profit Jan→quarter end) − (prior 130 payments this year) − (retenciones suffered this year to date). Floor at zero (a quarter never produces a negative 130 payment; it carries forward).
- Show each quarter's 130 amount and due date on the calendar. The annual Renta then reconciles 130 payments + retenciones against the real IRPF due.

### 3.5 IVA (Modelo 303)
- Model output IVA **per invoice** based on its place-of-supply type:
  - `domestic_es` → output IVA at the line's rate (default 21%).
  - `eu_b2b` → reverse charge, no output IVA, mark for **Modelo 349**.
  - `non_eu_export` → no sujeto, no output IVA.
  - `domestic_b2c` and others → flag as needing review; keep minimal in v1.
- Model input (deductible) IVA on expenses the user marks as having Spanish IVA.
- Quarterly 303 = output − deductible. Show the quarterly figure and due date.
- Surface **390** (annual IVA) and **349** (if any EU B2B) as calendar items.
- For a pure export user, IVA payable should correctly come out at or near zero, and the tool should say so in plain language rather than silently showing nothing.

### 3.6 Expenses
- Manual entry of real expenses (the user requested this; do **not** auto-estimate expenses). Each expense has: date, amount, category, deductible? (yes/no/partial %), has Spanish input IVA? (and the IVA amount).
- The recurring cuota de autónomos is auto-created as a monthly deductible expense once status is set, so the user does not have to enter it by hand. Make this visible and explain it.
- Keep the IRPF **gastos de difícil justificación** (5%, capped) as a separate engine step on top of entered expenses; do not conflate it with the unrelated Seguridad Social rendimientos calculation.

### 3.7 The set-aside engine (the headline output)
This is the number the whole app exists to produce. For any month, compute the recommended cash to set aside as the sum of the not-yet-paid liabilities attributable to income earned so far this year:

- Provision for **IVA** payable for the current open quarter.
- Provision for **IRPF**: the cleanest approach is to provision against the projected **annual** IRPF (state + autonomic, net of mínimo), pro-rated by income recognised so far, then subtract 130 payments and retenciones already made. Present it as "set aside this much so the annual Renta is fully funded."
- The cuota de autónomos is a paid monthly cost, so it does not need provisioning beyond the month, **except** the estimated **regularización** at year end, which should be provisioned progressively if the user's tramo looks too low for their real income.

Show the set-aside both as a **percentage of income** ("you should be parking ~32% of what you invoice") and as an **absolute EUR figure** for the month. Let the user choose a provisioning style: conservative (round up), exact, or a flat custom percentage. Default to exact.

---

## 4. Currency and timing
- **EUR only.** No FX, no USD conversion in the tool. If a user invoices in another currency, they enter the EUR amount they recognised. State this clearly so the export user knows to convert before entry.
- Let the user choose income recognition basis: **devengo** (accrual, by invoice date) or **criterio de caja / cobro** (cash, by payment date), since it changes which quarter income lands in for 130/303. Default to devengo; make it a setting, and apply it consistently across the engine.

---

## 5. Data model and persistence

**Local-first, no backend, no login in v1.** Everything stays in the browser. This keeps tax data private and makes Vercel deployment trivial (static SPA).

- Persistence: **IndexedDB** (via Dexie or similar) for the entity store; this comfortably handles multi-year data. Avoid `localStorage` for the main store. Provide **export to JSON** and **import from JSON** so the user owns and can back up their data, plus a **CSV export** of invoices and expenses.
- Money: store as **integer cents**, never floats. Format on display.

Core entities (TypeScript):

```ts
type PlaceOfSupply = 'domestic_es' | 'eu_b2b' | 'non_eu_export' | 'domestic_b2c' | 'other';

interface Invoice {
  id: string;
  date: string;            // ISO; used per recognition basis
  paidDate?: string;       // for criterio de caja
  clientName: string;
  amountCents: number;     // base, pre-IVA
  placeOfSupply: PlaceOfSupply;
  ivaRate: number;         // 0, 4, 10, 21
  retencionRate: number;   // 0, 7, 15
  notes?: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  amountCents: number;       // total incl. IVA
  deductiblePct: number;     // 0..100
  inputIvaCents: number;     // 0 if none
  autoGenerated?: boolean;   // e.g. the monthly cuota
  notes?: string;
}

interface YearProfile {
  year: number;
  comunidadAutonoma: string;
  ssStatus: 'tarifa_plana_y1' | 'tarifa_plana_y2' | { tramo: number; baseCents: number };
  ssStatusChanges?: { fromMonth: number; status: /* as above */ }[]; // mid-year transitions
  recognitionBasis: 'devengo' | 'caja';
  estimacionDirecta: 'simplificada' | 'normal';
  personal: { children: number; under3: number; over65: boolean; disabilityPct: number; /* ... */ };
}

// taxConfig is versioned BY YEAR and is the single source of truth for all rates/tables.
interface TaxConfig {
  year: number;
  ss: { tramos: Tramo[]; combinedRate: number; meiRate: number;
        tarifaPlanaMonthlyCents: number; smiAnnualCents: number; };
  irpf: { stateScale: Bracket[]; autonomicScales: Record<string, Bracket[]>;
          minimoPersonalCents: number; difficilCap: { pct: number; capCents: number }; };
  modelo130: { rate: number; retencionExemptionThreshold: number; };
  iva: { standard: number; reduced: number; superReduced: number; };
  retencion: { standard: number; reduced: number; };
  deadlines: { /* quarter and annual filing dates */ };
}
```

Ship `taxConfig` for the current year, and structure the code so adding next year is dropping in a new config object. The engine takes a `TaxConfig` as a parameter; it never reads a global.

---

## 6. Information architecture (screens)

1. **Dashboard.** The hero: this month's set-aside figure (EUR and %), take-home so far this year, and the next upcoming deadline with its estimated amount. A clean cash-flow calendar strip for the year.
2. **Income.** Add/edit invoices. Per-invoice place-of-supply, IVA, retención. Running totals by quarter.
3. **Expenses.** Add/edit expenses with deductibility and input IVA. The auto-generated cuota shows here, clearly labelled.
4. **Taxes / obligations.** Quarter-by-quarter view: 303, 130 (with the required/exempt flag and reason), plus annual 390/349/100 and the SS regularización estimate. Each card shows amount, due date, and a one-line plain-language explanation.
5. **Year & profile.** Pick year, comunidad, SS status (with the suggestion and the "your cuota changes when..." alert), recognition basis, personal circumstances.
6. **Settings / data.** Export/import JSON, CSV export, reset, and the year switcher for multi-year.

Every computed figure has an info affordance that explains, in one or two plain sentences, how it was derived and which rule it comes from. Trust comes from being legible.

---

## 7. Onboarding

A short, skippable first-run flow that configures the first `YearProfile` and routes the two personas correctly:

1. "What year are you setting up?"
2. "Where is your fiscal residence this year?" (comunidad picker, with the most-days-in-the-year note).
3. "Are you in your first years as an autónomo?" → routes to tarifa plana vs tramo, and offers the reduced 7% retención context.
4. "Who do you mostly invoice?" with three plain choices: Spanish clients / EU businesses / non-EU companies (e.g. US). This sets sensible per-invoice defaults and immediately teaches the user their IVA and 130 situation. The export answer should produce a clear explainer: "Your services to a US company are usually not subject to Spanish IVA, and since no one withholds retención, you will need to file Modelo 130. Your main set-aside will be IRPF plus your cuota."
5. "Tarifa plana or a tramo?" with the suggestion based on any income they add.

End onboarding on the dashboard with one sample month pre-filled (clearly marked as sample, one-click clear) so the value is visible immediately.

---

## 8. Frontend design direction
- Calm, modern, trustworthy fintech. Light background, generous whitespace, one strong accent for the primary number and primary action.
- Typography: a clean sans for UI (Inter is a safe default), optionally a serif for big numbers if it stays legible, and a mono for figures/tables so columns align.
- The set-aside number is the visual hero on the dashboard: large, unambiguous, with the % beside it.
- The cash-flow calendar should make "money leaving on these dates" viscerally clear.
- Fully responsive; this will be used on a phone while looking at invoices.
- Accessible: proper contrast, keyboard navigable, labelled inputs.
- **Optional brand mode:** structure colors and fonts as CSS variables / design tokens so the whole look can be reskinned by swapping a tokens file. (If the builder wants the RallyUp look later: light backgrounds, Inter / Instrument Serif / JetBrains Mono, primary blue #3d68f5, with #DDFF4D used only as a sparing accent, sentence case throughout. Default the public tool to a neutral palette, since this is a general autónomo tool, not a RallyUp-branded asset.)

Consult and follow modern frontend-design best practices for spacing, hierarchy, and component states rather than shipping default-looking UI.

---

## 9. Tech stack and infrastructure
- **Vite + React + TypeScript**, static SPA, deployable to **Vercel** with zero server.
- Tailwind (or your preferred utility CSS) driven by design tokens.
- State: React state + a light store (Zustand is fine); persistence through the IndexedDB layer.
- **Tax engine in its own package/folder** (`/engine`), pure and UI-free, with comprehensive unit tests. This separation matters: the engine is the part that must be provably correct and re-verifiable each year.
- Keep it a single deployable app; no auth, no database, no analytics that touch tax data.

---

## 10. Edge cases and validation
- Mid-year SS status change (tarifa plana ending; tramo change after a 2-monthly base modification window).
- A user with mixed income (some export, some domestic) in the same quarter: IVA and the 130/70% test must aggregate correctly.
- The 70% retención test for the 130 exemption, evaluated on amounts, with the resulting required/exempt flag explained.
- Negative quarter for 130 (carries forward, never refunds within 130).
- Year with income but on tarifa plana whose net later exceeds SMI: warn that the second-year prórroga (if claimed) could be clawed back at regularización.
- Comunidad with a foral regime (País Vasco, Navarra): either implement or clearly mark out of scope; never silently apply common-regime scales to them.
- Empty/first-use state, and a year with no data yet.
- Currency rounding: integer cents end to end; verify totals reconcile.

---

## 11. Acceptance criteria (build test cases for these)
1. **Export user, tarifa plana, single comunidad.** All income `non_eu_export`. Engine shows: IVA payable ≈ 0, Modelo 130 **required**, monthly cuota = current tarifa plana figure with MEI, and an IRPF-dominated set-aside. The headline set-aside % lands in a sane range for the income level.
2. **Standard domestic user.** Spanish clients, 21% IVA, 15% retención. Quarterly 303 and 130 both non-zero; 130 correctly nets out retenciones; annual Renta reconciles.
3. **Madrid vs Illes Balears, identical income.** Annual IRPF differs because the autonomic scales differ. Both differ from the naive combined-scale result. (This proves the state+autonomic split is implemented, not faked.)
4. **Mid-year tarifa plana expiry.** A year split between tarifa plana and a tramo computes blended cuota correctly and the dashboard warns ahead of the change.
5. **Regularización.** A user who picked a too-low tramo for their real income sees an estimated extra SS payment at year end.
6. **Multi-year.** Year one all tarifa plana; year two tramo-based. Switching years preserves and isolates data.
7. **Data ownership.** Export JSON, wipe, re-import: state restored exactly.

Each engine number in these cases should be checkable by hand against the rules in Section 3; include the hand-worked expected values in the tests.

---

## 12. Disclaimers and compliance
- Prominent, non-dismissable-on-first-run notice: **"This is an estimation tool, not tax advice (no constituye asesoramiento fiscal). Rates and rules change; verify with a gestor or the Agencia Tributaria before filing."** Keep it visible in the footer too.
- Show the **tax year and the config version** the figures are based on, with the date the constants were last verified, so a user can tell if the tool is current.
- Never present a figure as the exact amount due; always frame as an estimate to fund and verify.

---

## 13. Suggested build sequence
1. Phase 0 research → `RESEARCH.md` + populated `taxConfig` for the current year.
2. The pure tax **engine** + unit tests for all of Section 11. Get this provably right before any UI.
3. Data layer (IndexedDB, entities, JSON/CSV export-import).
4. Core screens: Income, Expenses, Taxes, Dashboard.
5. Year & profile + SS status logic with the change-ahead alerts.
6. Onboarding.
7. Design polish, responsive, accessibility.
8. Deploy to Vercel; verify the export-user and domestic-user acceptance scenarios end to end in the deployed build.

Build the engine first and trust nothing until its tests pass against hand-worked numbers. Everything else is presentation on top of a calculator that has to be right.

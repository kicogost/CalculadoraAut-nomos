# RESEARCH.md — Spanish Autónomo tax constants, tax year 2026

**Verification date: 2026-06-21.** This file records the constants used by the calculator, the
source for each, and the confidence level, so the numbers are auditable and re-verifiable. Every
value here is mirrored in the versioned `taxConfig` module (`src/engine/taxConfig.2026.ts`). When a
new tax year opens (every January), re-verify each item and drop in a new config object.

Primary sources preferred: **Agencia Tributaria** (sede.agenciatributaria.gob.es), **Seguridad
Social / Import@ss** (importass.seguridad-social.gob.es), and the **BOE** for the governing norm.
Gestorías (Infoautónomos, Declarando, TaxDown, Holded) used only as secondary cross-checks.

> ⚠️ This is an estimation tool, not tax advice (*no constituye asesoramiento fiscal*). Rates and
> rules change; verify with a gestor or the Agencia Tributaria before filing.

---

## 1. Seguridad Social (RETA) — 2026

**Governing norm:** Orden PJC/297/2026, de 30 de marzo (BOE-A-2026-7296), effects from 2026-01-01.
The 2026 bases/tramos are **identical to 2025** (PGE 2026 not approved; the 2025 regime was extended
by RD-ley 3/2026). The only substantive change vs 2025 is the **MEI rising 0.80% → 0.90%** and the
general base máxima rising to 5.101,20 €/mes. **Confidence: HIGH.**

### 1.1 The 15-tramo table (bases penny-exact from BOE; cuota = base × 31.5%, derived)

| Tramo | Rendimientos netos €/mes | Base mín €/mes | Base máx €/mes | Cuota mín @31.5% |
|------:|--------------------------|---------------:|---------------:|-----------------:|
| 1  | ≤ 670               | 653,59   | 718,94   | 205,88 |
| 2  | > 670 – ≤ 900       | 718,95   | 900,00   | 226,47 |
| 3  | > 900 – < 1.166,70  | 849,67   | 1.166,70 | 267,65 |
| 4  | ≥ 1.166,70 – ≤ 1.300| 950,98   | 1.300,00 | 299,56 |
| 5  | > 1.300 – ≤ 1.500   | 960,78   | 1.500,00 | 302,65 |
| 6  | > 1.500 – ≤ 1.700   | 960,78   | 1.700,00 | 302,65 |
| 7  | > 1.700 – ≤ 1.850   | 1.143,79 | 1.850,00 | 360,29 |
| 8  | > 1.850 – ≤ 2.030   | 1.209,15 | 2.030,00 | 380,88 |
| 9  | > 2.030 – ≤ 2.330   | 1.274,51 | 2.330,00 | 401,47 |
| 10 | > 2.330 – ≤ 2.760   | 1.356,21 | 2.760,00 | 427,21 |
| 11 | > 2.760 – ≤ 3.190   | 1.437,91 | 3.190,00 | 452,94 |
| 12 | > 3.190 – ≤ 3.620   | 1.519,61 | 3.620,00 | 478,68 |
| 13 | > 3.620 – ≤ 4.050   | 1.601,31 | 4.050,00 | 504,41 |
| 14 | > 4.050 – ≤ 6.000   | 1.732,03 | 5.101,20 | 545,59 |
| 15 | > 6.000             | 1.928,10 | 5.101,20 | 607,35 |

Tramos 1–6 = tabla reducida; 7–15 = tabla general. Boundary nuance: tramo 3 upper bound is strictly
`< 1.166,70`; the value 1.166,70 itself lands in tramo 4. Cuota column is computed (base × rate);
secondary sources vary ±1–2 € by rounding. **Source:** BOE-A-2026-7296 Art. 18.1.

### 1.2 Combined contribution rate — 31.5% (default)

| Component | Rate | Source |
|---|---:|---|
| Contingencias comunes | 28,30% | BOE-A-2026-7296 Art. 18.2.a (HIGH) |
| Contingencias profesionales | 1,30% | BOE-A-2026-7296 Art. 18.2.b (HIGH) |
| MEI | 0,90% | BOE-A-2026-7296 Art. 18.2 (HIGH) |
| **BOE-itemized subtotal** | **30,50%** | |
| Cese de actividad | 0,90% | LGSS framework + secondary (MEDIUM-HIGH) |
| Formación profesional | 0,10% | LGSS framework + secondary (MEDIUM-HIGH) |
| **TOTAL (default)** | **31,50%** | consensus standard rate |

The BOE itemizes only 30.5%; cese (0.90%) + formación (0.10%) reach 31.5% and are effectively
compulsory for the vast majority. **We use 31.5% as the default combined rate.**

### 1.3 MEI — 0.90% (2026)

+0.1pp/year: 2023 0.60 → 2024 0.70 → 2025 0.80 → **2026 0.90** → 2027 1.00 … 1.20% from 2050. Borne
fully by the autónomo. Source: BOE-A-2026-7296 Art. 18.2; Ley 21/2021 + RD-ley 2/2023 (schedule).

### 1.4 Tarifa plana — 80 €/mes nominal (2026)

- **First 12 months:** flat **80 €/mes**, any income level, must be expressly requested at alta.
- **Second 12 months (prórroga):** 80 €/mes **only if rendimientos netos anuales < SMI**; once-only.
- Real amount with MEI commonly cited as **≈ 88,64 €/mes** — *not* in any official source (the cents
  are gestoría consensus with an unreconciled implied-base inconsistency). We store the nominal
  **80 €** as the authoritative figure and surface ≈88,64 € as the informational "with MEI" amount.
- Legal status: RD-ley 13/2022 set 80 € for 2023–2025; extended into 2026 via RD-ley 3/2026 (PGE 2026
  not approved). **Confidence: HIGH it applies; MEDIUM on the exact with-MEI cents.**

Sources: RD-ley 13/2022 (BOE-A-2022-12482); RD-ley 3/2026 (BOE-A-2026-2548).

### 1.5 SMI — 17.094 €/año (2026)

RD 126/2026, de 18 de febrero (BOE-A-2026-3815), effects from 2026-01-01. 1.221 €/mes × 14 pagas;
40,70 €/día. Gates the tarifa plana prórroga. **Confidence: HIGH.**

### 1.6 Regularización (year-end)

Art. 308 LGSS. Autónomo pays monthly on a provisional base; after year-end AEAT communicates real
rendimientos netos to TGSS, which **refunds** overpayment (de oficio, no interest, before 30 April of
the following year) or **bills** the shortfall (payable by the last day of the month following
notification). A shortfall paid becomes an extra deductible expense; a refund reduces the expense.
**Confidence: HIGH.**

### 1.7 Cuota de autónomos is IRPF-deductible

Fully deductible expense for IRPF under estimación directa (normal & simplificada), reducing the
rendimiento neto. Source: AEAT IRPF manual, "Gastos del titular de la actividad"; Art. 28 LIRPF.
**Confidence: HIGH.**

---

## 2. IRPF — 2026

Structural caveat: the AEAT IRPF 2026 manual publishes in 2027 (2026 returns filed in 2027).
"Confirmed for 2026" = confirmed against current law/2025 manual **plus** check that no 2026 norm
changed the figure. All scales stored as `{ upTo, rate }` (rate in %, `upTo: null` = ∞).

### 2.1 State (estatal) general scale — HIGH, unchanged since 2021 (Art. 63.1 Ley 35/2006)

| upTo | rate % |
|-----:|------:|
| 12.450 | 9,5 |
| 20.200 | 12,0 |
| 35.200 | 15,0 |
| 60.000 | 18,5 |
| 300.000 | 22,5 |
| ∞ | 24,5 |

⚠️ The "19/24/30/37/45/47%" table seen on consumer sites is the **combined** state+default-autonomic
scale, NOT the state half. Do not use it as either half.

### 2.2 Autonomic (autonómica) general scales — 2026

Madrid and Illes Balears adversarially verified against primary sources. Others HIGH confidence.
Full bracket tables are in `taxConfig.2026.ts`. Communities covered (common regime): Madrid, Illes
Balears, Andalucía, Cataluña, Comunidad Valenciana, Galicia, Castilla y León, Castilla-La Mancha,
Aragón, Asturias, Cantabria, Extremadura, Murcia, La Rioja, Canarias.

**País Vasco and Navarra are foral regimes — OUT OF SCOPE in v1.** The tool must never silently apply
common-regime scales to them; it marks them out of scope.

Notable 2026 changes verified: **Canarias** deflactated +2.1% (Ley 9/2025, BOE-A-2026-7560 / BOC);
**Asturias** reformed by Ley 3/2025. **Illes Balears** Ley 4/2026 (BOIB 2026-06-13) changed only
deductions/ITP, not the scale.

**⚠️ Open risk — Comunidad Valenciana:** an anteproyecto (public consultation ~June 2026) proposes
lowering the first 8 brackets retroactive to 2026-01-01. Not yet law as of 2026-06-21. We ship the
current (in-force) scale and flag it. Re-check the DOGV after the autumn 2026 session.

### 2.3 Mínimo personal y familiar — HIGH (Arts. 56–61 LIRPF, unchanged since 2015)

| Concept | EUR |
|---|---:|
| Mínimo del contribuyente (general) | 5.550 |
| + > 65 años | +1.150 |
| + > 75 años (acumulativo) | +1.400 |
| Descendiente 1º | 2.400 |
| Descendiente 2º | 2.700 |
| Descendiente 3º | 4.000 |
| Descendiente 4º y siguientes | 4.500 |
| + por descendiente < 3 años | +2.800 |
| Ascendiente > 65 (o discapacitado) | 1.150 |
| + ascendiente > 75 (acumulativo) | +1.400 |
| Discapacidad 33%–64% | 3.000 |
| Discapacidad ≥ 65% | 9.000 |
| + gastos de asistencia (movilidad / ≥65%) | +3.000 |

**Mechanism (implemented, not approximated):** the mínimo is NOT subtracted from the base. The base
liquidable general runs through the scale; the scale is *also* applied to the mínimo amount alone; the
second result is subtracted from the first as a quasi-credit. Done twice — once with the state scale
and once with the autonomic scale — so the mínimo is effectively split 50/50. Net effect: the mínimo
is taxed at the first-bracket rate and removed.

v1 simplification: we apply the **state baseline mínimo to both halves**. Some communities set their
own autonomic mínimo (Andalucía, Asturias, Baleares, Canarias, Galicia, Madrid, La Rioja, Valencia);
using the state baseline slightly understates the benefit there. Documented and labelled in the UI.

### 2.4 Gastos de difícil justificación — 5%, cap 2.000 €/año (2026)

Estimación directa simplificada: 5% of rendimiento neto previo positivo, capped 2.000 €/año. The 7%
was a one-off for 2023 only (DA 56ª Ley 31/2022), reverted to 5% since 2024. **Confidence: HIGH** (by
standing default; no PGE 2026 override exists as of 2026-06-21). Source: RD 439/2007 art. 30.2ª.

### 2.5 Estimación directa simplificada threshold — 600.000 € INCN (prior year). Art. 30 RD 439/2007.

---

## 3. Modelo 130 (pago fraccionado de IRPF) — 2026

- **Rate: 20%** of accumulated rendimiento neto (Jan 1 → quarter end). HIGH (AEAT, page dated
  2026-04-30).
- **Cumulative:** each quarter = 20% × YTD net − prior 130 payments this year − retenciones suffered
  YTD. Floored at zero (never negative; carries forward). HIGH.
- **70% exemption:** not obliged to file 130 if ≥70% of activity income had retención (prior calendar
  year; for a new activity, tested in the quarter itself). The export-services user (foreign clients,
  no retención) is therefore **required** to file 130. HIGH.

Source: AEAT folleto Actividades Económicas / pagos fraccionados.

---

## 4. IVA (Modelo 303 + 349 + 390) — 2026

- **Rates:** general **21%**, reducido **10%**, superreducido **4%** (all unchanged; AEAT page updated
  2026-06-02). HIGH.
- **Place-of-supply, B2B general-rule services** (Art. 69.Uno.1.º LIVA):
  - Business **outside the EU** (e.g. US) → **no sujeto** to Spanish IVA, no output IVA (303 box 120;
    not in 349).
  - Business in **another EU country** → **reverse charge** (inversión del sujeto pasivo), no Spanish
    IVA; requires ROI/VIES; reported in **Modelo 349** (clave S).
  - **Spanish** client → 21% (or reduced) output IVA.
  - Terminology: the non-EU/EU B2B case is **"no sujeto"**, not "exento".
- **303 mechanics:** quarterly result = IVA repercutido − IVA soportado deducible. Input IVA tied to
  non-sujeto export-of-services activity **is still deductible** (Art. 94.Uno.2.º LIVA). HIGH.
- **Modelo 390:** annual IVA summary, informative, filed first 30 days of January. **Modelo 349:**
  recapitulative intra-EU declaration, quarterly by default (monthly if > 50.000 € intra-EU in the
  quarter or any of the 4 preceding). HIGH.

---

## 5. Retenciones (IRPF withholding on professional invoices) — 2026

- **Standard 15%** withheld by Spanish business/professional clients (RD 439/2007 art. 95.1). HIGH.
- **Reduced 7%** in the year activity begins + the two following years; condition: no professional
  activity in the prior year; must notify the payer in writing. HIGH.
- **Foreign clients withhold nothing** — withholding obligation falls only on payers established in
  Spain. HIGH (principle). Reinforces the Modelo 130 obligation for export users.
- (15%/7% reduced 60% for Ceuta/Melilla — out of scope, flagged.)

---

## 6. Filing deadlines — 2026

Quarterly (Modelo 130 + 303, aligned):

| Quarter | Period | Deadline | Note |
|---|---|---|---|
| Q1 2026 | Jan–Mar | 2026-04-20 (Mon) | HIGH |
| Q2 2026 | Apr–Jun | 2026-07-20 (Mon) | HIGH |
| Q3 2026 | Jul–Sep | 2026-10-20 (Tue) | HIGH |
| Q4 2026 | Oct–Dec | 2027-02-01 (Mon) | nominal 2027-01-30 is Sat → rolls to Mon; **re-verify against the 2027 calendar when published** |

Annual:
- **Modelo 390** (IVA annual, FY2026): nominal 2027-01-30 → effective 2027-02-01. MEDIUM (2027 calendar
  not yet published).
- **Modelo 349** Q4: same as Q4 quarterly.
- **Modelo 100** (Renta FY2026): campaign typically runs ~April–June 2027 (exact 2027 dates TBD).

Source: Calendario del contribuyente 2026 (AEAT). 2027 calendar not yet published as of 2026-06-21;
Q4/annual dates stored as 2027-02-01 and flagged for re-verification.

---

## 7. Open items to re-verify before relying on figures

1. **Comunidad Valenciana** retroactive 2026 rate cut (anteproyecto) — biggest open risk.
2. **Autonomic mínimos** — v1 uses the state baseline for both halves; per-community autonomic mínimos
   not yet modelled.
3. **Q4 2026 / annual 2026 deadlines** — stored as 2027-02-01; re-verify against the 2027 calendar.
4. **Tarifa plana with-MEI cents (≈88,64 €)** — not officially published; nominal 80 € is authoritative.
5. Official seg-social.es / importass pages returned HTTP 403 to automated fetching; SS verification
   rests on the BOE primary text (directly fetched) + secondary sources.

---

## 8. Verifactu (RD 1007/2023 + Orden HAC/1177/2024) — technical records

Implemented offline in `src/lib/verifactu.ts` and verified in `src/lib/verifactu.test.ts`.
**This app generates the records but does NOT submit them to the AEAT** (remisión needs a digital
certificate + the AEAT web service). Obligation for autónomos: **2027-07-01** (companies 2027-01-01).

### 8.1 Huella / hash (registro de alta) — HIGH (verified against AEAT test vectors)

Source: AEAT "Detalle de las especificaciones técnicas para generación de la huella o hash de los
registros de facturación", v0.1.2 (2024-08-27)
(`agenciatributaria.es/static_files/.../Veri-Factu_especificaciones_huella_hash_registros.pdf`).

- Algorithm: **SHA-256**, output **hex uppercase, 64 chars**, input encoded UTF-8.
- Concatenation (alta), values trimmed, `nombre=valor&...`:
  `IDEmisorFactura=…&NumSerieFactura=…&FechaExpedicionFactura=DD-MM-YYYY&TipoFactura=…&CuotaTotal=…&ImporteTotal=…&Huella=<prev|empty>&FechaHoraHusoGenRegistro=<ISO8601 ±HH:MM>`
- Numbers: 1–2 decimals, trailing zeros irrelevant. Empty previous huella for the first record.
- **Official test vector (Caso 1, first record)** → `3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60`; **(Caso 2, chained)** →
  `F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97`. Our implementation reproduces
  both exactly (the correctness anchor).

### 8.2 QR (cotejo) — HIGH

Source: AEAT "Características del QR y especificaciones del servicio de cotejo", v0.5.0
(`agenciatributaria.es/static_files/.../DetalleEspecificacTecnCodigoQRfactura.pdf`); Orden Art. 20–21.

- Content = URL with UTF-8 URL-encoded params `nif`, `numserie`, `fecha` (DD-MM-YYYY), `importe`
  (point decimal). Example: an `&` in numserie → `%26`.
- Endpoints: producción `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR` (verifactu)
  / `…/ValidarQRNoVerifactu`; pruebas `https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR…`.
- QR: ISO/IEC 18004:2015, **error-correction level M**, 30–40 mm, ≥2 mm quiet zone (6 mm rec.), at the
  top of the invoice. Header text above: **"QR tributario:"**; below (verifiable systems):
  **"Factura verificable en la sede electrónica de la AEAT"** or **"VERI*FACTU"**.

### 8.3 Submission — researched, NOT implemented (needs certificate + preproducción testing)

The submission (remisión) is a SOAP 1.1 web service. **Spec located, but not built**: the request XML
must validate against the AEAT XSDs and be tested in preproducción with a certificate — neither of
which can be done from here, so we did not ship guessed XML.

- **Web service description:** AEAT "Veri-Factu_Descripcion_SWeb.pdf" (static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/).
- **Schemas (XSD):** `SuministroInformacion.xsd`, `SuministroLR.xsd`, `RespuestaSuministro.xsd`,
  `xmldsig-core-schema.xsd` (mirrored at github.com/hectorsipe/aeat-verifactu). Operation/message:
  `RegFactuSistemaFacturacion` (input) → `RespuestaRegFactuSistemaFacturacion`.
- **Pre-production SOAP endpoint:** `https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP`.
- **Transport:** HTTPS, SOAP 1.1 document mode, UTF-8; client X.509 certificate (mutual TLS).
- **Still needed to build it:** register the `SistemaInformatico` block (software id/version/instalación),
  generate the `RegistroAlta` XML in exact XSD order (huella/QR already done — `src/lib/verifactu.ts`),
  sign where required, and validate end-to-end in preproducción. Plus registro de evento and anulación.

The huella for anulación is in the spec but not wired into the UI (alta only).

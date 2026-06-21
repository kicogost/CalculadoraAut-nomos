# INSIGHTS.md — what Spanish autónomos actually struggle with

Product research distilled from two subreddits, used to prioritise Provisio's roadmap.
**Not** market research in the statistical sense — it's a qualitative read of what people post about,
how much, and how strongly it resonates (comments/upvotes).

## Method & data

- **Sources:** r/AutonomosES and r/autonomos. Reddit blocks this server's IP for direct scraping, so
  posts were pulled from the **Arctic Shift** community archive (`arctic-shift.photon-reddit.com`).
- **Corpus:** **928 posts** total — **696** from r/AutonomosES (2025-06-12 → 2026-06-20, the sub's full
  history) and **232** from r/autonomos (2023-02-20 → 2026-06-20; sparser archive coverage on older
  dates). Each post = title + body. Comments not included (post bodies already carry the pain points).
- **Analysis:** keyword frequency, flair distribution, top posts by comments/score, and manual reading
  of the most product-relevant threads.
- **Caveats:** self-selection (people post problems, not contentment); a young/active sub skews recent;
  keyword counts undercount paraphrases. Treat percentages as *relative emphasis*, not precise rates.

## Theme frequency (% of posts mentioning the topic)

| Theme | r/AutonomosES (696) | r/autonomos (232) |
|---|---:|---:|
| Facturas / facturación | 24% | **38%** |
| Software / programa / app | 23% | 29% |
| Dudas / ayuda | 22% | 30% |
| Gestor / gestoría | 16% | 16% |
| IVA | 12% | 10% |
| Cuota de autónomos | 9% | 9% |
| Banco / cobro / impago | 8% | 9% |
| IRPF | 8% | 5% |
| Alta / empezar | 8% | 10% |
| **Verifactu** | 5% | **12%** |
| Cliente extranjero / export | 5% | 7% |

The two communities are highly consistent. **Invoicing + the software to do it + Verifactu** dominate,
followed by gestor frustration and the IVA/IRPF/cuota mechanics. Verifactu is roughly **2× more
prominent in r/autonomos** and is its single biggest engagement driver.

---

## The insights that drive the roadmap

### 1. The "silent IRPF hatchet" is the core emotional pain — our thesis is correct
> *"El IRPF es silencioso: ves dinero en la cuenta, crees que es beneficio, te lo gastas… y luego
> llega junio y te quieres morir."* — r/AutonomosES
> *"que 2.090 € se vayan en tasas, impuestos y cuotas es criminal"* (asking neto tras IRPF/IVA/cuota)

The "set aside this much / beneficio neto" hero is exactly what this audience asks for. **✅ shipped**
(it's the product's core), and the positioning now uses their words ("independízate del susto del IRPF").

### 2. Verifactu is the biggest *software* demand — confusion + fear + "is it free?"
> *"Explicadme eso de VeriFactu, porfa… usando palabras que entendería un cachorro de golden retriever"*
> *"Verifactu en 2027: … exige que tu software genere un hash SHA-256 por cada factura, encadenado con
> la anterior"* — r/autonomos (a user explaining the exact thing we implemented)
> *"¿software gratuito de facturación que cumpla Verifactu?"* · *"TPV de pago único, no suscripción, que
> cumpla Verifactu"* · *"¿tendré que cambiar de software con Verifactu?"*

Recurring, high-engagement, and time-boxed (autónomo obligation **2027-07-01**). Whoever offers a
**simple, cheap/free, Verifactu-compliant** invoicer wins this audience. **◐ foundation shipped** —
huella chain + QR generated offline (verified against AEAT test vectors). **Gap:** submission to AEAT
(needs digital certificate + web service).

### 3. Foreign-client & platform/marketplace invoicing is underserved
> *"IVA a empresa extranjera como autónomo"* (UK/Ireland) · *"Recibir pagos en USD, ¿qué banco?"*
> *"Facturar a plataformas extranjeras (Booking, Airbnb, Viator, Upwork, Amazon, Fiverr, TikTok, App
> Store): la guía rápida del IVA"* · *"Cómo facturar legalmente a Viator sin datos de clientes"*

Two distinct needs: (a) **non-EU/EU B2B** export invoicing (no sujeto / reverse charge) — **✅ shipped**
(country → auto place-of-supply, multi-currency PDF); and (b) **marketplace/MoR** invoicing (who's the
real client — the platform or the end customer?), which is a *new* recurring pain we don't address yet.

### 4. Gestor distrust → position around independence and confidence
> *"¿Es realmente necesario tener un gestor?"* · *"pago 70 € al mes y el trabajo está mal hecho"*
> *"harto de ir a una asesoría fiscal, que no te solucionen nada y te cobren"* · *"multas por culpa de
> mi gestor"*

A trustworthy, legible, self-serve view of your own numbers is the wedge. Our sourced, auditable engine
+ the "Impuestos" detail view support this. **✅ partially** (positioning + legibility).

### 5. Strong preference for **free / one-time**, resentment of monthly SaaS
> *"otra cosa más que hay que pagar todos los meses"* · *"me cansé de que me cobrasen por crear facturas"*
> *"software gratuito de por vida, o que lo compres y te olvides… no suscripción"*

Provisio's **local-first, free, no-login** model is a genuine positioning advantage here — lead with it
("gratis, privado, sin suscripción, sin gestor"). **✅ structural** (no backend, data stays local).

### 6. "Per-client profitability / what to charge" recurs
> *"app para calcular la rentabilidad real de mis clientes"* · *"cobrar por hora en 2026 es regalar
> dinero"* · *"¿cuánto debería cobrar por hora?"*

The per-client view (income, % share, real €/hour, concentration warning) is the answer. **✅ shipped**
(Facturas → Clientes).

### 7. Fear of mistakes & missed deadlines
> *"IVA mal declarado"* · *"Multas de Hacienda por haber corregido errores"* · *"declaración trimestral
> presentada con retraso"*

Deadline reminders + a legible obligations calendar address this. **✅ shipped** (countdown card + `.ics`
export with 7/2-day alarms; obligations detail).

### 8. Eligibility / "do I even need to be autónomo?" and onboarding
> *"Facturas sin ser autónomo"* · *"quiero hacerme autónomo pero ya he ganado dinero"* · *"asalariado y
> autónomo a la vez"* · *"si subo un juego a Steam, ¿tengo que darme de alta?"*

A lightweight "¿me compensa darme de alta? / pluriactividad" explainer would catch people *before* they
become users — top-of-funnel content/feature. **○ not built.**

### Market context: crowded with shallow tools
Both subs are full of tool launches (Tweedy, Facturantia, facturameesta, niche TPVs for talleres /
nutricionistas / electricistas) — and the community **dislikes low-effort promo** (*"podemos banear
cuentas que crean un super software nuevo cada día"*). Implication: differentiate on **correctness +
the set-aside + export/Verifactu done right**, and if ever sharing it there, lead with value (open
data, free, local-first), not a pitch.

---

## Status vs. roadmap

| Need (evidence) | Status |
|---|---|
| Set-aside / beneficio neto ("susto del IRPF") | ✅ shipped (core) |
| Per-client profitability / €-hour | ✅ shipped |
| Deadline reminders (.ics + countdown) | ✅ shipped |
| Export / foreign-client invoicing | ✅ shipped |
| Free / local-first / no subscription | ✅ structural |
| Verifactu huella + QR (offline) | ◐ foundation shipped |
| **Verifactu submission to AEAT** | ○ needs certificate + web service |
| **Marketplace/MoR invoicing** (Upwork, Booking, Viator…) | ○ new opportunity |
| **"¿Me compenso dar de alta?" / pluriactividad** explainer | ○ top-of-funnel idea |

### Suggested next bets (evidence-ranked)
1. **Verifactu submission** — the one feature that converts this community; biggest, needs a certificate.
2. **Marketplace/MoR invoice helper** — recurring, almost no tool nails it; cheap to add as guidance +
   invoice presets per platform.
3. **Eligibility/pluriactividad explainer** — top-of-funnel; cheap; catches users early.

---

*Raw data and scripts live in `/tmp` (`autonomos_posts.json`, `autonomos2_posts.json`,
`analyze-autonomos.mjs`, `extract-autonomos.mjs`) — not committed. Re-runnable via the Arctic Shift API.*

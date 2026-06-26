<!--
⚠️ DRAFT — NOT LEGAL ADVICE. Starting point for a Spanish/RGPD lawyer to review.
- Replace every [BRACKETED] placeholder. Confirm the sub-processor list + their
  current locations/safeguards before publishing.
- The BINDING version for users must be in SPANISH.
- Governing framework: RGPD (EU 2016/679) + LOPDGDD (LO 3/2018, Spain).
-->

# Privacy Policy — Provisio

**Last updated: [DATE] · Version [X]**

Provisio is committed to protecting your data. **We never sell your personal data.**
This policy explains what we collect, why, and your rights.

## 1. Data controller

**[LEGAL ENTITY NAME, S.L.]**, CIF **[CIF]**, **[REGISTERED ADDRESS]**.
Privacy contact / DPO: **[privacy@provisio.es]**. **[Appoint a DPO if required — confirm
with lawyer.]**

## 2. Roles (important)

- For your **account and the personal data about you**, we are the **controller**.
- For the **personal data of your clients/suppliers** that you enter to issue invoices
  or keep records, **you are the controller and we are your processor** — governed by
  our **Data Processing Addendum** (part of the Terms). We process that data only to
  provide the Service to you.

## 3. What we collect

| Category | Examples | Source |
|---|---|---|
| Identity & account | name, email, locale, timezone, country | you / Google sign-in |
| Consent & compliance | terms/privacy acceptance timestamps, marketing opt-in, deletion requests | you / the app |
| Fiscal & business data | income, expenses, invoices, clients/suppliers, NIF/VAT IDs, IVA/IRPF data, hours | you (or imported) |
| Uploaded documents | invoice/expense PDFs you submit to the AI reader | you |
| Bank data (Automatización only) | account + transaction data, via the AISP provider, **opt-in** | open-banking provider |
| Payment data | subscription status, last4/billing metadata (**full card handled by Stripe**) | Stripe |
| Technical/usage | device, log, and basic usage data; essential cookies | automatic |

We follow **data minimisation** — only what's needed to run the Service. Please don't
upload special-category data (Art. 9 RGPD) that isn't necessary.

## 4. Why we use it, and our legal basis (Art. 6 RGPD)

| Purpose | Legal basis |
|---|---|
| Provide the Service (accounts, calculations, invoicing, storage, AI reader, bank sync, pre-filling) | **Contract** (Art. 6.1.b) |
| Billing, trials, renewals, fraud prevention | **Contract** + **legitimate interest** (Art. 6.1.f) |
| Security, abuse prevention, service improvement | **Legitimate interest** (6.1.f) |
| Our own legal/accounting obligations (e.g., keeping our invoices to you) | **Legal obligation** (6.1.c) |
| Marketing emails | **Consent** (6.1.a) — opt-in, withdraw anytime |

Bank connection and the AI reader are **optional features**; using them is part of the
contract you choose to activate, and bank connection additionally requires your
explicit authorisation via the provider.

## 5. Who we share it with (sub-processors)

We share data only with providers that process it on our behalf under contract:

| Sub-processor | Purpose | Location / safeguard |
|---|---|---|
| **Supabase** | database, auth, storage | **EU region** (RGPD) |
| **Vercel** | hosting / CDN / serverless | **[CONFIRM region; SCCs if outside EEA]** |
| **Stripe** | payments | EU/US — **SCCs**, PCI-DSS |
| **[Anthropic]** | AI document extraction | US — **SCCs**; **not used to train models** per its API terms |
| **[GoCardless / AISP]** | bank account data (opt-in) | EU — operates under its own AISP licence |
| **[Email/auth provider]** | sign-in links, notifications | **[CONFIRM]** |

We do **not** sell data or share it with advertisers. **[Keep this table current — it's
the canonical sub-processor list; notify users of material changes.]**

## 6. International transfers

Where a processor is outside the EEA, transfers rely on **adequacy decisions or
Standard Contractual Clauses (SCCs)** with appropriate safeguards. Our primary store
(Supabase) is kept in the **EU**.

## 7. How long we keep it

See the [Data Retention & Deletion Policy](DATA-RETENTION.md). In short: while your
account is active, plus the periods required by Spanish tax and commercial law for
records we are legally obliged to keep.

## 8. Your rights (RGPD)

You can **access, rectify, erase, restrict, port, and object** to processing, and
**withdraw consent** at any time, by contacting **[privacy@provisio.es]** or using the
in-app tools (export + account deletion). You may lodge a complaint with the Spanish
authority, the **Agencia Española de Protección de Datos (AEPD)** — www.aepd.es.

## 9. Security

RLS isolates each user's data (row-level `auth.uid() = user_id`); data is encrypted in
transit and at rest; the primary database is in the EU; secrets (service-role/Stripe/AI
keys) are server-side only and never exposed to the browser. No system is perfectly
secure, but we apply appropriate technical and organisational measures.

## 10. AI processing

If you use the AI reader, the document you upload is sent to **[Anthropic]** solely to
extract its data for you; it is **not used to train AI models**. You can choose not to
use this feature and enter data manually.

## 11. Cookies

We use **essential cookies** required to run the Service (e.g., session/auth). **[If you
add analytics, list them here and obtain consent per LSSI/AEPD guidance — or keep to
essential-only and say so.]**

## 12. Children

The Service is not directed to anyone under 18, and we do not knowingly collect their
data.

## 13. Changes

We will post updates here and, for material changes, notify you (email/in-app) and
re-request consent where required.

## 14. Contact

**[LEGAL ENTITY NAME, S.L.]** · **[privacy@provisio.es]** · DPO: **[…]**

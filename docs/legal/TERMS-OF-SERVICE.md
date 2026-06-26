<!--
⚠️ DRAFT — NOT LEGAL ADVICE. Starting point for a Spanish lawyer to review.
- Replace every [BRACKETED] placeholder.
- The BINDING version for users must be in SPANISH (Spanish consumers/autónomos);
  this English draft is for you + your lawyer to work from.
- Have a lawyer confirm the consumer-vs-business distinction (autónomos often act
  as professionals → B2B terms; affects withdrawal rights & liability caps).
-->

# Terms of Service — Provisio

**Last updated: [DATE] · Version [X]**

## 1. Who we are (LSSI-CE identification)

Provisio ("**Provisio**", "**we**", "**us**") is operated by **[LEGAL ENTITY NAME, S.L.]**,
CIF **[CIF]**, registered at **[REGISTERED ADDRESS]**, registered in the **[Registro
Mercantil de …]**. Contact: **[support@provisio.es]**. These Terms govern your use of
the Provisio website and application (the "**Service**"). By creating an account you
accept these Terms and our [Privacy Policy](PRIVACY-POLICY.md).

## 2. What Provisio is — and what it is not

**Provisio is a software tool that helps Spanish autónomos estimate and prepare their
taxes, issue invoices, and organise their income and expenses.** It is **not**:

- **Not tax, legal, accounting or financial advice**, and **not a gestoría or asesoría
  fiscal.** We do not provide professional advice or act as your representative before
  the Agencia Tributaria (AEAT) or any authority.
- **Not a guarantee of correctness.** All calculations (amounts to set aside, IVA,
  IRPF/Modelo 130, Seguridad Social, net profit, casillas, etc.) are **estimates**
  based on the data you enter and our understanding of the rules. They may contain
  errors and may not reflect your full circumstances.

**You are the taxpayer and the responsible party.** You are solely responsible for the
accuracy of your data, for reviewing every figure, for the legal validity of the
invoices you issue, and for the completeness and timely filing of your tax
obligations. For anything beyond routine cases — or any doubt — consult a qualified
asesor fiscal. *(See also the disclaimers in §13.)*

## 3. Eligibility

You must be **at least 18**, have legal capacity, and use the Service for your activity
as an autónomo (or small company) in Spain. You are responsible for keeping your
account credentials secure and for all activity under your account.

## 4. Accounts

You must provide accurate information and keep it up to date. We use Supabase Auth
(email link and/or Google sign-in). You may export your data and delete your account at
any time (see §6 and the [Data Retention & Deletion Policy](DATA-RETENTION.md)).

## 5. Plans, free trial, and billing

- **Free trial.** New subscriptions start with a **14-day free trial. A payment method
  is required** to start the trial. If you do not cancel before the trial ends, your
  paid subscription begins automatically and the selected price is charged.
- **Plans (see [PRICING.md](../PRICING.md)).** **Core — €89/year** (or €8.99/month) and
  **Automatización — €199/year** (or €19.99/month), which adds bank connection and
  one-click pre-filled filing. Prices are stated **[including/excluding] IVA — [CONFIRM]**.
- **Billing & renewal.** Subscriptions **auto-renew** for the same period unless
  cancelled before the renewal date. Payments are processed by **Stripe**; we do not
  store your full card details.
- **Price changes.** We may change prices for future renewal periods with **at least
  [30] days' notice**; changes never apply to a period already paid.

## 6. Cancellation and refunds

You can **cancel anytime** from your account; cancellation takes effect at the **end of
the current paid period**, and you keep access until then. **[Refund policy — CONFIRM
with lawyer:** e.g., no refunds for partial periods except where required by law.**]**

**Right of withdrawal.** Consumers in the EU may have a 14-day right of withdrawal for
digital services. Because Provisio is typically used by autónomos **for their
professional activity**, this right may not apply. **[Lawyer to confirm the
consumer/business treatment and any required withdrawal wording.]**

## 7. Invoicing and Verifactu

The Service helps you create invoices and generate the Verifactu records (hash chain +
QR) on your device. **You are responsible** for the legal validity, numbering,
content, and conservation of the invoices you issue, and for meeting any Verifactu/AEAT
obligations applicable to you. Provisio provides the tooling; it does not certify or
submit invoices on your behalf in v1.

## 8. Bank connection (Automatización plan)

Bank connection is **optional and opt-in**, provided through a regulated third-party
open-banking provider (AISP) **[e.g. GoCardless Bank Account Data]**. You authorise the
connection on the provider's own screens; **we never see or store your bank login
credentials.** The provider operates under its own licence and terms. You can
disconnect at any time.

## 9. Tax-filing assistance

For supported models, Provisio **pre-fills** your forms so you can review them. **You
submit them yourself, authorising the filing with your own Cl@ve or digital
certificate.** Provisio does **not** file on your behalf and is **not** your
apoderado/representative. You remain the taxpayer responsible for what is submitted.

## 10. AI document reader

The optional AI reader extracts data from documents (PDFs) you upload, on a
**best-effort basis**. Extracted data may be wrong; **you must review it** before
relying on it. Documents are processed by our AI sub-processor **[Anthropic]** to
provide this feature (see the Privacy Policy).

## 11. Acceptable use

Don't misuse the Service: no unlawful use, no attempts to breach security or access
other users' data, no reverse engineering except as permitted by law, no automated
scraping or resale, and no uploading of content you have no right to process.

## 12. Intellectual property

We own the Service and its software, brand, and content. **You own your data** (your
fiscal records, invoices, and uploads). You grant us only the limited licence needed to
host and process your data to provide the Service.

## 13. Disclaimers and limitation of liability

- The Service is provided **"as is"** and **"as available"**, without warranty of
  fiscal accuracy, completeness, or fitness for a particular purpose, to the maximum
  extent permitted by law.
- **We are not liable for tax outcomes** — including penalties, surcharges, interest,
  or sanctions from AEAT or any authority — arising from your reliance on estimates,
  data you entered, or filings you submitted. The figures are aids, not advice.
- To the maximum extent permitted by law, our **aggregate liability** for any claim is
  limited to **the amount you paid us in the [12] months** before the event.
- **Nothing limits liability that cannot be excluded by law** (e.g., fraud, gross
  negligence, death/personal injury, or non-waivable consumer rights). **[Lawyer to
  align caps with Spanish consumer/business law.]**

## 14. Indemnity

You agree to hold us harmless from claims arising from your unlawful use of the
Service or your breach of these Terms, to the extent permitted by law.

## 15. Third-party services

The Service relies on third parties (e.g., Supabase, Vercel, Stripe, the AI provider,
the bank aggregator). Their availability and terms are outside our control; we are not
responsible for their acts or outages beyond our reasonable control.

## 16. Processing of third parties' personal data (DPA)

When you store your **clients'/suppliers' personal data** (names, NIF, contact details)
in Provisio, **you are the data controller** and **we act as your processor**. That
processing is governed by our **Data Processing Addendum [LINK / to be drafted]**, which
forms part of these Terms. **[Lawyer: prepare an Art. 28 RGPD DPA.]**

## 17. Suspension and termination

We may suspend or terminate accounts that breach these Terms or the law, or to protect
the Service or other users, with notice where reasonably possible. You may terminate
anytime by cancelling and deleting your account.

## 18. Changes

We may update the Service and these Terms. We will give **reasonable notice** of
material changes (e.g., by email or in-app) and ask you to re-accept where required.
Continued use after changes take effect means acceptance.

## 19. Governing law and disputes

These Terms are governed by **Spanish law**. Mandatory consumer protections of your
country of residence are unaffected. Disputes are subject to the courts of **[CITY,
Spain]**, save for any non-waivable consumer forum rights. EU consumers may also use
the EU Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr.

## 20. Contact

**[LEGAL ENTITY NAME, S.L.]** · **[REGISTERED ADDRESS]** · **[support@provisio.es]**

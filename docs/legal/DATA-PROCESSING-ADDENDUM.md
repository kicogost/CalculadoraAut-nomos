<!--
⚠️ DRAFT — NOT LEGAL ADVICE. Starting point for a Spanish/RGPD lawyer to review.
- Art. 28 RGPD Data Processing Addendum (DPA). Applies when a Provisio user stores
  THEIR clients'/suppliers' personal data in Provisio: the user is CONTROLLER,
  Provisio is PROCESSOR.
- Replace [BRACKETED] placeholders. Keep Annex III (sub-processors) in sync with the
  Privacy Policy. The BINDING version for users must be in SPANISH.
-->

# Data Processing Addendum (DPA) — Provisio

**Last updated: [DATE] · Version [X]** · Forms part of the [Terms of Service](TERMS-OF-SERVICE.md).

This Addendum governs Provisio's processing of personal data **on your behalf** when
you use the Service to store or process the personal data of third parties (e.g., your
clients and suppliers). It applies in addition to the Terms.

## 1. Parties and roles

- **Controller:** you, the Provisio account holder (the autónomo or company).
- **Processor:** **[LEGAL ENTITY NAME, S.L.]** ("Provisio"), CIF **[CIF]**.

Provisio processes such personal data **only on your documented instructions**, which
include your configuration and use of the Service and these Terms. For personal data
**about you** (the account holder), Provisio is the **controller** under the
[Privacy Policy](PRIVACY-POLICY.md) — this DPA does not apply to that.

## 2. Subject matter, duration, nature and purpose

- **Subject matter / purpose:** providing the Service (invoicing, record-keeping,
  calculations, AI extraction, bank-data matching, exports) as instructed by you.
- **Duration:** for the term of your account, plus the deletion/return steps in §10.
- **Nature:** hosting, storage, organisation, retrieval, computation, and deletion of
  personal data by automated means.

## 3. Categories (Annex I)

- **Data subjects:** your clients, suppliers, and contacts.
- **Personal data:** identification and contact data (name, legal name, NIF/VAT ID,
  address, email, phone) and transactional data (amounts, dates, invoice/expense
  details). You agree **not** to enter special-category data (Art. 9 RGPD) unless
  strictly necessary and lawful.

## 4. Provisio's obligations (Art. 28.3 RGPD)

Provisio shall:

1. process the personal data **only on your documented instructions**, including for
   international transfers, unless required by EU/Member-State law (in which case it
   informs you, unless legally prohibited);
2. ensure persons authorised to process are bound by **confidentiality**;
3. implement appropriate **technical and organisational security measures** (Art. 32) —
   see Annex II;
4. respect the conditions for engaging **sub-processors** (§5);
5. **assist you**, by appropriate measures, to respond to **data-subject rights**
   requests (Arts. 12–23);
6. **assist you** with security, breach notification, impact assessments, and prior
   consultation (Arts. 32–36), taking into account the information available to it;
7. at your choice, **delete or return** all personal data at the end of the services
   (§10);
8. make available information needed to demonstrate compliance and allow/contribute to
   **audits** (§8);
9. **notify you without undue delay** after becoming aware of a personal-data breach.

## 5. Sub-processors

You give **general authorisation** for Provisio to engage sub-processors to provide the
Service. The current list is in **Annex III** (kept in sync with the Privacy Policy).
Provisio will (a) impose data-protection obligations equivalent to this DPA on each
sub-processor, and (b) give **at least [30] days' notice** of any new or replacement
sub-processor, during which you may **object on reasonable data-protection grounds**;
if unresolved, you may terminate the affected Service.

## 6. International transfers

Where a sub-processor is outside the EEA, transfers are covered by an **adequacy
decision** or **Standard Contractual Clauses (SCCs)** with supplementary measures as
needed. The primary data store is kept in the **EU**.

## 7. Your obligations (Controller)

You warrant that (a) you have a **lawful basis** to process the personal data you enter,
(b) your instructions are lawful, and (c) you have provided any required notices to your
data subjects.

## 8. Audits

Provisio will make available the information necessary to demonstrate compliance with
Art. 28 and allow for audits, including inspections, by you or an auditor you mandate,
**on reasonable prior notice, no more than [once a year]** (or after a breach), subject
to confidentiality and not disrupting operations. Up-to-date third-party
certifications/reports may be provided to satisfy audit requests where appropriate.

## 9. Personal-data breach

Provisio will notify you **without undue delay** after becoming aware of a breach
affecting your data, with the information reasonably available to help you meet your
Art. 33/34 obligations. **You** are responsible for notifying the AEPD and affected data
subjects where required.

## 10. Deletion or return

On termination, or on your request, Provisio will **delete or return** the personal data
and delete existing copies, within **[30] days**, unless EU/Member-State law requires
storage. Backups are purged on the normal rotation (within **[30–90] days**). See the
[Data Retention & Deletion Policy](DATA-RETENTION.md).

## 11. Liability and precedence

Liability under this DPA is subject to the limitations in the Terms, to the extent
permitted by law. If there is a conflict on data-protection matters, **this DPA
prevails** over the Terms.

---

### Annex I — Details of processing
As described in §§2–3 above.

### Annex II — Security measures (summary)
Row-Level Security isolating each account (`auth.uid() = user_id`); encryption in
transit and at rest; EU-region primary database; least-privilege access; secrets
held server-side only; logging and monitoring; regular backups. **[Lawyer/engineer to
finalise the detailed measures list.]**

### Annex III — Sub-processors
Supabase (DB/auth/storage, EU); Vercel (hosting/CDN); Stripe (payments); **[Anthropic]**
(AI extraction); **[GoCardless/AISP]** (bank data, opt-in); **[email/auth provider]**.
*(Keep identical to the Privacy Policy sub-processor table.)*

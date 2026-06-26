<!--
⚠️ DRAFT — NOT LEGAL ADVICE. Starting point for a Spanish/RGPD lawyer to review.
- Confirm retention periods against current Spanish law (Código de Comercio art. 30;
  LGT tax prescription; RGPD storage-limitation) and each processor's deletion terms.
- The BINDING version for users must be in SPANISH.
- This policy is wired to the schema fields account_deletion_requested_at,
  terms_accepted_at, privacy_policy_accepted_at, marketing_opt_in_at.
-->

# Data Retention & Deletion Policy — Provisio

**Last updated: [DATE] · Version [X]**

We keep personal data only as long as necessary for the purpose it was collected, plus
any period required by law. This policy explains how long, and how deletion works.

## 1. Two kinds of data (the key distinction)

1. **Your data, held for you** (fiscal records, invoices, clients, uploads). It's
   yours — we delete it when you delete your account, subject to §4.
2. **Records we must keep by law** (e.g., the invoices *we* issue to you, and our
   accounting/billing records). We must retain these for the statutory period even
   after you leave — but minimised and access-restricted.

## 2. Retention schedule

| Data | Retention | Basis |
|---|---|---|
| Account & profile | Life of account, then deleted within **[30] days** | storage limitation |
| Your fiscal/business data (income, expenses, invoices, clients) | Life of account; deleted on account deletion (§3–4) | you control it |
| Uploaded documents (AI reader) | Processed then **not retained by the AI provider for training**; stored in your account until you delete them | minimisation |
| Bank connection data (Automatización) | While connected; deleted on disconnect/account deletion | consent + contract |
| Consent records (terms/privacy/marketing timestamps) | Life of account **+ [up to 3] years** after, as proof of consent | legal/defence of claims |
| Our invoices to you + billing/accounting records | **[6] years** (Código de Comercio) / tax periods (LGT) | **legal obligation** |
| `stripe_events` / payment audit log | **[6] years** or as required | legal/accounting |
| Server/security logs | **[90] days** (or as needed for security) | legitimate interest |
| Backups | Purged on the normal backup rotation, within **[30–90] days** | technical |

**[All bracketed periods to be confirmed by the lawyer.]**

## 3. How account deletion works

1. You request deletion in-app (or by email). We record the time in
   `account_deletion_requested_at`.
2. **Grace period of [30] days** during which you can cancel the request and recover
   the account (prevents accidental/loss). We tell you when it starts and ends.
3. After the grace period, we **hard-delete** your account data from the live database
   (cascade on `auth.users`) and **instruct our processors** to delete the
   corresponding data.
4. **Backups** containing the data are overwritten on the normal rotation (within
   **[30–90] days**); we don't restore deleted users from backup except as legally
   required.

## 4. What survives deletion (and why)

- Records we're **legally required** to keep (our invoices to you, accounting/billing,
  fraud/abuse records) — retained for the statutory period, access-restricted, then
  deleted.
- **Aggregated/anonymised** statistics that no longer identify you.

## 5. Export before you delete

You can **export your data** (JSON) at any time from the account screen. We recommend
exporting before deleting, since deletion is irreversible after the grace period.

## 6. Deletion at our processors

| Processor | Deletion handling |
|---|---|
| **Supabase** | cascade delete on `auth.users`; backups rotate out |
| **Stripe** | subscription cancelled; billing records retained by Stripe for legal periods |
| **[Anthropic]** | API inputs not used for training; retention/deletion per its API data policy **[confirm window]** |
| **[GoCardless / AISP]** | bank connection revoked; provider deletes per its terms |
| **[Email/auth provider]** | account/sign-in records deleted **[confirm]** |

## 7. Contact

Requests and questions: **[privacy@provisio.es]** — **[LEGAL ENTITY NAME, S.L.]**.
You may also complain to the **AEPD** (www.aepd.es).

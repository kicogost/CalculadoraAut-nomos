# docs/legal — legal documents (DRAFTS)

⚠️ **All of these are starting drafts, not legal advice.** Before anything goes live:
1. Have a **Spanish lawyer** (RGPD/LOPDGDD + LSSI-CE + consumer law) review them.
2. Fill every **`[BRACKETED]`** placeholder (entity, CIF, address, emails, registro
   mercantil, retention periods, sub-processor regions).
3. The **Spanish versions (`es/`) are the ones that will bind users** — the English
   set is the working reference for you + your lawyer (and any non-Spanish dev).
4. Keep the **sub-processor list** identical across the Privacy Policy and the DPA.

| Document | English (reference) | Español (vinculante) |
|---|---|---|
| Terms of Service | [TERMS-OF-SERVICE.md](TERMS-OF-SERVICE.md) | [es/TERMINOS-DE-SERVICIO.md](es/TERMINOS-DE-SERVICIO.md) |
| Privacy Policy | [PRIVACY-POLICY.md](PRIVACY-POLICY.md) | [es/POLITICA-DE-PRIVACIDAD.md](es/POLITICA-DE-PRIVACIDAD.md) |
| Data Retention & Deletion | [DATA-RETENTION.md](DATA-RETENTION.md) | [es/POLITICA-DE-RETENCION-DE-DATOS.md](es/POLITICA-DE-RETENCION-DE-DATOS.md) |
| Data Processing Addendum (Art. 28) | [DATA-PROCESSING-ADDENDUM.md](DATA-PROCESSING-ADDENDUM.md) | [es/ANEXO-TRATAMIENTO-DATOS.md](es/ANEXO-TRATAMIENTO-DATOS.md) |

**Why a DPA?** When a user stores their *clients'/suppliers'* personal data in Provisio,
the user is the data **controller** and Provisio is the **processor** — Art. 28 RGPD
requires this addendum. It's referenced from the Terms (§16).

These reflect the product decisions in [`../PRICING.md`](../PRICING.md) (subscription
plans, 14-day card-required trial) and [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
(EU-region Supabase, sub-processors, user-files-with-own-Cl@ve filing).

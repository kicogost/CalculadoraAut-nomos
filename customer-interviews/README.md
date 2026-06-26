# customer-interviews — discovery program

Goal: **100 interviews** with autónomos in our ICP to learn what they really want,
*before* we build more — then turn the insight into the product roadmap, a landing
page + waitlist (target **1,000**), and launch.

> Folder is `customer-interviews` (hyphen, filesystem-friendly).

## ICP (who to interview)

- **20–35 years old**, software-native (lives in apps, comfortable switching tools).
- **Autónomo** in Spain (or about to register), in estimación directa (not módulos).
- **Currently uses a gestor** (or a competitor app) and is **open to leaving it.**
- Bonus signal: solo/freelance services, tech/creative/digital, some foreign clients.

**Screener (to qualify a lead, in Spanish):**
> *"¿Eres autónomo, tienes entre 20 y 35, y ahora mismo llevas tus impuestos con un
> gestor o con alguna app? ¿Estarías abierto a cambiar de sistema si encontraras algo
> mejor?"* — If yes to all, they fit. Aim for a mix of recently-registered and
> 2–5-year veterans.

## How to run it

1. Recruit from: r/AutonomosES, Twitter/X, LinkedIn, IG, Discord/Slack communities,
   coworkings, and **referrals at the end of each interview** (snowball).
2. Use the **[INTERVIEW-GUIDE.md](INTERVIEW-GUIDE.md)** — 10–15 min, in Spanish.
3. **Get recorded consent** (line is in the guide). Record with your AI notetaker.
4. After each call, fill **[_TEMPLATE.md](_TEMPLATE.md)** → save as
   `notes/2026-06-30-AUT-001.md` (pseudonym, no real names).
5. Every ~10–15 interviews, update **[SYNTHESIS.md](SYNTHESIS.md)** with patterns.

## Privacy / RGPD (important)

These are real people's data. Therefore:
- **Get explicit recorded consent** before recording (and for storing the notes).
- **Pseudonymise**: use codes (`AUT-001`), not names/emails, in anything committed.
- **Raw recordings & full transcripts are git-ignored** (see `.gitignore`) — keep them
  in a private, access-controlled store, not in the repo. Commit only the
  **pseudonymised template notes** and the synthesis.
- Let people withdraw; delete their data on request.

## Analysis

Code each interview against the themes in the template (current solution, top pains,
cost paid, willingness to pay, switching triggers, objections, memorable quotes). Once
you have ~15–20 transcripts, we can adapt the `tools/review-research` approach to
theme-tag transcripts at scale — ask and I'll build a small analysis script.

## What "done" looks like → next phases

1. **Insight** (this folder) → a ranked list of the pains/jobs that actually matter +
   pricing signal + the words real autónomos use.
2. **Landing page + waitlist** built around those exact words; grow to **1,000**.
3. **Launch** to the waitlist.

The interview findings should feed `docs/GESTOR-REPLACEMENT.md`, `docs/PRICING.md`, and
the roadmap — i.e., this is how we *validate or correct* the hypotheses in those docs.

# review-research — massive-sample competitor reviews

Pulls **thousands** of competitor reviews/mentions across sources and runs theme +
sentiment analysis, so the competitive picture is statistically grounded instead of
a handful of hand-read reviews.

## Run

```bash
cd tools/review-research
npm install
node multi-source.mjs   # Google Play + Apple App Store + Reddit archive (runs anywhere)
node trustpilot.mjs     # Trustpilot — RUN FROM A RESIDENTIAL IP (403 from datacenter/CI)
```

(`review-research.mjs` is the original Play-only script; `multi-source.mjs`
supersedes it.) Shared config + theme map + analysis live in `lib.mjs` — edit the
`COMPETITORS`, `REDDIT_SUBS`, and `THEMES` there once for all scripts.

Outputs (to `/tmp`):
- `all_reviews_multi.csv` — every data point (competitor, source, score, date, text)
- `reviews_multi_<name>.json` — raw per-competitor dump
- `multi-source-analysis.md` — per-competitor: N by source, avg stars, distribution,
  % per theme, top complaint themes within ≤2★, sample negatives
- `last-run.md` (committed) — snapshot of the latest analysis

## The multi-source strategy (why one source isn't enough)

A "massive sample" needs the right source per competitor — **most Spanish autónomo
SaaS is web-first with little or no mobile app**, so Google Play only yields big
samples for mobile-first tools.

| Source | Tool / method | Best for | Notes |
|---|---|---|---|
| **Google Play** | `google-play-scraper` (this script) | mobile-first tools | no API key; pulls all reviews; **works from this machine** |
| **Apple App Store** | `app-store-scraper` (RSS, per country) | iOS users | ~500/country; loop `es,mx,ar,…` for more |
| **Trustpilot** | Business API, or scrape from a **residential IP** | web-first SaaS | blocks datacenter IPs (403) — run locally, not from CI |
| **Capterra / GetApp / G2** | vendor export / careful scrape | B2B reviewers | smaller N, strong anti-bot |
| **Reddit** | Arctic Shift archive API (posts **and** comments) | candid sentiment | `arctic-shift.photon-reddit.com`; Reddit blocks server IPs directly |

For **web-first** competitors (Contasimple, Cuéntica, Declarando, Holded-main) the
big corpora are on **Trustpilot/Capterra** — add those via API/residential IP.

## Pinning app IDs (important)

Play **search picks the wrong app constantly** (it returned an Indian invoicing app
for "contasimple" and TaxDown for "declarando"). Always **pin `playAppId`** in the
`COMPETITORS` list to a verified package. To find one:

```bash
node search.mjs   # (see snippet in this folder's history) prints top candidates
```

Verified so far: Anfix `com.anfix.anfixphone`, Quipu `com.getquipu`,
Holded-TPV `com.holded.pos.retail`, Taxfix-ES `com.taxscouts.es.customer`,
TaxDown `com.taxdown.bave.android`. Contasimple/Cuéntica/Declarando have **no
reliable Android app** → use Trustpilot/Capterra.

## Last run (multi-source, Spain, ~Jun 2026) — ~5,640 data points

| Tool | N (play/apple/reddit) | Avg | % ≤2★ | Dominant complaints |
|---|---|---|---|---|
| **Holded** | 138 (0/122/16) | **2.26★** | **68%** | bugs/blank screens, **price jump to 200€/mo**, broken scanner |
| **Anfix** | 98 (55/40/3) | **2.41★** | 59% | crashes, **broken bank sync**, app unusable |
| **Contasimple** | 68 (0/59/9) | 2.85★ | 46% | **"Cegid se ha cargado contasimple"**, price hikes 9→18€, no support |
| **Quipu** | 110 (41/46/23) | 3.15★ | 44% | app barely works, photo upload, login |
| **TaxDown** | 5,198 (4682/500/16) | 3.89★ | 26% | **AI-only support**, sends declaración sin consentimiento, upsell pressure |
| Cuéntica | 1 | — | — | web-first → **needs Trustpilot** (run trustpilot.mjs locally) |
| Declarando | 27* | — | — | *"declarando" = the verb "declaring" → noisy; **use Trustpilot** |

Confirms the COMPETITORS.md thesis with primary data: the leaders' apps are buggy and
poorly rated; price hikes/upsells and degrading (now AI-only) support are real,
recurring pains; bank-sync reliability is a genuine wedge.

**Known caveats:** Reddit substring search matches common words — `declarando` (verb)
and short brand names produce false positives; tighten aliases or rely on Trustpilot
for those. Cuéntica & Declarando are web-first (no app) → Trustpilot/Capterra only.

## Extending

- Add competitors → append `{ name, playAppId }` (pin a verified id).
- Raise `MAX_PER_APP` for bigger pulls (TaxDown has >4.6k).
- Add themes → extend the `THEMES` regex map.
- For real sentiment (beyond keyword tagging), pipe `all_reviews.csv` rows through
  an LLM classifier (batch by competitor) into the same theme buckets.
- `node_modules` here is gitignored; the script + README are the committed artifact.

# review-research — massive-sample competitor reviews

Pulls **thousands** of competitor reviews and runs theme + sentiment analysis, so
the competitive picture is statistically grounded instead of a handful of
hand-read reviews.

## Run

```bash
cd tools/review-research
npm install
node review-research.mjs
```

Outputs (to `/tmp`):
- `all_reviews.csv` — every review (competitor, score, date, version, text)
- `reviews_<name>.json` — raw per-competitor dump
- `review-analysis.md` — per-competitor: N, avg stars, star distribution, % per
  theme, top complaint themes within ≤2★, and sample negatives

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

## Last run (primary data, Spain, ~Jun 2026)

| Tool | N | Avg | % ≤2★ | Dominant complaints |
|---|---|---|---|---|
| Anfix | 55 | **2.65★** | 55% | bugs/crashes, broken bank sync, app unusable |
| Quipu | 41 | 3.12★ | 41% | app barely works, photo upload, login |
| TaxDown | 4,681 | (renta tool) | — | bonus competitor; mobile-first |
| Holded | 0 (TPV only) | — | — | web-first |
| Taxfix ES | 4 | 2.0★ | 75% | too new in ES |

Confirms the COMPETITORS.md thesis with primary data: the leaders' apps are buggy
and poorly rated; bank-sync reliability is a real, recurring pain.

## Extending

- Add competitors → append `{ name, playAppId }` (pin a verified id).
- Raise `MAX_PER_APP` for bigger pulls (TaxDown has >4.6k).
- Add themes → extend the `THEMES` regex map.
- For real sentiment (beyond keyword tagging), pipe `all_reviews.csv` rows through
  an LLM classifier (batch by competitor) into the same theme buckets.
- `node_modules` here is gitignored; the script + README are the committed artifact.

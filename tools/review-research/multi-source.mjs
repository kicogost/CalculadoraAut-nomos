// Multi-source competitor reviews: Google Play + Apple App Store + Reddit archive,
// merged into one themed analysis. Runs from any IP (Play + Apple + Arctic Shift
// all respond to datacenter IPs). Trustpilot/Capterra are 403 from datacenter — see
// trustpilot.mjs (run from a residential IP) and merge its CSV afterward.
//
//   cd tools/review-research && npm install && node multi-source.mjs
//
// Outputs to /tmp: all_reviews_multi.csv, multi-source-analysis.md, plus raw JSON.

import { writeFileSync } from 'node:fs';
import gplayPkg from 'google-play-scraper';
import { COMPETITORS, REDDIT_SUBS, analyze, toCsv, report, sleep } from './lib.mjs';
const gplay = gplayPkg.default ?? gplayPkg;

const MAX_PLAY = 8000;
const APPLE_PAGES = 10;            // ~50 reviews/page
const REDDIT_PER_SUB = 100;        // posts + comments per sub per competitor (Arctic Shift max)
const ARCTIC = 'https://arctic-shift.photon-reddit.com/api';

async function fetchJson(url) {
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'provisio-research/1.0' } });
      if (res.status === 429 || res.status >= 500) throw new Error('retry ' + res.status);
      return await res.json();
    } catch (e) { if (a === 3) throw e; await sleep(2000); }
  }
}

async function pullPlay(appId) {
  const all = []; let token;
  do {
    const page = await gplay.reviews({ appId, country: 'es', lang: 'es', sort: gplay.sort.NEWEST, num: 150, paginate: true, nextPaginationToken: token });
    all.push(...page.data.map((r) => ({ score: r.score, text: r.text, date: r.date, source: 'play' })));
    token = page.nextPaginationToken; await sleep(800);
  } while (token && all.length < MAX_PLAY);
  return all;
}

async function pullApple(trackId) {
  const all = [];
  for (let p = 1; p <= APPLE_PAGES; p++) {
    const d = await fetchJson(`https://itunes.apple.com/es/rss/customerreviews/page=${p}/id=${trackId}/sortby=mostrecent/json`);
    const entries = d?.feed?.entry || [];
    const reviews = entries.filter((e) => e['im:rating']); // first entry is app metadata
    if (!reviews.length) break;
    for (const e of reviews) all.push({
      score: parseInt(e['im:rating'].label, 10),
      text: `${e.title?.label || ''}. ${e.content?.label || ''}`,
      date: e.updated?.label?.slice(0, 10), source: 'apple',
    });
    await sleep(500);
  }
  return all;
}

async function pullReddit(aliases) {
  const out = []; const seen = new Set();
  for (const sub of REDDIT_SUBS) {
    for (const alias of aliases) {
      for (const kind of ['posts', 'comments']) {
        const param = kind === 'posts' ? 'query' : 'body';
        try {
          const d = await fetchJson(`${ARCTIC}/${kind}/search?subreddit=${sub}&${param}=${encodeURIComponent(alias)}&limit=${REDDIT_PER_SUB}&sort=desc`);
          for (const x of (d?.data || [])) {
            const id = x.id || x.name; if (id && seen.has(id)) continue; if (id) seen.add(id);
            const text = kind === 'posts' ? `${x.title || ''}. ${x.selftext || ''}` : (x.body || '');
            if (!text.trim() || text === '[deleted]' || text === '[removed]') continue;
            out.push({ score: null, text, date: x.created_utc ? new Date(x.created_utc * 1000).toISOString().slice(0, 10) : '', source: `reddit:${kind === 'posts' ? 'post' : 'comment'}` });
          }
        } catch { /* sub may not exist; skip */ }
        await sleep(400);
      }
    }
  }
  return out;
}

const summaries = []; const csvRows = [];
for (const c of COMPETITORS) {
  const reviews = [];
  try {
    if (c.play)  { process.stdout.write(`${c.name} play… `);  const r = await pullPlay(c.play).catch(() => []);  reviews.push(...r); process.stdout.write(`${r.length} `); }
    if (c.apple) { process.stdout.write(`apple… `);           const r = await pullApple(c.apple).catch(() => []); reviews.push(...r); process.stdout.write(`${r.length} `); }
    process.stdout.write(`reddit… `); const r = await pullReddit(c.aliases).catch(() => []); reviews.push(...r); process.stdout.write(`${r.length}\n`);
    writeFileSync(`/tmp/reviews_multi_${c.name.replace(/\W+/g, '_')}.json`, JSON.stringify(reviews));
    for (const x of reviews) csvRows.push({ competitor: c.name, ...x });
    summaries.push(analyze(c.name, reviews));
  } catch (e) { process.stdout.write(`FAILED: ${e.message}\n`); summaries.push({ name: c.name, error: e.message }); }
}

writeFileSync('/tmp/all_reviews_multi.csv', toCsv(csvRows.map((r) => ({ ...r }))));
const md = report(summaries, csvRows.length);
writeFileSync('/tmp/multi-source-analysis.md', md);
console.log('\nDONE. /tmp/all_reviews_multi.csv, /tmp/multi-source-analysis.md');
console.log(md);

// Trustpilot reviews scraper — RUN FROM A RESIDENTIAL IP.
// Trustpilot returns 403 to datacenter IPs (cloud/CI), so this won't work from a
// server — run it on your laptop. It parses the __NEXT_DATA__ JSON Trustpilot
// embeds in each business-unit page (more robust than scraping HTML).
//
//   cd tools/review-research && node trustpilot.mjs
//
// Verify each competitor's `trustpilot` slug in lib.mjs first (open
// https://es.trustpilot.com/review/<slug> in a browser). Output → /tmp.

import { writeFileSync } from 'node:fs';
import { COMPETITORS, analyze, toCsv, report, sleep } from './lib.mjs';

const MAX_PAGES = 50; // Trustpilot shows 20 reviews/page

async function fetchPage(slug, page) {
  const url = `https://es.trustpilot.com/review/${slug}?page=${page}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });
  if (res.status === 404) return null;
  if (res.status === 403) throw new Error('403 — run from a residential IP, not a datacenter/CI');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return [];
  const data = JSON.parse(m[1]);
  const reviews = data?.props?.pageProps?.reviews || [];
  return reviews.map((r) => ({
    score: r.rating,
    text: `${r.title || ''}. ${r.text || ''}`,
    date: (r.dates?.publishedDate || '').slice(0, 10),
    source: 'trustpilot',
  }));
}

const summaries = []; const csvRows = [];
for (const c of COMPETITORS.filter((c) => c.trustpilot)) {
  const all = [];
  try {
    process.stdout.write(`${c.name} (${c.trustpilot})… `);
    for (let p = 1; p <= MAX_PAGES; p++) {
      const batch = await fetchPage(c.trustpilot, p);
      if (batch === null) { process.stdout.write('404 (check slug) '); break; }
      if (!batch.length) break;
      all.push(...batch);
      await sleep(1200);
    }
    process.stdout.write(`${all.length}\n`);
    writeFileSync(`/tmp/trustpilot_${c.name.replace(/\W+/g, '_')}.json`, JSON.stringify(all));
    for (const x of all) csvRows.push({ competitor: c.name, ...x });
    summaries.push(analyze(c.name, all));
  } catch (e) {
    process.stdout.write(`FAILED: ${e.message}\n`);
    summaries.push({ name: c.name, error: e.message });
  }
}

writeFileSync('/tmp/trustpilot_reviews.csv', toCsv(csvRows));
const md = report(summaries, csvRows.length);
writeFileSync('/tmp/trustpilot-analysis.md', md);
console.log('\nDONE. /tmp/trustpilot_reviews.csv, /tmp/trustpilot-analysis.md');
console.log(md);

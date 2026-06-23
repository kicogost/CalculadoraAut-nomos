// Trustpilot reviews scraper via Playwright (real browser).
// Trustpilot bot-blocks curl/fetch even from a residential IP (TLS/headless
// fingerprint → 403). A real Chromium gets through: the FIRST hit returns 403 and
// sets a Cloudflare clearance cookie, and a reload then returns 200. We mask
// navigator.webdriver and reload-on-403. Works from a normal home connection.
//
//   cd tools/review-research && npm install && npx playwright install chromium
//   node trustpilot.mjs
//
// Verify each competitor's `trustpilot` slug in lib.mjs (open
// https://es.trustpilot.com/review/<slug> in a browser). Output → /tmp.

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { COMPETITORS, analyze, toCsv, report, sleep } from './lib.mjs';

const MAX_PAGES = 60; // Trustpilot shows 20 reviews/page

async function gotoWithRetry(page, url) {
  for (let a = 0; a < 3; a++) {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    if (resp && resp.status() === 200) return 200;
    await page.waitForTimeout(3000);
    const r2 = await page.reload({ waitUntil: 'domcontentloaded', timeout: 35000 });
    if (r2 && r2.status() === 200) return 200;
  }
  return 403;
}

function parseReviews(nextData) {
  const reviews = nextData?.props?.pageProps?.reviews || [];
  return reviews.map((r) => ({
    score: r.rating ?? r.stars,
    text: `${r.title || ''}. ${r.text || r.content || ''}`.trim(),
    date: (r.dates?.publishedDate || r.dates?.experiencedDate || '').slice(0, 10),
    source: 'trustpilot',
  }));
}

const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
const ctx = await browser.newContext({
  locale: 'es-ES',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 800 },
  extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
});
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'en'] });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
});
const page = await ctx.newPage();

const summaries = []; const csvRows = [];
for (const c of COMPETITORS.filter((c) => c.trustpilot)) {
  const all = []; let meta = {};
  try {
    process.stdout.write(`${c.name} (${c.trustpilot})… `);
    for (let p = 1; p <= MAX_PAGES; p++) {
      const status = await gotoWithRetry(page, `https://es.trustpilot.com/review/${c.trustpilot}?page=${p}`);
      if (status !== 200) { if (p === 1) process.stdout.write('blocked '); break; }
      const nd = await page.evaluate(() => { const el = document.getElementById('__NEXT_DATA__'); return el ? JSON.parse(el.textContent) : null; });
      if (p === 1) { const bu = nd?.props?.pageProps?.businessUnit; meta = { score: bu?.trustScore, total: bu?.numberOfReviews?.total ?? bu?.numberOfReviews }; }
      const batch = parseReviews(nd);
      if (!batch.length) break;
      all.push(...batch);
      await sleep(900);
    }
    process.stdout.write(`${all.length} (TrustScore ${meta.score ?? '?'}, total ${meta.total ?? '?'})\n`);
    writeFileSync(`/tmp/trustpilot_${c.name.replace(/\W+/g, '_')}.json`, JSON.stringify(all));
    for (const x of all) csvRows.push({ competitor: c.name, ...x });
    const s = analyze(c.name, all); s.tpScore = meta.score; s.tpTotal = meta.total;
    summaries.push(s);
  } catch (e) {
    process.stdout.write(`FAILED: ${e.message}\n`);
    summaries.push({ name: c.name, error: e.message });
  }
}
await browser.close();

writeFileSync('/tmp/trustpilot_reviews.csv', toCsv(csvRows));
let md = report(summaries, csvRows.length);
md = md.replace('# Competitor reviews — multi-source themed analysis', '# Competitor reviews — Trustpilot');
writeFileSync('/tmp/trustpilot-analysis.md', md);
console.log('\nDONE. /tmp/trustpilot_reviews.csv, /tmp/trustpilot-analysis.md');
console.log(md);

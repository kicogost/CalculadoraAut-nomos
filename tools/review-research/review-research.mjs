// Massive-sample competitor review research.
// Pulls ALL Google Play reviews (and optionally Apple App Store) for each
// competitor, then runs theme + sentiment analysis → CSV + JSON + a markdown
// summary. Run from a NON-datacenter IP (Play rate-limits/ blocks datacenter IPs;
// the same reason Reddit blocked the sandbox). See README.md.
//
//   cd tools/review-research && npm install && node review-research.mjs
//
// Reddit (posts + comments) is pulled separately via the Arctic Shift archive —
// see README. This script focuses on app-store reviews (the biggest volume).

import { writeFileSync } from 'node:fs';
import gplayPkg from 'google-play-scraper';
const gplay = gplayPkg.default ?? gplayPkg;

const MAX_PER_APP = 8000; // cap per app
const COUNTRY = 'es';
const LANG = 'es';

// VERIFIED Play package ids (Play "search" picks wrong apps — always pin playAppId).
// Several competitors are WEB-FIRST with no real Android app → use Trustpilot/Capterra
// for those (see README); app-store reviews only give big samples for mobile-first tools.
const COMPETITORS = [
  { name: 'Anfix', playAppId: 'com.anfix.anfixphone' },
  { name: 'Quipu', playAppId: 'com.getquipu' },
  { name: 'Holded (TPV only)', playAppId: 'com.holded.pos.retail' },
  { name: 'Taxfix/TaxScouts ES', playAppId: 'com.taxscouts.es.customer' },
  { name: 'TaxDown', playAppId: 'com.taxdown.bave.android' },
  // Web-first, no reliable Android app — pull from Trustpilot/Capterra instead:
  // Contasimple, Cuéntica, Declarando, Holded(main).
];

const THEMES = {
  'precio/subida': /precio|car[oa]|car[ií]sim|sub(e|i[óo]|ida|en)|tarifa|cobr|suscrip|mensualidad/i,
  soporte: /soporte|atenci[óo]n|no responden|no contestan|ayuda|\bchat\b|\bbot\b|servicio al cliente/i,
  'bugs/fiabilidad': /fallo|error|\bbug|cuelg|colgad|lent[oa]|va mal|no funciona|ca[íi]d|inestable|peta/i,
  'banco/conciliación': /banco|bancari|concili|sincroniz|movimientos/i,
  'impuestos/AEAT': /\biva\b|irpf|modelo|\b303\b|\b130\b|\b390\b|\b349\b|hacienda|aeat|impuesto|trimestr|verifactu/i,
  facilidad: /f[áa]cil|intuitiv|sencill|c[óo]modo/i,
  facturación: /factura/i,
  app: /\bapp\b|aplicaci[óo]n|m[óo]vil|android|\bios\b/i,
  'cancelar/permanencia': /cancel|darme de baja|permanencia|contrato|devoluci|reembolso|estafa/i,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveAppId(c) {
  if (c.playAppId) return c.playAppId;
  const res = await gplay.search({ term: c.playSearch, num: 5, country: COUNTRY, lang: LANG });
  if (!res.length) throw new Error(`no Play result for "${c.playSearch}"`);
  return res[0].appId;
}

async function pullReviews(appId) {
  const all = [];
  let token;
  do {
    let page;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        page = await gplay.reviews({
          appId, country: COUNTRY, lang: LANG, sort: gplay.sort.NEWEST,
          num: 150, paginate: true, nextPaginationToken: token,
        });
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        await sleep(2500);
      }
    }
    all.push(...page.data);
    token = page.nextPaginationToken;
    await sleep(800);
  } while (token && all.length < MAX_PER_APP);
  return all;
}

function analyze(name, reviews) {
  const n = reviews.length;
  const dist = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of reviews) {
    const s = Math.min(5, Math.max(1, r.score || 0));
    if (s) { dist[s - 1]++; sum += s; }
  }
  const neg = reviews.filter((r) => (r.score || 0) <= 2);
  const themeCount = {};
  const negThemeCount = {};
  for (const [t, re] of Object.entries(THEMES)) {
    themeCount[t] = reviews.filter((r) => re.test(r.text || '')).length;
    negThemeCount[t] = neg.filter((r) => re.test(r.text || '')).length;
  }
  return {
    name, n, avg: n ? (sum / n).toFixed(2) : '—', dist,
    negPct: n ? Math.round((neg.length / n) * 100) : 0,
    themeCount, negThemeCount,
    sampleNegatives: neg.filter((r) => (r.text || '').length > 40).slice(0, 8)
      .map((r) => `(${r.score}★) ${r.text.replace(/\s+/g, ' ').slice(0, 220)}`),
  };
}

function toCsv(rows) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = ['competitor', 'score', 'date', 'version', 'text'];
  return [header.join(','), ...rows.map((r) => [r.competitor, r.score, r.date, r.version, r.text].map(esc).join(','))].join('\n');
}

const summaries = [];
const csvRows = [];
for (const c of COMPETITORS) {
  try {
    const appId = await resolveAppId(c);
    process.stdout.write(`Pulling ${c.name} (${appId})… `);
    const reviews = await pullReviews(appId);
    process.stdout.write(`${reviews.length} reviews\n`);
    writeFileSync(`/tmp/reviews_${c.name.replace(/\W+/g, '_')}.json`, JSON.stringify(reviews));
    for (const r of reviews) csvRows.push({ competitor: c.name, score: r.score, date: r.date, version: r.version, text: (r.text || '').replace(/\s+/g, ' ') });
    summaries.push(analyze(c.name, reviews));
  } catch (e) {
    process.stdout.write(`FAILED: ${e.message}\n`);
    summaries.push({ name: c.name, error: e.message });
  }
}

writeFileSync('/tmp/all_reviews.csv', toCsv(csvRows));

// Markdown report
let md = `# Competitor app-store reviews — themed analysis\n\nTotal reviews: ${csvRows.length}\n\n`;
for (const s of summaries) {
  if (s.error) { md += `## ${s.name}\n_failed: ${s.error}_\n\n`; continue; }
  md += `## ${s.name}\n- Reviews: **${s.n}**, avg **${s.avg}★**, negative (≤2★): **${s.negPct}%**\n- Stars 1→5: ${s.dist.join(' / ')}\n- Themes (% of all reviews): `;
  md += Object.entries(s.themeCount).map(([t, c]) => `${t} ${s.n ? Math.round((c / s.n) * 100) : 0}%`).join(' · ');
  md += `\n- Top complaint themes (within ≤2★): `;
  md += Object.entries(s.negThemeCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t, c]) => `${t} (${c})`).join(', ');
  md += `\n- Sample negatives:\n${s.sampleNegatives.map((q) => `  - ${q}`).join('\n')}\n\n`;
}
writeFileSync('/tmp/review-analysis.md', md);
console.log('\nDONE. /tmp/all_reviews.csv, /tmp/review-analysis.md, /tmp/reviews_*.json');
console.log(md.slice(0, 4000));

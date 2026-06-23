// Shared config, theme map, and analysis helpers for all review sources.

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One competitor → ids across every source. Pin verified ids (search guesses wrong).
// trustpilot slugs are best-guess — verify when you run trustpilot.mjs locally.
export const COMPETITORS = [
  { name: 'Anfix',        play: 'com.anfix.anfixphone',     apple: 1067829415, trustpilot: 'anfix.com',       aliases: ['anfix'] },
  { name: 'Quipu',        play: 'com.getquipu',             apple: 777606296,  trustpilot: 'getquipu.com',    aliases: ['quipu'] },
  { name: 'Holded',       play: 'com.holded.pos.retail',    apple: 1369704574, trustpilot: 'holded.com',      aliases: ['holded'] },
  { name: 'Contasimple',  play: null,                       apple: 427583930,  trustpilot: 'contasimple.com', aliases: ['contasimple'] },
  { name: 'Cuéntica',     play: null,                       apple: null,       trustpilot: 'cuentica.com',    aliases: ['cuentica', 'cuéntica'] },
  { name: 'Declarando',   play: null,                       apple: null,       trustpilot: 'declarando.es',   aliases: ['declarando'] },
  { name: 'TaxDown',      play: 'com.taxdown.bave.android', apple: 1503998673, trustpilot: 'taxdown.es',      aliases: ['taxdown'] },
  { name: 'Renn',         play: null,                       apple: null,       trustpilot: 'getrenn.com',     aliases: ['getrenn'] }, // 'renn' too noisy for reddit
];

// Spanish-language subreddits where autónomos discuss these tools.
export const REDDIT_SUBS = [
  'AutonomosES', 'autonomos', 'spain', 'askspain', 'SpainFinance',
  'es', 'Spaniards', 'EspanaFinanciera', 'AutonomoSpain',
];

export const THEMES = {
  'precio/subida': /precio|car[oa]\b|car[ií]sim|sub(e|i[óo]|ida|en|ieron)|tarifa|cobr|suscrip|mensualidad|pago/i,
  soporte: /soporte|atenci[óo]n|no responden|no contestan|\bayuda\b|\bchat\b|\bbot\b|servicio al cliente|atienden/i,
  'bugs/fiabilidad': /fallo|error|\bbug|cuelg|colgad|lent[oa]|va mal|no funciona|ca[íi]d|inestable|peta\b|se bloquea/i,
  'banco/conciliación': /banco|bancari|concili|sincroniz|movimientos/i,
  'impuestos/AEAT': /\biva\b|irpf|modelo|\b303\b|\b130\b|\b390\b|\b349\b|hacienda|aeat|impuesto|trimestr|verifactu|declaraci/i,
  facilidad: /f[áa]cil|intuitiv|sencill|c[óo]modo/i,
  facturación: /factura/i,
  app: /\bapp\b|aplicaci[óo]n|m[óo]vil|android|\bios\b/i,
  'cancelar/permanencia': /cancel|darme de baja|permanencia|contrato|devoluci|reembolso|estafa|fraude/i,
  gestor: /gestor|asesor|gestor[íi]a|asesor[íi]a/i,
};

// reviews: [{score(1-5)|null, text, date, source}]
export function analyze(name, reviews) {
  const n = reviews.length;
  const dist = [0, 0, 0, 0, 0];
  let sum = 0, rated = 0;
  for (const r of reviews) {
    const s = r.score ? Math.min(5, Math.max(1, Math.round(r.score))) : 0;
    if (s) { dist[s - 1]++; sum += s; rated++; }
  }
  const neg = reviews.filter((r) => r.score && r.score <= 2);
  const themeCount = {}, negThemeCount = {};
  for (const [t, re] of Object.entries(THEMES)) {
    themeCount[t] = reviews.filter((r) => re.test(r.text || '')).length;
    negThemeCount[t] = neg.filter((r) => re.test(r.text || '')).length;
  }
  const bySource = {};
  for (const r of reviews) bySource[r.source] = (bySource[r.source] || 0) + 1;
  return {
    name, n, rated, avg: rated ? (sum / rated).toFixed(2) : '—', dist,
    negPct: rated ? Math.round((neg.length / rated) * 100) : null,
    bySource, themeCount, negThemeCount,
    sampleNegatives: neg.filter((r) => (r.text || '').length > 40).slice(0, 8)
      .map((r) => `(${r.score}★ ${r.source}) ${r.text.replace(/\s+/g, ' ').slice(0, 220)}`),
  };
}

export function toCsv(rows) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = ['competitor', 'source', 'score', 'date', 'text'];
  return [header.join(','), ...rows.map((r) => [r.competitor, r.source, r.score ?? '', r.date ?? '', (r.text || '').replace(/\s+/g, ' ')].map(esc).join(','))].join('\n');
}

export function report(summaries, totalRows) {
  let md = `# Competitor reviews — multi-source themed analysis\n\nTotal data points: ${totalRows}\n\n`;
  for (const s of summaries) {
    if (s.error) { md += `## ${s.name}\n_failed: ${s.error}_\n\n`; continue; }
    md += `## ${s.name}\n`;
    md += `- Data points: **${s.n}** (${Object.entries(s.bySource).map(([k, v]) => `${k} ${v}`).join(', ')}); rated: ${s.rated}, avg **${s.avg}★**`;
    if (s.negPct != null) md += `, negative (≤2★): **${s.negPct}%**`;
    md += `\n- Stars 1→5: ${s.dist.join(' / ')}\n`;
    md += `- Themes (% of all): ` + Object.entries(s.themeCount).map(([t, c]) => `${t} ${s.n ? Math.round((c / s.n) * 100) : 0}%`).join(' · ') + `\n`;
    md += `- Top complaint themes (≤2★): ` + Object.entries(s.negThemeCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t, c]) => `${t} (${c})`).join(', ') + `\n`;
    md += `- Sample negatives:\n${s.sampleNegatives.map((q) => `  - ${q}`).join('\n')}\n\n`;
  }
  return md;
}

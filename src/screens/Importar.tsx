import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatEur } from '../engine';
import type { PlaceOfSupply } from '../engine';
import type { DraftEntry } from '../types/reader';
import { csvToDrafts, parseCsv, type ColumnMapping, type ParsedCsv } from '../lib/csv';
import { extractFromFile } from '../lib/aiReader';
import { Badge, Button, Card, Field, InfoTip, SectionTitle, Select, TextInput, cx } from '../components/ui';
import { MoneyInput } from '../components/MoneyInput';

const EXPENSE_CATEGORIES = ['Suministros', 'Material y software', 'Servicios profesionales', 'Alquiler', 'Telefonía e internet', 'Formación', 'Desplazamientos', 'Otros'];
const PLACE_LABELS: Record<PlaceOfSupply, string> = {
  domestic_es: 'Cliente español',
  eu_b2b: 'Empresa UE',
  non_eu_export: 'Fuera UE',
  domestic_b2c: 'Particular ES',
  other: 'Otro',
};

type Tab = 'csv' | 'ai';

export function ImportarScreen() {
  const [tab, setTab] = useState<Tab>('csv');
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  return (
    <div className="space-y-6">
      <SectionTitle sub="Importa movimientos desde un CSV del banco o extrae datos de facturas y tickets (PDF o foto) con IA. Revisa y confirma antes de añadirlos.">
        Lector de ingresos y gastos
      </SectionTitle>

      <div className="flex gap-2">
        <TabButton active={tab === 'csv'} onClick={() => setTab('csv')}>CSV del banco</TabButton>
        <TabButton active={tab === 'ai'} onClick={() => setTab('ai')}>Escanear con IA</TabButton>
      </div>

      {tab === 'csv' ? (
        <CsvImporter onDrafts={setDrafts} />
      ) : (
        <AiImporter onDrafts={(d) => setDrafts((prev) => [...prev, ...d])} />
      )}

      {drafts.length > 0 && <ReviewTable drafts={drafts} setDrafts={setDrafts} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-xl px-4 py-2 text-sm font-medium transition',
        active ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CSV importer
// ---------------------------------------------------------------------------

function CsvImporter({ onDrafts }: { onDrafts: (d: DraftEntry[]) => void }) {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [map, setMap] = useState<ColumnMapping>({ dateCol: 0, descCol: 1, amountCol: 2 });
  const [twoCols, setTwoCols] = useState(false);

  function onFile(file: File) {
    file.text().then((text) => {
      const p = parseCsv(text);
      setParsed(p);
      // Heuristic default mapping by header names.
      const find = (re: RegExp) => p.headers.findIndex((h) => re.test(h.toLowerCase()));
      setMap({
        dateCol: Math.max(0, find(/fecha|date/)),
        descCol: Math.max(0, find(/concepto|descrip|detalle|description|memo/)),
        amountCol: Math.max(0, find(/importe|amount|cantidad/)),
      });
    });
  }

  const colOptions = parsed ? parsed.headers.map((h, i) => ({ i, h: h || `Columna ${i + 1}` })) : [];

  return (
    <Card className="p-5">
      <h3 className="mb-3 text-sm font-semibold">1 · Sube el CSV</h3>
      <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="text-sm" />

      {parsed && (
        <>
          <h3 className="mb-3 mt-5 flex items-center text-sm font-semibold">
            2 · Asigna las columnas
            <InfoTip text="Importes positivos se importan como ingresos; negativos como gastos. Si tu banco usa columnas separadas de cargo/abono, activa esa opción." />
          </h3>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={twoCols} onChange={(e) => setTwoCols(e.target.checked)} />
            Columnas separadas de cargo (gasto) y abono (ingreso)
          </label>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Field label="Fecha">
              <Select value={map.dateCol} onChange={(e) => setMap({ ...map, dateCol: Number(e.target.value) })}>
                {colOptions.map((c) => <option key={c.i} value={c.i}>{c.h}</option>)}
              </Select>
            </Field>
            <Field label="Concepto">
              <Select value={map.descCol} onChange={(e) => setMap({ ...map, descCol: Number(e.target.value) })}>
                {colOptions.map((c) => <option key={c.i} value={c.i}>{c.h}</option>)}
              </Select>
            </Field>
            {twoCols ? (
              <>
                <Field label="Cargo (gasto)">
                  <Select value={map.debitCol ?? 0} onChange={(e) => setMap({ ...map, debitCol: Number(e.target.value) })}>
                    {colOptions.map((c) => <option key={c.i} value={c.i}>{c.h}</option>)}
                  </Select>
                </Field>
                <Field label="Abono (ingreso)">
                  <Select value={map.creditCol ?? 0} onChange={(e) => setMap({ ...map, creditCol: Number(e.target.value) })}>
                    {colOptions.map((c) => <option key={c.i} value={c.i}>{c.h}</option>)}
                  </Select>
                </Field>
              </>
            ) : (
              <Field label="Importe (con signo)">
                <Select value={map.amountCol} onChange={(e) => setMap({ ...map, amountCol: Number(e.target.value) })}>
                  {colOptions.map((c) => <option key={c.i} value={c.i}>{c.h}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => onDrafts(csvToDrafts(parsed, twoCols ? map : { ...map, debitCol: undefined, creditCol: undefined }))}
          >
            Previsualizar {parsed.rows.length} filas
          </Button>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AI importer
// ---------------------------------------------------------------------------

function AiImporter({ onDrafts }: { onDrafts: (d: DraftEntry[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList) {
    setBusy(true);
    setError(null);
    setDone(0);
    const results: DraftEntry[] = [];
    for (const file of Array.from(files)) {
      try {
        results.push(await extractFromFile(file));
      } catch (e) {
        setError((e as Error).message);
      }
      setDone((n) => n + 1);
    }
    if (results.length) onDrafts(results);
    setBusy(false);
  }

  return (
    <Card className="p-5">
      <h3 className="mb-2 flex items-center text-sm font-semibold">
        Sube PDFs de facturas/tickets
        <InfoTip text="Cada PDF se envía a un modelo de IA en el servidor que extrae los campos. El documento sale de tu dispositivo solo para este análisis. Requiere ANTHROPIC_API_KEY configurada en el despliegue." />
      </h3>
      <p className="mb-3 text-xs text-muted">
        Formato: PDF (máx. 3 MB por archivo). Puedes seleccionar varios.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        multiple
        className="text-sm"
        disabled={busy}
        onChange={(e) => { if (e.target.files?.length) void onFiles(e.target.files); e.target.value = ''; }}
      />
      {busy && <p className="mt-3 text-sm text-muted">Extrayendo… ({done} procesados)</p>}
      {error && (
        <p className="mt-3 rounded-lg bg-danger-soft p-3 text-xs text-danger">
          {error} — la extracción con IA requiere el despliegue con ANTHROPIC_API_KEY (no funciona en
          el servidor de desarrollo local sin <code>vercel dev</code>).
        </p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Review & confirm
// ---------------------------------------------------------------------------

function ReviewTable({ drafts, setDrafts }: { drafts: DraftEntry[]; setDrafts: (d: DraftEntry[]) => void }) {
  const importDrafts = useStore((s) => s.importDrafts);
  const setScreen = useStore((s) => s.setScreen);
  const [result, setResult] = useState<string | null>(null);

  function patch(id: string, p: Partial<DraftEntry>) {
    setDrafts(drafts.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }
  const includedCount = drafts.filter((d) => d.include).length;

  async function confirm() {
    const r = await importDrafts(drafts);
    setResult(`Añadidos ${r.income} ingresos y ${r.expenses} gastos.`);
    setDrafts([]);
  }

  if (result) {
    return (
      <Card className="p-5 bg-positive-soft border-positive/20">
        <p className="text-sm text-ink">{result}</p>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => setScreen('income')}>Ver ingresos</Button>
          <Button onClick={() => setScreen('expenses')}>Ver gastos</Button>
          <Button variant="ghost" onClick={() => setResult(null)}>Importar más</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm font-semibold">Revisa y confirma ({includedCount} de {drafts.length})</h3>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setDrafts([])}>Descartar</Button>
          <Button variant="primary" onClick={confirm} disabled={includedCount === 0}>Confirmar e importar</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 text-right font-medium">Importe</th>
              <th className="px-3 py-2 font-medium">Clasificación</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.id} className={cx('border-t border-border', !d.include && 'opacity-40')}>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={d.include} onChange={(e) => patch(d.id, { include: e.target.checked })} />
                </td>
                <td className="px-3 py-2">
                  <Select value={d.kind} onChange={(e) => patch(d.id, { kind: e.target.value as DraftEntry['kind'] })}>
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <TextInput type="date" value={d.date} onChange={(e) => patch(d.id, { date: e.target.value })} className="w-36" />
                </td>
                <td className="px-3 py-2 min-w-48">
                  <TextInput value={d.description} onChange={(e) => patch(d.id, { description: e.target.value })} />
                </td>
                <td className="px-3 py-2 w-28">
                  <MoneyInput valueCents={d.amountCents} onChange={(c) => patch(d.id, { amountCents: c })} />
                </td>
                <td className="px-3 py-2">
                  {d.kind === 'expense' ? (
                    <Select value={d.category ?? 'Otros'} onChange={(e) => patch(d.id, { category: e.target.value })}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  ) : (
                    <Select value={d.placeOfSupply ?? 'domestic_es'} onChange={(e) => patch(d.id, { placeOfSupply: e.target.value as PlaceOfSupply })}>
                      {Object.entries(PLACE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {d.confidence != null && (
                    <Badge tone={d.confidence >= 0.8 ? 'positive' : d.confidence >= 0.5 ? 'warn' : 'danger'}>
                      {Math.round(d.confidence * 100)}%
                    </Badge>
                  )}
                  {!d.date && <span title="Falta fecha" className="ml-1 text-warn">⚠</span>}
                  {d.amountCents === 0 && <span title="Importe 0" className="ml-1 text-warn">€?</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="p-4 text-xs text-muted">
        Total a importar:{' '}
        {formatEur(drafts.filter((d) => d.include).reduce((s, d) => s + d.amountCents, 0))}
      </p>
    </Card>
  );
}

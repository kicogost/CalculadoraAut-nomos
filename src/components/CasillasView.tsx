import { useState } from 'react';
import { centsToEur, formatEur, QUARTER_LABELS } from '../engine';
import type { Expense, Invoice, TaxConfig, YearProfile } from '../engine';
import { modelo130Casillas, modelo303Casillas, type Casilla, type ModeloCasillas } from '../lib/casillas';
import { Badge, Card, InfoTip, cx } from './ui';
import { currentMonthForYear } from '../lib/dates';

/** Spanish-form number (comma decimal) for copy-to-AEAT, e.g. 123456 → "1234,56". */
function formNumber(cents: number): string {
  return centsToEur(cents).toFixed(2).replace('.', ',');
}

type Model = '303' | '130';

export function CasillasView({
  invoices,
  expenses,
  profile,
  cfg,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  profile: YearProfile;
  cfg: TaxConfig;
}) {
  const [model, setModel] = useState<Model>('303');
  const [quarter, setQuarter] = useState(() => Math.ceil(currentMonthForYear(profile.year) / 3));

  const data: ModeloCasillas =
    model === '303'
      ? modelo303Casillas(invoices, expenses, profile, cfg, quarter)
      : modelo130Casillas(invoices, expenses, profile, cfg, quarter);

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center">
        <h3 className="text-sm font-semibold text-ink">Rellena tus modelos (casilla a casilla)</h3>
        <InfoTip text="Estos son los valores y el número de casilla para rellenar el modelo en la Sede de la AEAT. Preséntalo tú con tu Cl@ve o certificado. Verifica siempre antes de presentar." />
      </div>
      <p className="mb-4 text-xs text-muted">
        Copia cada valor en su casilla en la Sede de la AEAT y presenta con tu Cl@ve o certificado.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          <Seg active={model === '303'} onClick={() => setModel('303')}>Modelo 303 (IVA)</Seg>
          <Seg active={model === '130'} onClick={() => setModel('130')}>Modelo 130 (IRPF)</Seg>
        </div>
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          {[1, 2, 3, 4].map((q) => (
            <Seg key={q} active={quarter === q} onClick={() => setQuarter(q)}>{QUARTER_LABELS[q - 1]}</Seg>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {data.groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {g.rows.map((row) => (
                    <Row key={row.n} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
        <span className="text-sm font-medium text-ink">{data.resultLabel}</span>
        <span className="font-mono text-lg font-semibold tnum text-ink">{formatEur(data.resultCents)}</span>
      </div>

      {data.notes.length > 0 && (
        <ul className="mt-3 space-y-1">
          {data.notes.map((n, i) => (
            <li key={i} className="text-xs text-warn">⚠ {n}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Row({ row }: { row: Casilla }) {
  const [copied, setCopied] = useState(false);
  const isMoney = row.cents != null;
  const display = isMoney ? formatEur(row.cents!) : row.text ?? '';
  const copyValue = isMoney ? formNumber(row.cents!) : row.text ?? '';

  function copy() {
    void navigator.clipboard?.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="w-14 px-3 py-2">
        <Badge tone="neutral">{String(row.n).padStart(2, '0')}</Badge>
      </td>
      <td className="px-3 py-2 text-ink">{row.label}</td>
      <td className="px-3 py-2 text-right font-mono tnum">{display}</td>
      <td className="w-16 px-3 py-2 text-right">
        {isMoney && (
          <button
            className={cx('text-xs hover:underline', copied ? 'text-positive' : 'text-accent')}
            onClick={copy}
            title="Copiar valor"
          >
            {copied ? '✓' : 'copiar'}
          </button>
        )}
      </td>
    </tr>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition',
        active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

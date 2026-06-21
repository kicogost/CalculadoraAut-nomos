import { useMemo } from 'react';
import { useStore, useActiveProfile } from '../store/useStore';
import { useComputation } from '../hooks/useComputation';
import { formatEur, formatPct } from '../engine';
import { Badge, Button, Card, InfoTip } from '../components/ui';
import { buildObligations, nextObligation } from '../lib/obligations';
import { currentMonthForYear, formatISODate, todayISO, MONTH_LABELS } from '../lib/dates';

export function Dashboard() {
  const profile = useActiveProfile();
  const invoices = useStore((s) => s.invoices);
  const setScreen = useStore((s) => s.setScreen);
  const provisioning = useStore((s) => s.provisioning);
  const month = currentMonthForYear(profile.year);
  const { comp, setAside } = useComputation();

  const sa = setAside(month);
  const obligations = useMemo(() => buildObligations(comp), [comp]);
  const next = nextObligation(obligations, todayISO());

  const hasData = invoices.length > 0;
  const monthlyCuotas = comp.ssMonthlyCuotas;
  const ivaPagarCents = comp.modelo303.reduce((s, q) => s + Math.max(0, q.resultCents), 0);
  const impuestosCents = comp.irpf.totalCuotaCents + ivaPagarCents;

  return (
    <div className="space-y-6">
      {!hasData && (
        <Card className="p-5 bg-accent-soft border-accent/20">
          <p className="text-sm text-ink">
            Aún no has añadido ingresos. Empieza en{' '}
            <button className="font-semibold text-accent underline" onClick={() => setScreen('facturas')}>
              Facturas
            </button>{' '}
            y verás aquí cuánto apartar cada mes.
          </p>
        </Card>
      )}

      {/* HERO: the one honest number */}
      <Card className="overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm text-muted">
            Aparta este mes ({MONTH_LABELS[month - 1]} {profile.year})
            <InfoTip text="Suma de tus obligaciones pendientes atribuibles a lo facturado hasta ahora: IVA del trimestre en curso, IRPF anual estimado prorrateado (menos pagos de 130 y retenciones) y, si procede, la regularización de la Seguridad Social." />
          </div>
          <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="font-serif text-6xl leading-none tracking-tight text-ink tnum md:text-7xl">
              {formatEur(sa.totalCents, { decimals: false })}
            </span>
            <span className="mb-1 rounded-full bg-accent-soft px-3 py-1 text-base font-semibold text-accent tnum">
              {formatPct(sa.pctOfIncome)} de tus ingresos
            </span>
          </div>
          <p className="mt-3 max-w-prose text-sm text-muted">
            Provisión <strong className="text-ink">{provisioningLabel(provisioning.style)}</strong>.
            Guarda esta cantidad y no te pillará Hacienda ni la Seguridad Social.
          </p>

          {/* breakdown */}
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <Breakdown label="IVA (trim.)" cents={sa.ivaCents} />
            <Breakdown label="IRPF" cents={sa.irpfCents} accent />
            <Breakdown label="Regul. RETA" cents={sa.ssRegularizacionCents} />
          </div>
        </div>
      </Card>

      {/* Resumen del año: ingresos · gastos · impuestos · beneficio neto */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Ingresos"
          value={formatEur(comp.income.baseCents)}
          sub={`${profile.year} · base sin IVA`}
          onClick={() => setScreen('facturas')}
        />
        <StatCard
          title="Gastos"
          value={formatEur(comp.expenses.totalCents)}
          sub="Incl. cuota de autónomos"
          onClick={() => setScreen('facturas')}
        />
        <StatCard
          title="Impuestos (est.)"
          value={formatEur(impuestosCents)}
          sub="IRPF anual + IVA a pagar"
          onClick={() => setScreen('taxes')}
        />
        <StatCard
          title="Beneficio neto"
          value={formatEur(comp.takeHomeCents)}
          sub="Ingresos − gastos − IRPF"
          tone="positive"
        />
      </div>

      {/* Next deadline */}
      <StatCard
        title="Próximo vencimiento"
        value={next ? formatEur(next.amountCents, { decimals: false }) : '—'}
        sub={next ? `${next.model} · ${formatISODate(next.dueDate)}` : 'Sin vencimientos próximos'}
        onClick={() => setScreen('taxes')}
      />

      {/* Persona explainer */}
      <PersonaExplainer required={comp.modelo130Required.required} ratio={comp.modelo130Required.retencionRatio} foral={comp.foralUnsupported} />

      {/* Cash-flow calendar strip */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Calendario de caja {profile.year}</h3>
          <Button variant="ghost" onClick={() => setScreen('taxes')}>Ver impuestos →</Button>
        </div>
        <CalendarStrip cuotas={monthlyCuotas} obligations={obligations} />
      </Card>
    </div>
  );
}

function provisioningLabel(style: string): string {
  return style === 'conservative' ? 'conservadora (redondeo al alza)' : style === 'custom' ? 'personalizada' : 'exacta';
}

function Breakdown({ label, cents, accent }: { label: string; cents: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-3 ${accent ? 'bg-accent-soft/40' : 'bg-surface-2/50'}`}>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-base font-semibold text-ink tnum">{formatEur(cents)}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  tone,
  onClick,
}: {
  title: string;
  value: string;
  sub: string;
  tone?: 'positive';
  onClick?: () => void;
}) {
  return (
    <Card className={`p-5 ${onClick ? 'cursor-pointer hover:border-accent/40' : ''}`}>
      <button className="block w-full text-left" onClick={onClick} disabled={!onClick}>
        <div className="text-sm text-muted">{title}</div>
        <div className={`mt-1 font-mono text-2xl font-semibold tnum ${tone === 'positive' ? 'text-positive' : 'text-ink'}`}>
          {value}
        </div>
        <div className="mt-1 text-xs text-muted">{sub}</div>
      </button>
    </Card>
  );
}

function PersonaExplainer({ required, ratio, foral }: { required: boolean; ratio: number; foral: boolean }) {
  if (foral) {
    return (
      <Card className="p-4 bg-warn-soft border-warn/20">
        <p className="text-sm text-ink">
          Tu comunidad es de <strong>régimen foral</strong> (País Vasco o Navarra), con su propio
          IRPF. En esta versión no calculamos el IRPF autonómico foral: las cifras de IRPF se
          muestran como 0. El IVA y la Seguridad Social sí aplican.
        </p>
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Badge tone={required ? 'accent' : 'neutral'}>{required ? 'Modelo 130 obligatorio' : 'Modelo 130 no obligatorio'}</Badge>
        <p className="text-sm text-muted">
          {required ? (
            <>
              Menos del 70% de tus ingresos llevó retención ({formatPct(ratio * 100, 0)}), así que
              debes presentar el <strong className="text-ink">Modelo 130</strong> cada trimestre. Tu
              provisión principal es IRPF + cuota.
            </>
          ) : (
            <>
              El {formatPct(ratio * 100, 0)} de tus ingresos llevó retención (≥70%), así que no estás
              obligado a presentar el Modelo 130. Tus clientes ya adelantan parte de tu IRPF.
            </>
          )}
        </p>
      </div>
    </Card>
  );
}

function CalendarStrip({
  cuotas,
  obligations,
}: {
  cuotas: number[];
  obligations: { dueDate: string; label: string; amountCents: number; model: string }[];
}) {
  // Group obligations by month for the active year.
  return (
    <div>
      <div className="grid grid-cols-6 gap-2 md:grid-cols-12">
        {MONTH_LABELS.map((m, i) => {
          const hasCuota = cuotas[i] > 0;
          return (
            <div key={m} className="rounded-lg bg-surface-2/60 p-2 text-center">
              <div className="text-[11px] font-medium text-muted">{m}</div>
              <div className="mt-1 text-[10px] text-muted tnum">
                {hasCuota ? formatEur(cuotas[i], { decimals: false }) : '—'}
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-4 space-y-1.5">
        {obligations.slice(0, 6).map((o, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-surface-2/50">
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted tnum">{formatISODate(o.dueDate)}</span>
              <span className="text-ink">{o.label}</span>
            </span>
            <span className="font-mono text-ink tnum">{formatEur(o.amountCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

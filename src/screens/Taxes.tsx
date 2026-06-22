import { useMemo } from 'react';
import { useActiveProfile, useStore } from '../store/useStore';
import { useComputation } from '../hooks/useComputation';
import { formatEur, formatPct, getTaxConfig, QUARTER_LABELS, TAX_CONFIG_2026 } from '../engine';
import { Badge, Card, InfoTip, SectionTitle } from '../components/ui';
import { CasillasView } from '../components/CasillasView';
import { buildObligations } from '../lib/obligations';
import { formatISODate } from '../lib/dates';

export function TaxesScreen() {
  const profile = useActiveProfile();
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const cfg = getTaxConfig(profile.year) ?? TAX_CONFIG_2026;
  const { comp } = useComputation();
  const obligations = useMemo(() => buildObligations(comp), [comp]);
  const { irpf, modelo303, modelo130, modelo130Required: req, regularizacion: reg } = comp;

  return (
    <div className="space-y-6">
      <SectionTitle sub="Trimestre a trimestre, más los modelos anuales y la regularización de la Seguridad Social. Todo es una estimación a provisionar.">
        Impuestos y obligaciones
      </SectionTitle>

      {/* IRPF annual summary */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center text-sm font-semibold">
          IRPF anual estimado
          <InfoTip text="Se aplica la escala estatal y la autonómica de tu comunidad por separado, y el mínimo personal y familiar como crédito (mecánica real, no una resta plana de la base)." />
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Cuota total IRPF" value={formatEur(irpf.totalCuotaCents)} strong />
          <Stat label="Tramo estatal" value={formatEur(irpf.stateCuotaCents)} />
          <Stat label="Tramo autonómico" value={formatEur(irpf.autonomicCuotaCents)} />
          <Stat label="Tipo medio / marginal" value={`${formatPct(irpf.effectiveRatePct)} / ${formatPct(irpf.marginalRatePct)}`} />
        </div>
        {comp.foralUnsupported && (
          <p className="mt-3 text-xs text-warn">
            Régimen foral: IRPF autonómico no calculado en esta versión.
          </p>
        )}
      </Card>

      {/* Quarterly cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Por trimestre</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((q) => {
            const iva = modelo303[q - 1];
            const m130 = modelo130[q - 1];
            return (
              <Card key={q} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold">{QUARTER_LABELS[q - 1]} {profile.year}</h4>
                  <span className="font-mono text-xs text-muted tnum">
                    vence {formatISODate(comp.cfg.deadlines.quarterly[q - 1])}
                  </span>
                </div>
                <ObligationRow
                  model="Modelo 303 · IVA"
                  amount={Math.max(0, iva.resultCents)}
                  note={`Repercutido ${formatEur(iva.outputIvaCents)} − soportado ${formatEur(iva.deductibleIvaCents)}`}
                />
                <ObligationRow
                  model="Modelo 130 · IRPF"
                  amount={req.required ? m130.dueCents : 0}
                  disabled={!req.required}
                  note={
                    req.required
                      ? `20% de ${formatEur(m130.accumulatedNetCents)} − 130 previos − retenciones`
                      : 'No obligatorio (≥70% con retención)'
                  }
                />
              </Card>
            );
          })}
        </div>
      </div>

      {/* Casilla-a-casilla: fill the official AEAT boxes */}
      <CasillasView invoices={invoices} expenses={expenses} profile={profile} cfg={cfg} />

      {/* Modelo 130 flag */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Badge tone={req.required ? 'accent' : 'neutral'}>
            {req.required ? 'Modelo 130 obligatorio' : 'Modelo 130 exento'}
          </Badge>
          <p className="text-sm text-muted">
            El {formatPct(req.retencionRatio * 100, 0)} de tus ingresos llevó retención.
            {req.required
              ? ' Como es menos del 70%, debes presentar el 130 cada trimestre.'
              : ' Como es el 70% o más, estás exento de presentar el 130.'}
          </p>
        </div>
      </Card>

      {/* SS regularización */}
      <Card className="p-5">
        <h3 className="mb-2 flex items-center text-sm font-semibold">
          Regularización Seguridad Social
          <InfoTip text="Comparamos las cuotas que pagas según tu tramo elegido con la cuota que correspondería a tus rendimientos reales. La Seguridad Social regulariza la diferencia tras el cierre del año." />
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Cuotas pagadas" value={formatEur(reg.paidCents)} />
          <Stat label="Cuota según ingresos" value={formatEur(reg.impliedCents)} />
          <Stat
            label={reg.differenceCents >= 0 ? 'A pagar (estimado)' : 'A devolver (estimado)'}
            value={formatEur(Math.abs(reg.differenceCents))}
            strong
            tone={reg.differenceCents > 0 ? 'warn' : 'positive'}
          />
          <Stat label="Tramo sugerido" value={`Tramo ${reg.suggestedTramo}`} />
        </div>
        {reg.prorrogaClawbackRisk && (
          <p className="mt-3 rounded-lg bg-warn-soft p-3 text-xs text-warn">
            Atención: estás en tarifa plana de 2.º año, pero tus rendimientos superan el SMI. La
            prórroga podría perderse y reclamarse en la regularización.
          </p>
        )}
      </Card>

      {/* Annual filings calendar */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Calendario anual</h3>
        <ul className="divide-y divide-border">
          {obligations.map((o) => (
            <li key={o.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  {o.model} · {o.label}
                  {o.informational && <Badge>informativo</Badge>}
                </div>
                <p className="mt-0.5 max-w-prose text-xs text-muted">{o.explanation}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm font-semibold tnum">
                  {o.informational ? '—' : formatEur(o.amountCents)}
                </div>
                <div className="font-mono text-xs text-muted tnum">{formatISODate(o.dueDate)}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'warn' | 'positive';
}) {
  const color = tone === 'warn' ? 'text-warn' : tone === 'positive' ? 'text-positive' : 'text-ink';
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 font-mono tnum ${strong ? 'text-lg font-semibold' : 'text-base'} ${color}`}>
        {value}
      </div>
    </div>
  );
}

function ObligationRow({
  model,
  amount,
  note,
  disabled,
}: {
  model: string;
  amount: number;
  note: string;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between border-t border-border py-2 first:border-t-0 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <div className="text-sm text-ink">{model}</div>
        <div className="text-xs text-muted">{note}</div>
      </div>
      <div className="font-mono text-sm font-semibold tnum">{formatEur(amount)}</div>
    </div>
  );
}

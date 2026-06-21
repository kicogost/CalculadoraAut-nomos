import { useStore, useActiveProfile } from '../store/useStore';
import { formatEur, formatPct } from '../engine';
import { clientStats } from '../lib/clients';
import { Card, InfoTip, TextInput } from '../components/ui';

/**
 * Per-client view: how much each client brings in, their share of your income,
 * and (if you enter the hours you dedicate) your real effective hourly rate.
 * Directly answers the recurring "¿gano de verdad con este cliente?" question.
 */
export function ClientesScreen() {
  const profile = useActiveProfile();
  const invoices = useStore((s) => s.invoices);
  const clientHours = useStore((s) => s.clientHours);
  const setClientHours = useStore((s) => s.setClientHours);

  const { clients, totalBaseCents, concentrationPct } = clientStats(
    invoices,
    profile.recognitionBasis,
    profile.year,
    clientHours,
  );

  if (clients.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">
          Aún no hay clientes este año. Añade ingresos y aquí verás cuánto te aporta cada uno y tu
          tarifa por hora real.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {concentrationPct >= 70 && (
        <Card className="p-4 bg-warn-soft border-warn/20">
          <p className="text-xs leading-relaxed text-warn">
            <strong>Dependes mucho de un solo cliente</strong> ({formatPct(concentrationPct, 0)} de
            tus ingresos). Ojo con el riesgo de <strong>falso autónomo</strong> y con quedarte sin
            ingresos si lo pierdes. (Además, si menos del 70% de tus ingresos lleva retención, el
            Modelo 130 es obligatorio.)
          </p>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 text-right font-medium">Facturas</th>
                <th className="px-4 py-2 text-right font-medium">Facturado</th>
                <th className="px-4 py-2 text-right font-medium">% ingresos</th>
                <th className="px-4 py-2 text-right font-medium">
                  <span className="inline-flex items-center">Horas/año<InfoTip text="Introduce las horas que dedicas a este cliente al año para ver tu tarifa por hora real (facturado ÷ horas)." /></span>
                </th>
                <th className="px-4 py-2 text-right font-medium">€/hora real</th>
                <th className="px-4 py-2 font-medium">Última</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.name} className="border-t border-border hover:bg-surface-2/40">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2 text-right tnum text-muted">{c.invoiceCount}</td>
                  <td className="px-4 py-2 text-right font-mono tnum">{formatEur(c.baseCents)}</td>
                  <td className="px-4 py-2 text-right tnum text-muted">{formatPct(c.share * 100, 0)}</td>
                  <td className="px-4 py-2 text-right">
                    <TextInput
                      type="number"
                      min={0}
                      value={c.hours ?? ''}
                      placeholder="—"
                      className="w-20 tnum text-right"
                      onChange={(e) => setClientHours(c.name, Math.max(0, Number(e.target.value)))}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-mono tnum">
                    {c.effectiveHourlyCents != null ? (
                      <span className={c.effectiveHourlyCents < 1500 ? 'text-danger' : 'text-ink'}>
                        {formatEur(c.effectiveHourlyCents)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 tnum text-muted">{c.lastDate}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-surface-2/40 font-medium">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right tnum">{clients.reduce((s, c) => s + c.invoiceCount, 0)}</td>
                <td className="px-4 py-2 text-right font-mono tnum">{formatEur(totalBaseCents)}</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted">
        Un €/hora real por debajo de ~15 € se marca en rojo: quizá ese cliente te cuesta más de lo
        que parece.
      </p>
    </div>
  );
}

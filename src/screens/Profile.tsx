import { useActiveProfile, useStore } from '../store/useStore';
import { useComputation } from '../hooks/useComputation';
import {
  COMUNIDADES,
  formatEur,
  getTaxConfig,
  suggestTramo,
  cuotaForStatus,
  TAX_CONFIG_2026,
} from '../engine';
import type { SsStatus, YearProfile } from '../engine';
import { Badge, Card, Field, InfoTip, SectionTitle, Select, TextInput } from '../components/ui';

const SUPPORTED_YEARS = [2026];

export function ProfileScreen() {
  const profile = useActiveProfile();
  const upsertProfile = useStore((s) => s.upsertProfile);
  const setActiveYear = useStore((s) => s.setActiveYear);
  const { comp } = useComputation();
  const cfg = getTaxConfig(profile.year) ?? TAX_CONFIG_2026;

  const suggested = suggestTramo(comp.rendimientoNetoCents, cfg);
  const comunidad = COMUNIDADES.find((c) => c.id === profile.comunidadAutonoma);

  function patch(p: Partial<YearProfile>) {
    void upsertProfile({ ...profile, ...p });
  }

  const ssKind =
    profile.ssStatus.kind === 'tramo' ? `tramo` : profile.ssStatus.kind;

  function setSsKind(kind: string) {
    let status: SsStatus;
    if (kind === 'tramo') {
      status = { kind: 'tramo', tramo: suggested.tramo, baseCents: suggested.baseMinCents };
    } else {
      status = { kind: kind as 'tarifa_plana_y1' | 'tarifa_plana_y2' };
    }
    patch({ ssStatus: status });
  }

  function setTramo(n: number) {
    const t = cfg.ss.tramos.find((x) => x.tramo === n)!;
    patch({ ssStatus: { kind: 'tramo', tramo: n, baseCents: t.baseMinCents } });
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Configura el ejercicio, tu residencia fiscal, la situación en la Seguridad Social y tus circunstancias personales.">
        Año y perfil
      </SectionTitle>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ejercicio fiscal">
            <Select value={profile.year} onChange={(e) => setActiveYear(Number(e.target.value))}>
              {SUPPORTED_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Comunidad autónoma (residencia fiscal)"
            hint="La residencia de un año es la comunidad donde pasas más días ese año. No se prorratean dos escalas en un mismo año."
          >
            <Select value={profile.comunidadAutonoma} onChange={(e) => patch({ comunidadAutonoma: e.target.value })}>
              {COMUNIDADES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Criterio de imputación de ingresos">
            <Select value={profile.recognitionBasis} onChange={(e) => patch({ recognitionBasis: e.target.value as 'devengo' | 'caja' })}>
              <option value="devengo">Devengo (por fecha de factura)</option>
              <option value="caja">Caja / cobro (por fecha de pago)</option>
            </Select>
          </Field>
          <Field label="Régimen de estimación directa">
            <Select value={profile.estimacionDirecta} onChange={(e) => patch({ estimacionDirecta: e.target.value as 'simplificada' | 'normal' })}>
              <option value="simplificada">Simplificada (gastos difícil justificación 5%)</option>
              <option value="normal">Normal</option>
            </Select>
          </Field>
        </div>
        {comunidad?.foral && (
          <p className="mt-3 rounded-lg bg-warn-soft p-3 text-xs text-warn">
            {comunidad.name} tiene régimen foral propio. En esta versión no calculamos su IRPF; está
            fuera de alcance. Elige una comunidad de régimen común para estimar el IRPF.
          </p>
        )}
      </Card>

      {/* Seguridad Social */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center text-sm font-semibold">
          Seguridad Social (RETA)
          <InfoTip text="Elige tú tu tramo o tu tarifa plana. Te sugerimos el tramo según tus rendimientos proyectados, pero no lo forzamos." />
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Situación">
            <Select value={ssKind} onChange={(e) => setSsKind(e.target.value)}>
              <option value="tarifa_plana_y1">Tarifa plana · 1.er año</option>
              <option value="tarifa_plana_y2">Tarifa plana · 2.º año (prórroga)</option>
              <option value="tramo">Por tramo de rendimientos</option>
            </Select>
          </Field>
          {profile.ssStatus.kind === 'tramo' && (
            <Field label="Tramo">
              <Select value={profile.ssStatus.tramo} onChange={(e) => setTramo(Number(e.target.value))}>
                {cfg.ss.tramos.map((t) => (
                  <option key={t.tramo} value={t.tramo}>
                    Tramo {t.tramo} · cuota {formatEur(t.cuotaMinCents)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-surface-2/60 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Sugerencia</Badge>
            <span className="text-muted">
              Según tus rendimientos proyectados ({formatEur(comp.rendimientoNetoCents)}), te
              correspondería el <strong className="text-ink">tramo {suggested.tramo}</strong> con una
              cuota de <strong className="text-ink">{formatEur(suggested.cuotaMinCents)}/mes</strong>.
            </span>
          </div>
          <div className="mt-2 text-muted">
            Cuota actual aplicada:{' '}
            <strong className="text-ink">{formatEur(cuotaForStatus(profile.ssStatus, cfg))}/mes</strong>
          </div>
          {(profile.ssStatus.kind === 'tarifa_plana_y1' || profile.ssStatus.kind === 'tarifa_plana_y2') && (
            <p className="mt-2 text-xs text-warn">
              Cuando termine tu tarifa plana, la cuota pasará al tramo según tus ingresos
              (≈ {formatEur(suggested.cuotaMinCents)}/mes). La prórroga de 2.º año a 80 € solo es
              posible si tus rendimientos netos quedan por debajo del SMI ({formatEur(cfg.ss.smiAnnualCents)}/año).
              Si prevés un cambio a mitad de año, regístralo creando el tramo en el mes correspondiente.
            </p>
          )}
        </div>
      </Card>

      {/* Personal circumstances */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center text-sm font-semibold">
          Circunstancias personales
          <InfoTip text="Determinan el mínimo personal y familiar. Mantén esto sencillo; en v1 se aplica el mínimo estatal a ambos tramos." />
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Hijos / descendientes">
            <TextInput type="number" min={0} value={profile.personal.children}
              onChange={(e) => patch({ personal: { ...profile.personal, children: Math.max(0, Number(e.target.value)) } })} />
          </Field>
          <Field label="De ellos, menores de 3 años">
            <TextInput type="number" min={0} value={profile.personal.childrenUnder3}
              onChange={(e) => patch({ personal: { ...profile.personal, childrenUnder3: Math.max(0, Number(e.target.value)) } })} />
          </Field>
          <Field label="Discapacidad (%)">
            <Select value={profile.personal.disabilityPct}
              onChange={(e) => patch({ personal: { ...profile.personal, disabilityPct: Number(e.target.value) } })}>
              <option value={0}>Sin discapacidad</option>
              <option value={33}>33% – 64%</option>
              <option value={65}>65% o más</option>
            </Select>
          </Field>
          <Field label="Mayor de 65 años">
            <Select value={profile.personal.over65 ? '1' : '0'}
              onChange={(e) => patch({ personal: { ...profile.personal, over65: e.target.value === '1' } })}>
              <option value="0">No</option>
              <option value="1">Sí</option>
            </Select>
          </Field>
          <Field label="Mayor de 75 años">
            <Select value={profile.personal.over75 ? '1' : '0'}
              onChange={(e) => patch({ personal: { ...profile.personal, over75: e.target.value === '1', over65: e.target.value === '1' ? true : profile.personal.over65 } })}>
              <option value="0">No</option>
              <option value="1">Sí</option>
            </Select>
          </Field>
        </div>
      </Card>
    </div>
  );
}

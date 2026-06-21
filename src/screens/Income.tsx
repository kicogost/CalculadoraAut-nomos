import { useState } from 'react';
import { useStore, useActiveProfile } from '../store/useStore';
import { useComputation } from '../hooks/useComputation';
import {
  formatEur,
  incomeInQuarter,
  outputIva,
  retencion,
  QUARTER_LABELS,
} from '../engine';
import type { Invoice, PlaceOfSupply } from '../engine';
import { Badge, Button, Card, Field, InfoTip, Select, SectionTitle, TextInput } from '../components/ui';
import { MoneyInput } from '../components/MoneyInput';

const PLACE_LABELS: Record<PlaceOfSupply, string> = {
  domestic_es: 'Cliente español',
  eu_b2b: 'Empresa de la UE (B2B)',
  non_eu_export: 'Empresa fuera de la UE (p. ej. EE. UU.)',
  domestic_b2c: 'Particular español (B2C)',
  other: 'Otro / revisar',
};

const PLACE_DEFAULTS: Record<PlaceOfSupply, { iva: number; ret: number }> = {
  domestic_es: { iva: 21, ret: 15 },
  eu_b2b: { iva: 0, ret: 0 },
  non_eu_export: { iva: 0, ret: 0 },
  domestic_b2c: { iva: 21, ret: 0 },
  other: { iva: 21, ret: 0 },
};

type Draft = Omit<Invoice, 'id'> & { id?: string };

function emptyDraft(year: number): Draft {
  return {
    date: `${year}-01-15`,
    clientName: '',
    amountCents: 0,
    placeOfSupply: 'non_eu_export',
    ivaRate: 0,
    retencionRate: 0,
  };
}

export function IncomeScreen() {
  const profile = useActiveProfile();
  const invoices = useStore((s) => s.invoices);
  const addInvoice = useStore((s) => s.addInvoice);
  const updateInvoice = useStore((s) => s.updateInvoice);
  const deleteInvoice = useStore((s) => s.deleteInvoice);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(profile.year));

  const yearInvoices = invoices
    .filter((i) => i.date.startsWith(String(profile.year)) || i.paidDate?.startsWith(String(profile.year)))
    .sort((a, b) => a.date.localeCompare(b.date));

  function setPlace(place: PlaceOfSupply) {
    const d = PLACE_DEFAULTS[place];
    setDraft((prev) => ({ ...prev, placeOfSupply: place, ivaRate: d.iva, retencionRate: d.ret }));
  }

  async function submit() {
    if (!draft.clientName.trim() || draft.amountCents <= 0) return;
    if (draft.id) {
      await updateInvoice(draft as Invoice);
    } else {
      await addInvoice(draft);
    }
    setDraft(emptyDraft(profile.year));
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Modela cada factura con su tipo de cliente: el IVA y la obligación de presentar el 130 dependen de a quién facturas.">
        Ingresos
      </SectionTitle>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">{draft.id ? 'Editar factura' : 'Añadir factura'}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fecha de factura">
            <TextInput
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
          <Field label="Cliente">
            <TextInput
              value={draft.clientName}
              placeholder="Nombre del cliente"
              onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
            />
          </Field>
          <Field label="Base (sin IVA)">
            <MoneyInput valueCents={draft.amountCents} onChange={(c) => setDraft({ ...draft, amountCents: c })} />
          </Field>
          <Field
            label="Tipo de cliente / lugar de prestación"
            hint={
              draft.placeOfSupply === 'non_eu_export'
                ? 'No sujeto a IVA español. Sin retención → Modelo 130 obligatorio.'
                : draft.placeOfSupply === 'eu_b2b'
                  ? 'Inversión del sujeto pasivo: sin IVA español, se informa en el Modelo 349.'
                  : undefined
            }
          >
            <Select value={draft.placeOfSupply} onChange={(e) => setPlace(e.target.value as PlaceOfSupply)}>
              {Object.entries(PLACE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="IVA repercutido (%)">
            <Select
              value={draft.ivaRate}
              onChange={(e) => setDraft({ ...draft, ivaRate: Number(e.target.value) })}
            >
              {[0, 4, 10, 21].map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </Select>
          </Field>
          <Field label="Retención IRPF (%)">
            <Select
              value={draft.retencionRate}
              onChange={(e) => setDraft({ ...draft, retencionRate: Number(e.target.value) })}
            >
              {[0, 7, 15].map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={submit}>
            {draft.id ? 'Guardar cambios' : 'Añadir factura'}
          </Button>
          {draft.id && (
            <Button variant="ghost" onClick={() => setDraft(emptyDraft(profile.year))}>
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <QuarterTotals />

      <Card className="p-0 overflow-hidden">
        {yearInvoices.length === 0 ? (
          <p className="p-6 text-sm text-muted">Todavía no hay facturas para {profile.year}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Base</th>
                  <th className="px-4 py-2 text-right font-medium">IVA</th>
                  <th className="px-4 py-2 text-right font-medium">Retención</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {yearInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-border hover:bg-surface-2/40">
                    <td className="px-4 py-2 tnum text-muted">{inv.date}</td>
                    <td className="px-4 py-2">{inv.clientName}</td>
                    <td className="px-4 py-2"><Badge>{PLACE_LABELS[inv.placeOfSupply]}</Badge></td>
                    <td className="px-4 py-2 text-right font-mono tnum">{formatEur(inv.amountCents)}</td>
                    <td className="px-4 py-2 text-right font-mono tnum text-muted">{formatEur(outputIva(inv))}</td>
                    <td className="px-4 py-2 text-right font-mono tnum text-muted">{formatEur(retencion(inv))}</td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs text-accent hover:underline" onClick={() => setDraft(inv)}>Editar</button>
                      <button className="ml-3 text-xs text-danger hover:underline" onClick={() => deleteInvoice(inv.id)}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function QuarterTotals() {
  const profile = useActiveProfile();
  const invoices = useStore((s) => s.invoices);
  useComputation(); // keep subscription consistent
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((q) => {
        const t = incomeInQuarter(invoices, profile.recognitionBasis, profile.year, q);
        return (
          <Card key={q} className="p-4">
            <div className="flex items-center text-xs text-muted">
              {QUARTER_LABELS[q - 1]}
              {q === 1 && <InfoTip text="Los ingresos se asignan al trimestre según tu criterio (devengo por fecha de factura, o caja por fecha de cobro)." />}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tnum">{formatEur(t.baseCents)}</div>
            <div className="mt-0.5 text-xs text-muted">IVA {formatEur(t.outputIvaCents)}</div>
          </Card>
        );
      })}
    </div>
  );
}

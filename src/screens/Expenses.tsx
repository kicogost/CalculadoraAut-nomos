import { useState } from 'react';
import { useStore, useActiveProfile } from '../store/useStore';
import { useComputation } from '../hooks/useComputation';
import { formatEur } from '../engine';
import type { Expense } from '../engine';
import { Badge, Button, Card, Field, InfoTip, SectionTitle, Select, TextInput } from '../components/ui';
import { MoneyInput } from '../components/MoneyInput';

const CATEGORIES = [
  'Suministros',
  'Material y software',
  'Servicios profesionales',
  'Alquiler / coworking',
  'Telefonía e internet',
  'Formación',
  'Desplazamientos',
  'Otros',
];

type Draft = Omit<Expense, 'id'> & { id?: string };

function emptyDraft(year: number): Draft {
  return {
    date: `${year}-01-15`,
    category: CATEGORIES[0],
    amountCents: 0,
    deductiblePct: 100,
    inputIvaCents: 0,
  };
}

export function ExpensesScreen() {
  const profile = useActiveProfile();
  const expenses = useStore((s) => s.expenses);
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const { comp } = useComputation();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(profile.year));

  const yearExpenses = expenses
    .filter((e) => e.date.startsWith(String(profile.year)))
    .sort((a, b) => a.date.localeCompare(b.date));

  async function submit() {
    if (draft.amountCents <= 0) return;
    if (draft.id) await updateExpense(draft as Expense);
    else await addExpense(draft);
    setDraft(emptyDraft(profile.year));
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Introduce tus gastos reales (no estimamos nada). La cuota de autónomos se añade sola cada mes como gasto deducible.">
        Gastos
      </SectionTitle>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">{draft.id ? 'Editar gasto' : 'Añadir gasto'}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fecha">
            <TextInput type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Importe total (con IVA)">
            <MoneyInput valueCents={draft.amountCents} onChange={(c) => setDraft({ ...draft, amountCents: c })} />
          </Field>
          <Field label="IVA soportado deducible" hint="Déjalo a 0 si el gasto no lleva IVA español deducible.">
            <MoneyInput valueCents={draft.inputIvaCents} onChange={(c) => setDraft({ ...draft, inputIvaCents: c })} />
          </Field>
          <Field label="% deducible para IRPF">
            <Select value={draft.deductiblePct} onChange={(e) => setDraft({ ...draft, deductiblePct: Number(e.target.value) })}>
              {[0, 25, 50, 75, 100].map((p) => (
                <option key={p} value={p}>{p}%</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={submit}>{draft.id ? 'Guardar cambios' : 'Añadir gasto'}</Button>
          {draft.id && <Button variant="ghost" onClick={() => setDraft(emptyDraft(profile.year))}>Cancelar</Button>}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted">Gastos totales</div>
          <div className="mt-1 font-mono text-lg font-semibold tnum">{formatEur(comp.expenses.totalCents)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center text-xs text-muted">Deducible IRPF <InfoTip text="Parte deducible de tus gastos (base sin IVA × % deducible), incluyendo la cuota de autónomos." /></div>
          <div className="mt-1 font-mono text-lg font-semibold tnum">{formatEur(comp.expenses.deductibleCents)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">IVA soportado</div>
          <div className="mt-1 font-mono text-lg font-semibold tnum">{formatEur(comp.expenses.inputIvaCents)}</div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 text-right font-medium">Importe</th>
                <th className="px-4 py-2 text-right font-medium">Deducible</th>
                <th className="px-4 py-2 text-right font-medium">IVA</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {/* Auto-generated cuota rows, clearly labelled and not editable. */}
              {comp.cuotaRows.map((c) => (
                <tr key={c.id} className="border-t border-border bg-accent-soft/30">
                  <td className="px-4 py-2 tnum text-muted">{c.date}</td>
                  <td className="px-4 py-2">
                    {c.category} <Badge tone="accent">automático</Badge>
                  </td>
                  <td className="px-4 py-2 text-right font-mono tnum">{formatEur(c.amountCents)}</td>
                  <td className="px-4 py-2 text-right font-mono tnum text-muted">100%</td>
                  <td className="px-4 py-2 text-right font-mono tnum text-muted">—</td>
                  <td className="px-4 py-2"></td>
                </tr>
              ))}
              {yearExpenses.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-surface-2/40">
                  <td className="px-4 py-2 tnum text-muted">{e.date}</td>
                  <td className="px-4 py-2">{e.category}</td>
                  <td className="px-4 py-2 text-right font-mono tnum">{formatEur(e.amountCents)}</td>
                  <td className="px-4 py-2 text-right font-mono tnum text-muted">{e.deductiblePct}%</td>
                  <td className="px-4 py-2 text-right font-mono tnum text-muted">{formatEur(e.inputIvaCents)}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-xs text-accent hover:underline" onClick={() => setDraft(e)}>Editar</button>
                    <button className="ml-3 text-xs text-danger hover:underline" onClick={() => deleteExpense(e.id)}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { IncomeScreen } from './Income';
import { ExpensesScreen } from './Expenses';
import { FacturasScreen as FacturaBuilder } from './Facturas';
import { ImportarScreen } from './Importar';
import { Button, SectionTitle, cx } from '../components/ui';

type Kind = 'ingresos' | 'gastos';
type View = 'list' | 'crear' | 'importar';

/**
 * The Facturas hub: a single place to add income and expenses — manually, by
 * reading a PDF with AI, or by importing a bank CSV — plus generating invoice
 * PDFs. Replaces the separate Ingresos / Gastos / Lector / Facturas tabs.
 */
export function FacturasHub() {
  const [kind, setKind] = useState<Kind>('ingresos');
  const [view, setView] = useState<View>('list');

  if (view === 'crear') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setView('list')}>← Volver</Button>
        <FacturaBuilder />
      </div>
    );
  }
  if (view === 'importar') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setView('list')}>← Volver</Button>
        <ImportarScreen onDone={(k) => { setKind(k); setView('list'); }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle sub="Añade tus ingresos y gastos: a mano, leyendo un PDF con IA, o importando un CSV del banco. También puedes generar facturas en PDF.">
        Facturas
      </SectionTitle>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          <Seg active={kind === 'ingresos'} onClick={() => setKind('ingresos')}>Ingresos</Seg>
          <Seg active={kind === 'gastos'} onClick={() => setKind('gastos')}>Gastos</Seg>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView('importar')}>Leer PDF (IA) · CSV</Button>
          {kind === 'ingresos' && (
            <Button variant="primary" onClick={() => setView('crear')}>Crear factura PDF</Button>
          )}
        </div>
      </div>

      {kind === 'ingresos' ? <IncomeScreen embedded /> : <ExpensesScreen embedded />}
    </div>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-lg px-4 py-1.5 text-sm font-medium transition',
        active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

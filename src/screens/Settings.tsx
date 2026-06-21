import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  downloadText,
  exportAll,
  importAll,
  invoicesToCsv,
  expensesToCsv,
  wipeAll,
} from '../db/repo';
import type { ProvisioningStyle } from '../engine';
import { Button, Card, Field, InfoTip, SectionTitle, Select, TextInput } from '../components/ui';

export function SettingsScreen() {
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const provisioning = useStore((s) => s.provisioning);
  const setProvisioning = useStore((s) => s.setProvisioning);
  const refreshAfterImport = useStore((s) => s.refreshAfterImport);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleExportJson() {
    const json = await exportAll();
    downloadText(`calculadora-autonomos-backup-${todayStamp()}.json`, json, 'application/json');
  }

  async function handleImport(file: File) {
    try {
      await importAll(await file.text());
      await refreshAfterImport();
      setStatus('Datos importados correctamente.');
    } catch (e) {
      setStatus(`Error al importar: ${(e as Error).message}`);
    }
  }

  async function handleReset() {
    if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer. Exporta una copia antes.')) return;
    await wipeAll();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Tus datos viven solo en este navegador (local-first). Expórtalos para tener copia o llevártelos.">
        Datos y ajustes
      </SectionTitle>

      <Card className="p-5">
        <h3 className="mb-3 flex items-center text-sm font-semibold">
          Estilo de provisión
          <InfoTip text="Cómo calculamos cuánto apartar: exacta (lo justo), conservadora (redondeo al alza ~5%) o un porcentaje fijo personalizado." />
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Estilo">
            <Select
              value={provisioning.style}
              onChange={(e) => setProvisioning({ ...provisioning, style: e.target.value as ProvisioningStyle })}
            >
              <option value="exact">Exacta</option>
              <option value="conservative">Conservadora (+5%)</option>
              <option value="custom">Porcentaje fijo</option>
            </Select>
          </Field>
          {provisioning.style === 'custom' && (
            <Field label="Porcentaje a apartar (%)">
              <TextInput
                type="number"
                min={0}
                max={100}
                value={provisioning.customPct ?? 30}
                onChange={(e) => setProvisioning({ ...provisioning, customPct: Number(e.target.value) })}
              />
            </Field>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Copia de seguridad</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={handleExportJson}>Exportar JSON</Button>
          <Button onClick={() => fileRef.current?.click()}>Importar JSON</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
              e.target.value = '';
            }}
          />
          <Button onClick={() => downloadText(`facturas-${todayStamp()}.csv`, invoicesToCsv(invoices), 'text/csv')}>
            Exportar facturas CSV
          </Button>
          <Button onClick={() => downloadText(`gastos-${todayStamp()}.csv`, expensesToCsv(expenses), 'text/csv')}>
            Exportar gastos CSV
          </Button>
        </div>
        {status && <p className="mt-3 text-sm text-muted">{status}</p>}
      </Card>

      <Card className="p-5 border-danger/20">
        <h3 className="mb-1 text-sm font-semibold text-danger">Zona de peligro</h3>
        <p className="mb-3 text-xs text-muted">Borra todos los datos de este navegador. Exporta una copia antes.</p>
        <Button variant="danger" onClick={handleReset}>Borrar todos los datos</Button>
      </Card>
    </div>
  );
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

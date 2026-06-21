import { useState } from 'react';
import { useStore } from '../store/useStore';
import { newId } from '../db/repo';
import { formatCurrency } from '../engine';
import type { PlaceOfSupply } from '../engine';
import { COUNTRIES, CURRENCIES, placeOfSupplyForCountry } from '../lib/countries';
import {
  huellaAlta,
  buildQrUrl,
  centsToAmountString,
  isoToAeatDate,
  fechaHoraHusoGen,
  QR_HEADER,
  VERIFACTU_MARK,
  VERIFIABLE_MARK,
} from '../lib/verifactu';
import type { Factura, FacturaDocType, IssuerProfile } from '../types/factura';
import {
  DOC_TYPE_LABELS,
  facturaRef,
  facturaTotals,
  legalMention,
  lineAmountCents,
  nextFacturaNumber,
} from '../lib/factura';
import { Badge, Button, Card, Field, InfoTip, SectionTitle, Select, TextInput } from '../components/ui';
import { MoneyInput } from '../components/MoneyInput';

const PLACE_LABELS: Record<PlaceOfSupply, string> = {
  domestic_es: 'Cliente español',
  eu_b2b: 'Empresa de la UE (B2B)',
  non_eu_export: 'Empresa fuera de la UE (p. ej. EE. UU.)',
  domestic_b2c: 'Particular español (B2C)',
  other: 'Otro',
};
const PLACE_DEFAULTS: Record<PlaceOfSupply, { iva: number; ret: number; country: string }> = {
  domestic_es: { iva: 21, ret: 15, country: 'España' },
  eu_b2b: { iva: 0, ret: 0, country: '' },
  non_eu_export: { iva: 0, ret: 0, country: '' },
  domestic_b2c: { iva: 21, ret: 0, country: 'España' },
  other: { iva: 21, ret: 0, country: '' },
};

/** Load the (heavy) PDF renderer only when the user actually exports a PDF. */
async function downloadPdf(factura: Factura, issuer: IssuerProfile): Promise<void> {
  const { downloadFacturaPdf } = await import('../components/FacturaPDF');
  await downloadFacturaPdf(factura, issuer);
}

function emptyFactura(year: number, facturas: Factura[]): Factura {
  return {
    id: newId(),
    docType: 'proforma',
    series: 'F',
    number: nextFacturaNumber(facturas, 'F', year),
    year,
    issueDate: new Date().toISOString().slice(0, 10),
    clientName: '',
    clientNif: '',
    clientAddress: '',
    clientPostalCode: '',
    clientCity: '',
    clientCountry: 'España',
    placeOfSupply: 'non_eu_export',
    lineItems: [{ id: crypto.randomUUID(), concept: '', quantity: 1, unitPriceCents: 0 }],
    ivaRate: 0,
    retencionRate: 0,
    paymentTerms: 'Pago a 7 días desde la emisión.',
    notes: '',
    currency: 'EUR',
  };
}

export function FacturasScreen() {
  const facturas = useStore((s) => s.facturas);
  const issuer = useStore((s) => s.issuer);
  const activeYear = useStore((s) => s.activeYear);
  const saveFactura = useStore((s) => s.saveFactura);
  const deleteFactura = useStore((s) => s.deleteFactura);
  const addFacturaToIncome = useStore((s) => s.addFacturaToIncome);
  const removeFacturaFromIncome = useStore((s) => s.removeFacturaFromIncome);

  const [draft, setDraft] = useState<Factura>(() => emptyFactura(activeYear, facturas));

  function patch(p: Partial<Factura>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function setPlace(place: PlaceOfSupply) {
    const def = PLACE_DEFAULTS[place];
    setDraft((d) => ({
      ...d,
      placeOfSupply: place,
      ivaRate: def.iva,
      retencionRate: def.ret,
      clientCountry: def.country || d.clientCountry,
    }));
  }
  // Picking the client's country auto-derives the place of supply (Spain →
  // domestic, EU → reverse charge, non-EU → no sujeto) and the IVA/retención
  // defaults — the export-invoicing shortcut.
  function setCountry(country: string) {
    const place = placeOfSupplyForCountry(country);
    const def = PLACE_DEFAULTS[place];
    setDraft((d) => ({ ...d, clientCountry: country, placeOfSupply: place, ivaRate: def.iva, retencionRate: def.ret }));
  }
  function setLine(id: string, p: Partial<Factura['lineItems'][number]>) {
    patch({ lineItems: draft.lineItems.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  }
  function addLine() {
    patch({ lineItems: [...draft.lineItems, { id: crypto.randomUUID(), concept: '', quantity: 1, unitPriceCents: 0 }] });
  }
  function removeLine(id: string) {
    if (draft.lineItems.length <= 1) return;
    patch({ lineItems: draft.lineItems.filter((l) => l.id !== id) });
  }

  async function save() {
    await saveFactura(draft);
  }

  const [vfStatus, setVfStatus] = useState<string | null>(null);
  async function generateVerifactu() {
    if (!issuer.nif.trim()) {
      setVfStatus('Añade tu NIF en «Tus datos de emisor» para generar el registro Verifactu.');
      return;
    }
    setVfStatus('Generando…');
    const totals = facturaTotals(draft);
    const importe = centsToAmountString(totals.baseCents + totals.ivaCents);
    const numSerie = facturaRef(draft);
    const fecha = isoToAeatDate(draft.issueDate);
    // Chain from the most recently generated Verifactu record in this SIF.
    const prev = facturas
      .filter((f) => f.verifactu)
      .map((f) => f.verifactu!)
      .sort((a, b) => b.fechaHoraGen.localeCompare(a.fechaHoraGen))[0];
    const huellaAnterior = prev?.huella ?? '';
    const fechaHoraGen = fechaHoraHusoGen(new Date());

    const huella = await huellaAlta({
      idEmisor: issuer.nif,
      numSerie,
      fechaExpedicion: fecha,
      tipoFactura: 'F1',
      cuotaTotal: centsToAmountString(totals.ivaCents),
      importeTotal: importe,
      huellaAnterior,
      fechaHoraGen,
    });
    const qrUrl = buildQrUrl({ nif: issuer.nif, numSerie, fecha, importe, verifactu: true, env: 'produccion' });
    const QRCode = await import('qrcode');
    const qrImage = await QRCode.toDataURL(qrUrl, { errorCorrectionLevel: 'M', margin: 2, width: 240 });

    const updated: Factura = {
      ...draft,
      verifactu: { huella, huellaAnterior, fechaHoraGen, qrUrl, qrImage, env: 'produccion' },
    };
    setDraft(updated);
    await saveFactura(updated);
    setVfStatus('Registro Verifactu generado (huella + QR). No se ha enviado a la AEAT.');
  }
  function newDraft() {
    setDraft(emptyFactura(activeYear, facturas));
  }
  const linked = facturas.find((f) => f.id === draft.id)?.linkedInvoiceId;

  return (
    <div className="space-y-6">
      <SectionTitle sub="Crea facturas/proformas en PDF y, si quieres, añádelas a tus ingresos para que entren en el cálculo. No emite facturas fiscales (sin Verifactu).">
        Facturas
      </SectionTitle>

      <VerifactuNote />

      <IssuerEditor issuer={issuer} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Builder */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Datos de la factura</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de documento">
              <Select value={draft.docType} onChange={(e) => patch({ docType: e.target.value as FacturaDocType })}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha">
              <TextInput type="date" value={draft.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} />
            </Field>
            <Field label="Serie">
              <TextInput value={draft.series} onChange={(e) => patch({ series: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Número">
              <TextInput type="number" min={1} value={draft.number} onChange={(e) => patch({ number: Math.max(1, Number(e.target.value)) })} />
            </Field>
          </div>

          <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Cliente</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de cliente / lugar de prestación">
              <Select value={draft.placeOfSupply} onChange={(e) => setPlace(e.target.value as PlaceOfSupply)}>
                {Object.entries(PLACE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre del cliente">
              <TextInput value={draft.clientName} onChange={(e) => patch({ clientName: e.target.value })} />
            </Field>
            <Field label={draft.placeOfSupply === 'eu_b2b' ? 'NIF-IVA del cliente' : 'CIF/NIF/NIE'}>
              <TextInput value={draft.clientNif} onChange={(e) => patch({ clientNif: e.target.value })} />
            </Field>
            <Field
              label="País del cliente"
              hint={
                draft.placeOfSupply === 'eu_b2b'
                  ? 'Intracomunitario: necesitas estar en el ROI/VIES; se informa en el Modelo 349.'
                  : draft.placeOfSupply === 'non_eu_export'
                    ? 'Fuera de la UE: operación no sujeta a IVA español.'
                    : undefined
              }
            >
              <Select value={draft.clientCountry} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Dirección">
              <TextInput value={draft.clientAddress} onChange={(e) => patch({ clientAddress: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="C. postal">
                <TextInput value={draft.clientPostalCode} onChange={(e) => patch({ clientPostalCode: e.target.value })} />
              </Field>
              <Field label="Ciudad">
                <TextInput value={draft.clientCity} onChange={(e) => patch({ clientCity: e.target.value })} />
              </Field>
            </div>
          </div>

          <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Conceptos</h4>
          <div className="space-y-2">
            {draft.lineItems.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_64px_96px_28px] items-center gap-2">
                <TextInput placeholder="Concepto" value={l.concept} onChange={(e) => setLine(l.id, { concept: e.target.value })} />
                <TextInput type="number" min={0} step="0.5" className="tnum text-right" value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Number(e.target.value) })} />
                <MoneyInput valueCents={l.unitPriceCents} onChange={(c) => setLine(l.id, { unitPriceCents: c })} />
                <button className="text-muted hover:text-danger" onClick={() => removeLine(l.id)} aria-label="Eliminar concepto">×</button>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="mt-2" onClick={addLine}>+ Añadir otro concepto</Button>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="IVA (%)">
              <Select value={draft.ivaRate} onChange={(e) => patch({ ivaRate: Number(e.target.value) })}>
                {[0, 4, 10, 21].map((r) => <option key={r} value={r}>{r}%</option>)}
              </Select>
            </Field>
            <Field label="Retención IRPF (%)">
              <Select value={draft.retencionRate} onChange={(e) => patch({ retencionRate: Number(e.target.value) })}>
                {[0, 7, 15].map((r) => <option key={r} value={r}>{r}%</option>)}
              </Select>
            </Field>
            <Field label="Divisa" hint={draft.currency !== 'EUR' ? 'Solo afecta al PDF. El cálculo de impuestos es en EUR.' : undefined}>
              <Select value={draft.currency} onChange={(e) => patch({ currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Condiciones de pago">
              <TextInput value={draft.paymentTerms} onChange={(e) => patch({ paymentTerms: e.target.value })} />
            </Field>
            <Field label="Notas">
              <TextInput value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} />
            </Field>
          </div>
        </Card>

        {/* Live preview */}
        <div className="space-y-4">
          <Card className="p-5">
            <Preview factura={draft} issuer={issuer} />
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => downloadPdf(draft, issuer)}>Descargar PDF</Button>
            <Button onClick={save}>Guardar borrador</Button>
            {linked ? (
              <Button variant="ghost" onClick={() => removeFacturaFromIncome(draft)}>Quitar de ingresos</Button>
            ) : (
              <Button onClick={() => addFacturaToIncome(draft)} disabled={draft.currency !== 'EUR'}>Añadir a ingresos</Button>
            )}
            <Button variant="ghost" onClick={newDraft}>Nueva</Button>
          </div>
          {draft.docType === 'factura' && (
            <div className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink">Verifactu (preparación)</span>
                <Button onClick={generateVerifactu}>
                  {draft.verifactu ? 'Regenerar registro Verifactu' : 'Generar registro Verifactu'}
                </Button>
              </div>
              {draft.verifactu && (
                <p className="mt-2 break-all font-mono text-[10px] text-muted">
                  Huella: {draft.verifactu.huella}
                </p>
              )}
              {vfStatus && <p className="mt-1 text-xs text-muted">{vfStatus}</p>}
              <p className="mt-1 text-[11px] text-muted">
                Genera la huella encadenada y el QR en formato AEAT. <strong>No</strong> se envía a
                la AEAT (eso requiere certificado digital). Obligatorio para autónomos desde el 1 jul
                2027.
              </p>
            </div>
          )}
          {linked && <p className="text-xs text-positive">Esta factura está incluida en tus ingresos y cuenta para el cálculo.</p>}
          {!linked && draft.currency !== 'EUR' && (
            <p className="text-xs text-muted">
              Factura en {draft.currency}: añádela a ingresos manualmente con el importe en EUR (el
              cálculo de impuestos es en EUR).
            </p>
          )}
        </div>
      </div>

      {/* Saved list */}
      {facturas.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Referencia</th>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {facturas
                  .slice()
                  .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
                  .map((f) => (
                    <tr key={f.id} className="border-t border-border hover:bg-surface-2/40">
                      <td className="px-4 py-2 font-mono tnum">
                        {facturaRef(f)} {f.linkedInvoiceId && <Badge tone="positive">en ingresos</Badge>} {f.verifactu && <Badge tone="accent">Verifactu</Badge>}
                      </td>
                      <td className="px-4 py-2 tnum text-muted">{f.issueDate}</td>
                      <td className="px-4 py-2">{f.clientName || '—'}</td>
                      <td className="px-4 py-2 text-right font-mono tnum">{formatCurrency(facturaTotals(f).totalCents, f.currency)}</td>
                      <td className="px-4 py-2 text-right">
                        <button className="text-xs text-accent hover:underline" onClick={() => setDraft(f)}>Editar</button>
                        <button className="ml-3 text-xs text-accent hover:underline" onClick={() => downloadPdf(f, issuer)}>PDF</button>
                        <button className="ml-3 text-xs text-danger hover:underline" onClick={() => deleteFactura(f.id)}>Borrar</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function VerifactuNote() {
  return (
    <Card className="p-4 bg-warn-soft border-warn/20">
      <p className="text-xs leading-relaxed text-warn">
        <strong>Verifactu: preparación, no envío.</strong> Para documentos de tipo «Factura» puedes
        generar el <strong>registro Verifactu</strong> (huella encadenada + QR en formato oficial
        AEAT, verificado contra los vectores de prueba de la AEAT). Pero esta herramienta
        <strong> no remite</strong> las facturas a la AEAT (eso exige certificado digital y el
        servicio web de la Agencia), así que por sí sola no constituye cumplimiento completo. La
        obligación para autónomos empieza el <strong>1 de julio de 2027</strong>.
      </p>
    </Card>
  );
}

function IssuerEditor({ issuer }: { issuer: IssuerProfile }) {
  const setIssuer = useStore((s) => s.setIssuer);
  const [open, setOpen] = useState(!issuer.name);

  function patch(p: Partial<IssuerProfile>) {
    void setIssuer({ ...issuer, ...p });
  }
  function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => patch({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <Card className="p-5">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((o) => !o)}>
        <h3 className="flex items-center text-sm font-semibold">
          Tus datos de emisor
          <InfoTip text="Aparecen en la cabecera de tus facturas. Se guardan solo en este navegador." />
        </h3>
        <span className="text-muted">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre / razón social">
            <TextInput value={issuer.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label="NIF">
            <TextInput value={issuer.nif} onChange={(e) => patch({ nif: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <TextInput value={issuer.address} onChange={(e) => patch({ address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="C. postal">
              <TextInput value={issuer.postalCode} onChange={(e) => patch({ postalCode: e.target.value })} />
            </Field>
            <Field label="Ciudad">
              <TextInput value={issuer.city} onChange={(e) => patch({ city: e.target.value })} />
            </Field>
          </div>
          <Field label="País">
            <TextInput value={issuer.country} onChange={(e) => patch({ country: e.target.value })} />
          </Field>
          <Field label="IBAN (opcional)">
            <TextInput value={issuer.iban ?? ''} onChange={(e) => patch({ iban: e.target.value })} />
          </Field>
          <Field label="Logo (opcional)">
            <div className="flex items-center gap-3">
              {issuer.logoDataUrl && <img src={issuer.logoDataUrl} alt="logo" className="h-10 w-auto rounded border border-border" />}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogo(f); }} className="text-xs" />
              {issuer.logoDataUrl && (
                <button className="text-xs text-danger hover:underline" onClick={() => patch({ logoDataUrl: undefined })}>Quitar</button>
              )}
            </div>
          </Field>
        </div>
      )}
    </Card>
  );
}

function Preview({ factura, issuer }: { factura: Factura; issuer: IssuerProfile }) {
  const t = facturaTotals(factura);
  const mention = legalMention(factura.placeOfSupply);
  return (
    <div className="text-sm">
      <div className="flex items-start justify-between">
        <div>
          {issuer.logoDataUrl ? (
            <img src={issuer.logoDataUrl} alt="logo" className="mb-2 h-10 w-auto" />
          ) : (
            <div className="font-semibold">{issuer.name || 'Tu nombre'}</div>
          )}
          <div className="text-xs text-muted">{issuer.nif}</div>
          <div className="text-xs text-muted">{issuer.address}</div>
          <div className="text-xs text-muted">{[issuer.postalCode, issuer.city].filter(Boolean).join(' ')}</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-xl">{DOC_TYPE_LABELS[factura.docType]}</div>
          <div className="text-xs text-muted tnum">{facturaRef(factura)}</div>
          <div className="text-xs text-muted tnum">{factura.issueDate}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wide text-muted">Cliente</div>
        <div className="font-medium">{factura.clientName || '—'}</div>
        <div className="text-xs text-muted">{factura.clientNif}</div>
        <div className="text-xs text-muted">{[factura.clientPostalCode, factura.clientCity, factura.clientCountry].filter(Boolean).join(', ')}</div>
      </div>

      <table className="mt-4 w-full text-xs">
        <thead className="text-muted">
          <tr className="border-b border-border">
            <th className="py-1 text-left font-medium">Concepto</th>
            <th className="py-1 text-right font-medium">Cant.</th>
            <th className="py-1 text-right font-medium">Precio</th>
            <th className="py-1 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {factura.lineItems.map((l) => (
            <tr key={l.id} className="border-b border-border">
              <td className="py-1">{l.concept || '—'}</td>
              <td className="py-1 text-right tnum">{l.quantity}</td>
              <td className="py-1 text-right tnum">{formatCurrency(l.unitPriceCents, factura.currency)}</td>
              <td className="py-1 text-right tnum">{formatCurrency(lineAmountCents(l), factura.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 ml-auto w-48 space-y-1 text-xs">
        <Line label="Base imponible" value={formatCurrency(t.baseCents, factura.currency)} />
        <Line label={`IVA (${factura.ivaRate}%)`} value={factura.ivaRate ? formatCurrency(t.ivaCents, factura.currency) : '—'} />
        {factura.retencionRate > 0 && <Line label={`Retención (${factura.retencionRate}%)`} value={`−${formatCurrency(t.retencionCents, factura.currency)}`} />}
        <div className="flex justify-between border-t border-ink pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tnum">{formatCurrency(t.totalCents, factura.currency)}</span>
        </div>
      </div>

      {mention && <p className="mt-4 rounded bg-surface-2/60 p-2 text-[11px] text-muted">{mention}</p>}

      {factura.verifactu && (
        <div className="mt-4 flex items-start gap-3 rounded border border-border p-2">
          <img src={factura.verifactu.qrImage} alt="QR tributario" className="h-20 w-20" />
          <div className="text-[10px] leading-snug text-muted">
            <div className="font-semibold text-ink">{QR_HEADER}</div>
            <div className="font-semibold text-ink">{VERIFACTU_MARK}</div>
            <div>{VERIFIABLE_MARK}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="tnum text-ink">{value}</span>
    </div>
  );
}

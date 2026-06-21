import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import { formatCurrency } from '../engine';
import type { Factura, IssuerProfile } from '../types/factura';
import {
  DOC_TYPE_LABELS,
  facturaRef,
  facturaTotals,
  legalMention,
  lineAmountCents,
  NON_FISCAL_NOTICE,
} from '../lib/factura';

const C = {
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  accent: '#2563eb',
  soft: '#f1f3f7',
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, color: C.ink, fontFamily: 'Helvetica', lineHeight: 1.5 },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logo: { maxWidth: 140, maxHeight: 56, objectFit: 'contain' },
  issuerName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  muted: { color: C.muted },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
  ref: { color: C.muted, marginTop: 2 },
  sectionLabel: { fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  block: { marginBottom: 18, maxWidth: 240 },
  tHead: { flexDirection: 'row', backgroundColor: C.soft, paddingVertical: 6, paddingHorizontal: 8, marginTop: 8 },
  tRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.border },
  cConcept: { flex: 1 },
  cQty: { width: 60, textAlign: 'right' },
  cPrice: { width: 80, textAlign: 'right' },
  cAmount: { width: 90, textAlign: 'right' },
  totals: { marginTop: 14, marginLeft: 'auto', width: 240 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: C.ink },
  grandTotalText: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  mention: { marginTop: 22, padding: 8, backgroundColor: C.soft, color: C.muted, fontSize: 8 },
  notice: { marginTop: 8, fontSize: 7, color: C.muted },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 7, color: C.muted, textAlign: 'center' },
  bold: { fontFamily: 'Helvetica-Bold' },
});

export function FacturaDocument({ factura, issuer }: { factura: Factura; issuer: IssuerProfile }) {
  const t = facturaTotals(factura);
  const mention = legalMention(factura.placeOfSupply);

  return (
    <Document title={`${DOC_TYPE_LABELS[factura.docType]} ${facturaRef(factura)}`}>
      <Page size="A4" style={s.page}>
        {/* Header: logo + issuer */}
        <View style={s.header}>
          <View>
            {issuer.logoDataUrl ? (
              <Image style={s.logo} src={issuer.logoDataUrl} />
            ) : (
              <Text style={s.issuerName}>{issuer.name || 'Tu nombre'}</Text>
            )}
            {issuer.logoDataUrl && <Text style={[s.issuerName, { marginTop: 6 }]}>{issuer.name}</Text>}
            <Text style={s.muted}>{issuer.nif}</Text>
            <Text style={s.muted}>{issuer.address}</Text>
            <Text style={s.muted}>
              {[issuer.postalCode, issuer.city].filter(Boolean).join(' ')}
            </Text>
            <Text style={s.muted}>{issuer.country}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.title}>{DOC_TYPE_LABELS[factura.docType]}</Text>
            <Text style={s.ref}>{facturaRef(factura)}</Text>
            <Text style={s.ref}>{formatDate(factura.issueDate)}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={s.block}>
          <Text style={s.sectionLabel}>Cliente</Text>
          <Text style={s.bold}>{factura.clientName || '—'}</Text>
          {factura.clientNif ? <Text style={s.muted}>{factura.clientNif}</Text> : null}
          {factura.clientAddress ? <Text style={s.muted}>{factura.clientAddress}</Text> : null}
          <Text style={s.muted}>{[factura.clientPostalCode, factura.clientCity].filter(Boolean).join(' ')}</Text>
          <Text style={s.muted}>{factura.clientCountry}</Text>
        </View>

        {/* Line items */}
        <View style={s.tHead}>
          <Text style={[s.cConcept, s.bold]}>Concepto</Text>
          <Text style={[s.cQty, s.bold]}>Cantidad</Text>
          <Text style={[s.cPrice, s.bold]}>Precio</Text>
          <Text style={[s.cAmount, s.bold]}>Importe</Text>
        </View>
        {factura.lineItems.map((l) => (
          <View key={l.id} style={s.tRow}>
            <Text style={s.cConcept}>{l.concept || '—'}</Text>
            <Text style={s.cQty}>{l.quantity}</Text>
            <Text style={s.cPrice}>{formatCurrency(l.unitPriceCents, factura.currency)}</Text>
            <Text style={s.cAmount}>{formatCurrency(lineAmountCents(l), factura.currency)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text style={s.muted}>Base imponible</Text>
            <Text>{formatCurrency(t.baseCents, factura.currency)}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={s.muted}>IVA ({factura.ivaRate}%)</Text>
            <Text>{factura.ivaRate ? formatCurrency(t.ivaCents, factura.currency) : '—'}</Text>
          </View>
          {factura.retencionRate > 0 && (
            <View style={s.totalLine}>
              <Text style={s.muted}>Retención IRPF ({factura.retencionRate}%)</Text>
              <Text>−{formatCurrency(t.retencionCents, factura.currency)}</Text>
            </View>
          )}
          <View style={s.grandTotal}>
            <Text style={s.grandTotalText}>Total</Text>
            <Text style={s.grandTotalText}>{formatCurrency(t.totalCents, factura.currency)}</Text>
          </View>
        </View>

        {/* Payment + notes */}
        {(factura.paymentTerms || factura.notes || issuer.iban) && (
          <View style={{ marginTop: 22 }}>
            {factura.paymentTerms ? (
              <>
                <Text style={s.sectionLabel}>Condiciones de pago</Text>
                <Text style={s.muted}>{factura.paymentTerms}</Text>
              </>
            ) : null}
            {issuer.iban ? <Text style={[s.muted, { marginTop: 4 }]}>IBAN: {issuer.iban}</Text> : null}
            {factura.notes ? <Text style={[s.muted, { marginTop: 6 }]}>{factura.notes}</Text> : null}
          </View>
        )}

        {/* Legal mention by place of supply */}
        {mention ? <Text style={s.mention}>{mention}</Text> : null}

        {/* Non-fiscal notice */}
        <Text style={s.notice}>{NON_FISCAL_NOTICE}</Text>

        <Text style={s.footer} fixed>
          {DOC_TYPE_LABELS[factura.docType]} {facturaRef(factura)} · Generado con Calculadora Autónomos
        </Text>
      </Page>
    </Document>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Build a Blob for the factura PDF and trigger a download. */
export async function downloadFacturaPdf(factura: Factura, issuer: IssuerProfile): Promise<void> {
  const blob = await pdf(<FacturaDocument factura={factura} issuer={issuer} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${DOC_TYPE_LABELS[factura.docType].replace(/\s+/g, '-')}-${facturaRef(factura)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

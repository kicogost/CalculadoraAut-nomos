import type { YearComputation } from '../engine';
import { QUARTER_LABELS } from '../engine';

export interface Obligation {
  id: string;
  model: string;
  label: string;
  dueDate: string; // ISO
  amountCents: number;
  /** Informational filings carry no payment. */
  informational: boolean;
  explanation: string;
}

/** Build the year's filing calendar with estimated amounts from a computation. */
export function buildObligations(comp: YearComputation): Obligation[] {
  const { cfg, modelo303, modelo130, modelo130Required, irpf, income, regularizacion } = comp;
  const out: Obligation[] = [];

  for (let q = 1; q <= 4; q++) {
    const due = cfg.deadlines.quarterly[q - 1];
    const iva = modelo303[q - 1];
    out.push({
      id: `303-${q}`,
      model: 'Modelo 303',
      label: `IVA ${QUARTER_LABELS[q - 1]}`,
      dueDate: due,
      amountCents: Math.max(0, iva.resultCents),
      informational: false,
      explanation:
        'IVA repercutido menos IVA soportado deducible del trimestre. Para servicios de exportación suele salir 0 (operación no sujeta).',
    });
    if (modelo130Required.required) {
      const m130 = modelo130[q - 1];
      out.push({
        id: `130-${q}`,
        model: 'Modelo 130',
        label: `Pago fraccionado IRPF ${QUARTER_LABELS[q - 1]}`,
        dueDate: due,
        amountCents: m130.dueCents,
        informational: false,
        explanation:
          '20% del rendimiento neto acumulado del año, menos pagos de 130 anteriores y retenciones soportadas. Obligatorio porque menos del 70% de tus ingresos llevó retención.',
      });
    }
  }

  // Annual IVA summary (informational).
  out.push({
    id: '390',
    model: 'Modelo 390',
    label: 'Resumen anual de IVA',
    dueDate: cfg.deadlines.modelo390,
    amountCents: 0,
    informational: true,
    explanation: 'Declaración informativa anual de IVA. No conlleva pago.',
  });

  // Renta annual residual (Modelo 100): IRPF − 130 pagado − retención.
  const total130 = modelo130.reduce((a, q) => a + q.dueCents, 0);
  const rentaResidual = irpf.totalCuotaCents - total130 - income.retencionCents;
  out.push({
    id: '100',
    model: 'Modelo 100',
    label: 'Declaración de la Renta (resultado estimado)',
    dueDate: cfg.deadlines.modelo100,
    amountCents: Math.max(0, rentaResidual),
    informational: false,
    explanation:
      'IRPF anual estimado (estatal + autonómico, neto del mínimo) menos los pagos fraccionados (130) y las retenciones ya soportadas. Puede salir a devolver.',
  });

  // SS regularización (no hard date; refund/bill arrives ~April del año siguiente).
  if (regularizacion.differenceCents !== 0) {
    out.push({
      id: 'ss-reg',
      model: 'Seguridad Social',
      label:
        regularizacion.differenceCents > 0
          ? 'Regularización RETA (pago estimado)'
          : 'Regularización RETA (devolución estimada)',
      dueDate: `${cfg.year + 1}-04-30`,
      amountCents: Math.abs(regularizacion.differenceCents),
      informational: false,
      explanation:
        'Al cierre del año, la Seguridad Social compara las cuotas pagadas con el tramo que corresponde a tus rendimientos reales y regulariza la diferencia.',
    });
  }

  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** The next obligation due on or after `todayISO`. */
export function nextObligation(obligations: Obligation[], todayISO: string): Obligation | null {
  return obligations.find((o) => o.dueDate >= todayISO) ?? null;
}

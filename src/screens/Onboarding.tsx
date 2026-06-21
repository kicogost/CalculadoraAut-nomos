import { useState } from 'react';
import { useStore, defaultProfile } from '../store/useStore';
import { COMUNIDADES, eurToCents, type PlaceOfSupply, type YearProfile } from '../engine';
import { Button, Card, Field, Select } from '../components/ui';
import { BrandLockup } from '../components/Logo';

type Persona = 'domestic' | 'eu' | 'export';

const PERSONA_INFO: Record<Persona, { place: PlaceOfSupply; iva: number; ret: number; text: string }> = {
  domestic: {
    place: 'domestic_es',
    iva: 21,
    ret: 15,
    text: 'Facturas a clientes españoles: repercutes 21% de IVA y normalmente te retienen un 15% de IRPF. Presentarás 303 e (según retenciones) 130.',
  },
  eu: {
    place: 'eu_b2b',
    iva: 0,
    ret: 0,
    text: 'Facturas a empresas de la UE: sin IVA español (inversión del sujeto pasivo), se informa en el Modelo 349. Necesitas estar en el ROI/VIES.',
  },
  export: {
    place: 'non_eu_export',
    iva: 0,
    ret: 0,
    text: 'Tus servicios a una empresa de fuera de la UE (p. ej. EE. UU.) normalmente no están sujetos a IVA español, y como nadie te retiene, tendrás que presentar el Modelo 130. Tu provisión principal será IRPF + cuota.',
  },
};

export function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const addInvoice = useStore((s) => s.addInvoice);
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(2026);
  const [comunidad, setComunidad] = useState('madrid');
  const [firstYears, setFirstYears] = useState(true);
  const [persona, setPersona] = useState<Persona>('export');
  const [sample, setSample] = useState(true);

  async function finish() {
    const base = defaultProfile(year);
    const profile: YearProfile = {
      ...base,
      year,
      comunidadAutonoma: comunidad,
      ssStatus: firstYears ? { kind: 'tarifa_plana_y1' } : base.ssStatus,
    };
    await completeOnboarding(profile);
    if (sample) {
      const info = PERSONA_INFO[persona];
      await addInvoice({
        date: `${year}-01-15`,
        clientName: 'Ejemplo — bórralo cuando quieras',
        amountCents: eurToCents(3000),
        placeOfSupply: info.place,
        ivaRate: info.iva,
        retencionRate: info.ret,
        notes: 'Factura de muestra creada en el onboarding.',
      });
    }
  }

  const steps = [
    // 0 — welcome + disclaimer (non-dismissable acknowledgement)
    <Step key="w" title="Independízate del susto del IRPF" onNext={() => setStep(1)} nextLabel="Empezar">
      <p className="text-sm text-muted">
        Ves dinero en la cuenta, crees que es beneficio, te lo gastas… y en junio llega el hachazo.
        Esta herramienta te enseña tu <strong className="text-ink">beneficio neto real</strong> y
        <strong className="text-ink"> cuánto apartar cada mes</strong> para cubrir IVA, IRPF (Modelo
        130 y Renta), la cuota de autónomos y la regularización de fin de año. Sin sustos.
      </p>
      <div className="mt-4 rounded-xl bg-warn-soft p-4 text-xs leading-relaxed text-warn">
        <strong>Importante:</strong> es una herramienta de estimación, no asesoramiento fiscal (no
        constituye asesoramiento fiscal). Los tipos y reglas cambian; verifica con un gestor o con la
        Agencia Tributaria antes de presentar. Todo son estimaciones a provisionar.
      </div>
    </Step>,

    // 1 — year
    <Step key="y" title="¿Qué ejercicio vas a configurar?" onBack={() => setStep(0)} onNext={() => setStep(2)}>
      <Field label="Ejercicio fiscal">
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          <option value={2026}>2026</option>
        </Select>
      </Field>
    </Step>,

    // 2 — comunidad
    <Step key="c" title="¿Dónde está tu residencia fiscal este año?" onBack={() => setStep(1)} onNext={() => setStep(3)}>
      <Field label="Comunidad autónoma" hint="La residencia de un año es la comunidad donde pasas más días ese año.">
        <Select value={comunidad} onChange={(e) => setComunidad(e.target.value)}>
          {COMUNIDADES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>
    </Step>,

    // 3 — first years
    <Step key="f" title="¿Estás en tus primeros años como autónomo?" onBack={() => setStep(2)} onNext={() => setStep(4)}>
      <div className="space-y-2">
        <Choice selected={firstYears} onClick={() => setFirstYears(true)} title="Sí, primeros años"
          desc="Te ponemos en tarifa plana (80 €/mes). Además, puedes aplicar una retención reducida del 7% el año de alta y los dos siguientes." />
        <Choice selected={!firstYears} onClick={() => setFirstYears(false)} title="No, ya llevo tiempo"
          desc="Cotizarás por el tramo que corresponda a tus rendimientos." />
      </div>
    </Step>,

    // 4 — persona
    <Step key="p" title="¿A quién facturas principalmente?" onBack={() => setStep(3)} onNext={() => setStep(5)}>
      <div className="space-y-2">
        <Choice selected={persona === 'domestic'} onClick={() => setPersona('domestic')} title="Clientes españoles" desc={PERSONA_INFO.domestic.text} />
        <Choice selected={persona === 'eu'} onClick={() => setPersona('eu')} title="Empresas de la UE" desc={PERSONA_INFO.eu.text} />
        <Choice selected={persona === 'export'} onClick={() => setPersona('export')} title="Empresas fuera de la UE (p. ej. EE. UU.)" desc={PERSONA_INFO.export.text} />
      </div>
    </Step>,

    // 5 — finish
    <Step key="d" title="Todo listo" onBack={() => setStep(4)} onNext={finish} nextLabel="Ir al resumen">
      <p className="text-sm text-muted">
        Empezarás con {sample ? 'una factura de muestra (puedes borrarla en un clic)' : 'una pizarra en blanco'}.
        Configura más detalles en «Año y perfil» cuando quieras.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} />
        Crear una factura de muestra para ver cifras de inmediato
      </label>
    </Step>,
  ];

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-lg">
        <BrandLockup className="mb-4" />
        {steps[step]}
        <div className="mt-4 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  children,
  onBack,
  onNext,
  nextLabel = 'Siguiente',
}: {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 font-serif text-2xl text-ink">{title}</h2>
      {children}
      <div className="mt-6 flex justify-between">
        {onBack ? <Button variant="ghost" onClick={onBack}>Atrás</Button> : <span />}
        {onNext && <Button variant="primary" onClick={onNext}>{nextLabel}</Button>}
      </div>
    </Card>
  );
}

function Choice({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-xl border p-4 text-left transition ${
        selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-2'
      }`}
    >
      <div className="text-sm font-semibold text-ink">{title}</div>
      <div className="mt-1 text-xs text-muted">{desc}</div>
    </button>
  );
}

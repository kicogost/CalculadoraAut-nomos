import { TAX_CONFIG_2026 } from '../engine';

export function Disclaimer() {
  const cfg = TAX_CONFIG_2026;
  return (
    <footer className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted">
      <p>
        <strong className="text-ink">Esto es una herramienta de estimación, no asesoramiento
        fiscal</strong> (no constituye asesoramiento fiscal). Los tipos y las reglas cambian;
        verifica con un gestor o con la Agencia Tributaria antes de presentar cualquier modelo.
        Ninguna cifra es el importe exacto a pagar: trátala como una estimación a provisionar y
        confirmar.
      </p>
      <p className="mt-2">
        Datos fiscales: ejercicio {cfg.year} · constantes verificadas el{' '}
        {new Date(cfg.verifiedOn).toLocaleDateString('es-ES')}.
      </p>
    </footer>
  );
}

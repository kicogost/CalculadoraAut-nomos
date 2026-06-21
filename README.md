# Calculadora Autónomos · cuánto apartar cada mes

App local-first para autónomos en España. Introduce tus ingresos y gastos mes a mes y verás
**cuánto dinero apartar ahora** para cubrir IVA, IRPF (Modelo 130 y Renta), la cuota de autónomos
y la regularización de fin de año de la Seguridad Social — más cuándo vence cada modelo.

Sirve a dos perfiles desde el mismo código:

- **Autónomo estándar** — factura a clientes españoles/UE, repercute 21% de IVA, sufre 15% de
  retención, presenta 303 / 130 / 349 / 390 / 100.
- **Autónomo de servicios de exportación** — factura a empresas de fuera de la UE (p. ej. EE. UU.):
  ingresos *no sujetos* a IVA español, sin retención (Modelo 130 obligatorio), provisión dominada
  por IRPF + cuota.

El ingreso se modela **a nivel de factura** con su tipo de cliente / lugar de prestación, así que
un mismo usuario puede mezclar ingresos de exportación y domésticos.

## Arquitectura

- **Motor fiscal** (`src/engine/`) — funciones **puras, sin dependencias de UI**, con tests
  exhaustivos. Es la parte que debe ser demostrablemente correcta y reverificable cada año.
  - `taxConfig.2026.ts` — única fuente de verdad de tipos y tablas, **versionada por año**. Añadir
    un año nuevo es soltar un nuevo objeto de configuración.
  - Dinero siempre en **céntimos enteros** (nunca floats).
- **Persistencia** — IndexedDB vía Dexie (`src/db/`). Sin backend ni login. Exporta/importa JSON y
  exporta CSV: tus datos son tuyos.
- **UI** — React + Vite + TypeScript + Tailwind v4. Estado en Zustand. Tokens de diseño en CSS
  variables (reskineable).

## Datos fiscales

Todas las constantes están documentadas y con fuentes en [`RESEARCH.md`](./RESEARCH.md)
(verificadas el 2026-06-21). Es **estimación, no asesoramiento fiscal**.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests del motor fiscal (52)
npm run typecheck  # comprobación de tipos
npm run build      # build de producción (estático)
```

## Despliegue

SPA estática lista para **Vercel** (ver `vercel.json`): `npm run build` → `dist/`.

## Limitaciones de v1 (ver RESEARCH.md §7)

- País Vasco y Navarra (regímenes forales) están **fuera de alcance**: no se calcula su IRPF.
- Mínimos autonómicos: se aplica el mínimo estatal a ambos tramos.
- Comunidad Valenciana: anteproyecto pendiente que podría rebajar tipos con efecto retroactivo a 2026.
- Vencimientos Q4/anuales 2026 almacenados como 2027-02-01 (calendario 2027 aún no publicado).

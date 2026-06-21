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

## Funciones principales

- **Resumen / Ingresos / Gastos / Impuestos** — el motor de cálculo y el número estrella
  («aparta esto cada mes»).
- **Facturas** — generador de facturas/proformas en PDF; puede volcar la factura a ingresos para que
  entre en el cálculo. **Verifactu (preparación):** genera la huella encadenada y el QR en formato
  oficial AEAT (verificado contra los vectores de prueba de la AEAT) — pero **no remite** a la AEAT
  (eso requiere certificado digital). Obligación para autónomos: 2027-07-01. Ver `RESEARCH.md` §8.
- **Lector** — importa movimientos desde un **CSV del banco** (100% local, con mapeo de columnas) o
  extrae datos de **facturas/tickets en PDF con IA**, con pantalla de revisión antes de confirmar.
  La parte de IA usa una función serverless (`/api/extract`) que llama a Claude; la clave vive en el
  servidor.

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

### Lector con IA (función serverless)

La extracción con IA vive en `api/extract.ts` (función serverless de Vercel). Para activarla:

1. En Vercel: **Settings → Environment Variables** → añade `ANTHROPIC_API_KEY` (ver `.env.example`).
   Opcional: `EXTRACT_MODEL` (por defecto `claude-haiku-4-5`; sube a `claude-sonnet-4-6` o
   `claude-opus-4-8` para documentos más difíciles). Solo se admiten archivos **PDF**.
2. La clave **nunca llega al navegador**: el cliente sube la imagen/PDF a `/api/extract` y este llama
   a Claude desde el servidor.

> La extracción con IA **no funciona en `npm run dev`** (Vite no sirve `/api`). Úsala en el
> despliegue de Vercel o localmente con `vercel dev`. El importador de CSV sí es 100% local y
> funciona siempre. Aviso de privacidad: al escanear con IA, el documento sale de tu dispositivo
> hacia la API de Anthropic solo para ese análisis.

## Limitaciones de v1 (ver RESEARCH.md §7)

- País Vasco y Navarra (regímenes forales) están **fuera de alcance**: no se calcula su IRPF.
- Mínimos autonómicos: se aplica el mínimo estatal a ambos tramos.
- Comunidad Valenciana: anteproyecto pendiente que podría rebajar tipos con efecto retroactivo a 2026.
- Vencimientos Q4/anuales 2026 almacenados como 2027-02-01 (calendario 2027 aún no publicado).

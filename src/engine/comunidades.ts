import type { Comunidad } from './types';

/**
 * Comunidades autónomas. Common-regime communities have an autonomic IRPF scale
 * in taxConfig. País Vasco and Navarra are foral regimes — out of scope in v1
 * (we never silently apply common-regime scales to them).
 */
export const COMUNIDADES: Comunidad[] = [
  { id: 'andalucia', name: 'Andalucía', foral: false },
  { id: 'aragon', name: 'Aragón', foral: false },
  { id: 'asturias', name: 'Principado de Asturias', foral: false },
  { id: 'baleares', name: 'Illes Balears', foral: false },
  { id: 'canarias', name: 'Canarias', foral: false },
  { id: 'cantabria', name: 'Cantabria', foral: false },
  { id: 'castilla_leon', name: 'Castilla y León', foral: false },
  { id: 'castilla_la_mancha', name: 'Castilla-La Mancha', foral: false },
  { id: 'cataluna', name: 'Cataluña', foral: false },
  { id: 'valencia', name: 'Comunidad Valenciana', foral: false },
  { id: 'extremadura', name: 'Extremadura', foral: false },
  { id: 'galicia', name: 'Galicia', foral: false },
  { id: 'madrid', name: 'Comunidad de Madrid', foral: false },
  { id: 'murcia', name: 'Región de Murcia', foral: false },
  { id: 'la_rioja', name: 'La Rioja', foral: false },
  // Foral regimes — out of scope in v1.
  { id: 'pais_vasco', name: 'País Vasco (régimen foral)', foral: true },
  { id: 'navarra', name: 'Navarra (régimen foral)', foral: true },
];

export function getComunidad(id: string): Comunidad | undefined {
  return COMUNIDADES.find((c) => c.id === id);
}

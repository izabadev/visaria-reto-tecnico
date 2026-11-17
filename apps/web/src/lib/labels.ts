import type { Flow, TraceReason } from './types';

// Textos para que un cliente entienda "¿por qué no respondió mi flujo?" sin leer códigos.
export const REASON_LABELS: Record<TraceReason, string> = {
  paused: 'El flujo está pausado',
  draft: 'El flujo está en borrador',
  excluded_account: 'El remitente está en la lista de cuentas excluidas',
  follower_status_unknown: 'Solo para seguidores y no se sabe si el remitente lo es',
  not_a_follower: 'Solo para seguidores y el remitente no lo es',
  already_executed: 'Solo se ejecuta una vez y este remitente ya lo recibió',
  no_keyword_match: 'Ninguna de sus keywords aparece en el mensaje',
  keyword_match_oldest: 'Su keyword aparece en el mensaje y es el más antiguo',
  catch_all_oldest: 'Comodín más antiguo y ninguna keyword coincidió',
  catch_all_loses_to_keyword: 'Es un comodín y otro flujo coincidió por keyword',
  older_flow_wins: 'Otro flujo del mismo tipo es más antiguo',
};

export const STATUS_LABELS: Record<Flow['status'], string> = {
  active: 'Activo',
  paused: 'Pausado',
  draft: 'Borrador',
};

const relativeTime = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const DAY_MS = 24 * 60 * 60 * 1000;

// "hace 3 meses", "hace 2 años"... a partir de createdAt.
export function formatAge(isoDate: string, now: Date = new Date()): string {
  const days = Math.round((Date.parse(isoDate) - now.getTime()) / DAY_MS);
  if (Math.abs(days) >= 365) return relativeTime.format(Math.round(days / 365), 'year');
  if (Math.abs(days) >= 30) return relativeTime.format(Math.round(days / 30), 'month');
  return relativeTime.format(days, 'day');
}

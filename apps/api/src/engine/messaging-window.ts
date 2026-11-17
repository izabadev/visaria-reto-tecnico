import type { IncomingMessage } from './types.js';

const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Regla 7: Instagram solo permite texto libre durante las 24 h siguientes al último
 * mensaje del usuario. Usamos receivedAt como "ahora", así el motor no depende del reloj.
 * Decisión: sin lastUserMessageAt la ventana se considera abierta, y "más de 24 h" es estricto.
 */
export function isMessagingWindowClosed(message: IncomingMessage): boolean {
  if (message.lastUserMessageAt === undefined) return false;

  const elapsedMs =
    Date.parse(message.receivedAt) - Date.parse(message.lastUserMessageAt);
  return elapsedMs > MESSAGING_WINDOW_MS;
}

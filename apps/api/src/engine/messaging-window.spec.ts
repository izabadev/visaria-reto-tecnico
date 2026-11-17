import { isMessagingWindowClosed } from './messaging-window.js';
import { buildMessage } from './test-builders.js';

const RECEIVED_AT = '2026-06-02T12:00:00.000Z';

describe('isMessagingWindowClosed (regla 7: ventana de 24 h)', () => {
  it('cierra la ventana si el último mensaje del usuario fue hace más de 24 h (24 h y 1 min)', () => {
    const message = buildMessage({
      receivedAt: RECEIVED_AT,
      lastUserMessageAt: '2026-06-01T11:59:00.000Z',
    });
    expect(isMessagingWindowClosed(message)).toBe(true);
  });

  it('mantiene la ventana abierta si fue hace 23 h', () => {
    const message = buildMessage({
      receivedAt: RECEIVED_AT,
      lastUserMessageAt: '2026-06-01T13:00:00.000Z',
    });
    expect(isMessagingWindowClosed(message)).toBe(false);
  });

  it('mantiene la ventana abierta con 24 h exactas ("más de 24 h" es estricto)', () => {
    const message = buildMessage({
      receivedAt: RECEIVED_AT,
      lastUserMessageAt: '2026-06-01T12:00:00.000Z',
    });
    expect(isMessagingWindowClosed(message)).toBe(false);
  });

  it('cierra la ventana con 24 h y 1 ms', () => {
    const message = buildMessage({
      receivedAt: RECEIVED_AT,
      lastUserMessageAt: '2026-06-01T11:59:59.999Z',
    });
    expect(isMessagingWindowClosed(message)).toBe(true);
  });

  it('mantiene la ventana abierta si no hay lastUserMessageAt', () => {
    const message = buildMessage({ receivedAt: RECEIVED_AT });
    expect(isMessagingWindowClosed(message)).toBe(false);
  });

  it('compara instantes aunque las fechas usen zonas horarias distintas', () => {
    // 13:59+02:00 son las 11:59Z: han pasado 24 h y 1 min.
    const message = buildMessage({
      receivedAt: RECEIVED_AT,
      lastUserMessageAt: '2026-06-01T13:59:00+02:00',
    });
    expect(isMessagingWindowClosed(message)).toBe(true);
  });
});

import type { Flow, IncomingMessage } from './types.js';

// Constructores para tests: valores por defecto válidos y solo se sobrescribe lo relevante.

export function buildFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: 'f1',
    name: 'Flujo de prueba',
    status: 'active',
    keywords: [],
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildMessage(
  overrides: Partial<IncomingMessage> = {},
): IncomingMessage {
  return {
    senderId: '1001',
    username: 'ana_garcia',
    text: 'hola',
    isFollower: true,
    receivedAt: '2026-06-01T12:00:00.000Z',
    ...overrides,
  };
}

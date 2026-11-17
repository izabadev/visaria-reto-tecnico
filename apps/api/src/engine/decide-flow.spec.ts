import { decideFlow } from './decide-flow.js';
import { buildFlow, buildMessage } from './test-builders.js';
import type { Execution } from './types.js';

describe('decideFlow', () => {
  it('gana la keyword aunque el comodín sea más antiguo', () => {
    const catchAll = buildFlow({ id: 'comodin', createdAt: '2025-01-01T00:00:00.000Z' });
    const keyword = buildFlow({
      id: 'precios',
      keywords: ['precio'],
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const result = decideFlow([catchAll, keyword], buildMessage({ text: '¿Precio?' }), []);

    expect(result.winner?.id).toBe('precios');
    expect(result.trace).toEqual([
      {
        flowId: 'comodin',
        flowName: catchAll.name,
        result: 'discarded',
        reason: 'catch_all_loses_to_keyword',
        lostTo: 'precios',
      },
      {
        flowId: 'precios',
        flowName: keyword.name,
        result: 'winner',
        reason: 'keyword_match_oldest',
        matchedKeyword: 'precio',
      },
    ]);
  });

  it('con dos flujos con la misma keyword gana el más antiguo', () => {
    const newer = buildFlow({ id: 'nuevo', keywords: ['info'], createdAt: '2026-03-01T00:00:00.000Z' });
    const older = buildFlow({ id: 'viejo', keywords: ['info'], createdAt: '2026-01-01T00:00:00.000Z' });

    const result = decideFlow([newer, older], buildMessage({ text: 'quiero info' }), []);

    expect(result.winner?.id).toBe('viejo');
    expect(result.trace.find((entry) => entry.flowId === 'nuevo')).toMatchObject({
      result: 'discarded',
      reason: 'older_flow_wins',
      lostTo: 'viejo',
    });
  });

  it('con dos comodines gana el más antiguo', () => {
    const newer = buildFlow({ id: 'nuevo', createdAt: '2026-03-01T00:00:00.000Z' });
    const older = buildFlow({ id: 'viejo', createdAt: '2026-01-01T00:00:00.000Z' });

    const result = decideFlow([newer, older], buildMessage(), []);

    expect(result.winner?.id).toBe('viejo');
    expect(result.trace.find((entry) => entry.flowId === 'viejo')?.reason).toBe('catch_all_oldest');
  });

  it('descarta un flujo once ya ejecutado y gana el siguiente candidato', () => {
    const onceFlow = buildFlow({
      id: 'bienvenida',
      repeatPolicy: 'once',
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    const fallback = buildFlow({ id: 'general', createdAt: '2026-01-01T00:00:00.000Z' });
    const executions: Execution[] = [
      { flowId: 'bienvenida', senderId: '1001', executedAt: '2026-05-01T00:00:00.000Z' },
    ];

    const result = decideFlow([onceFlow, fallback], buildMessage({ senderId: '1001' }), executions);

    expect(result.winner?.id).toBe('general');
    expect(result.trace[0]).toMatchObject({ result: 'discarded', reason: 'already_executed' });
  });

  it('compara createdAt como instante y no como texto (zonas horarias distintas)', () => {
    // 10:00+02:00 son las 08:00Z, más antiguo que las 09:00Z aunque como texto parezca posterior.
    const withOffset = buildFlow({ id: 'con_offset', createdAt: '2026-01-01T10:00:00+02:00' });
    const utc = buildFlow({ id: 'utc', createdAt: '2026-01-01T09:00:00Z' });

    const result = decideFlow([utc, withOffset], buildMessage(), []);

    expect(result.winner?.id).toBe('con_offset');
  });

  it('desempata por id cuando createdAt es idéntico, para que el resultado sea estable', () => {
    const b = buildFlow({ id: 'b' });
    const a = buildFlow({ id: 'a' });

    const result = decideFlow([b, a], buildMessage(), []);

    expect(result.winner?.id).toBe('a');
  });

  it('devuelve winner null si ningún flujo responde, con el trace de todos', () => {
    const paused = buildFlow({ id: 'pausado', status: 'paused' });
    const noMatch = buildFlow({ id: 'precios', keywords: ['precio'] });

    const result = decideFlow([paused, noMatch], buildMessage({ text: 'hola' }), []);

    expect(result.winner).toBeNull();
    expect(result.trace).toEqual([
      { flowId: 'pausado', flowName: paused.name, result: 'discarded', reason: 'paused' },
      { flowId: 'precios', flowName: noMatch.name, result: 'discarded', reason: 'no_keyword_match' },
    ]);
  });

  it('devuelve winner null y trace vacío si no hay flujos', () => {
    expect(decideFlow([], buildMessage(), [])).toEqual({ winner: null, trace: [] });
  });
});

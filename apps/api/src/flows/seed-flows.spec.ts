import { decideFlow } from '../engine/decide-flow.js';
import { buildMessage } from '../engine/test-builders.js';
import { SEED_FLOWS } from './seed-flows.js';

const reasonOf = (trace: { flowId: string; reason: string }[], flowId: string) =>
  trace.find((entry) => entry.flowId === flowId)?.reason;

describe('SEED_FLOWS (permite reproducir los casos de la tabla del enunciado)', () => {
  it('keyword y comodín válidos: gana la keyword aunque el comodín sea más antiguo', () => {
    const result = decideFlow(SEED_FLOWS, buildMessage({ text: '¿Cuál es el precio?' }), []);
    expect(result.winner?.id).toBe('f3');
    expect(reasonOf(result.trace, 'f1')).toBe('catch_all_loses_to_keyword');
  });

  it('dos flujos con la misma keyword: gana el más antiguo', () => {
    const result = decideFlow(SEED_FLOWS, buildMessage({ text: 'quiero info' }), []);
    expect(result.winner?.id).toBe('f3');
    expect(reasonOf(result.trace, 'f4')).toBe('older_flow_wins');
  });

  it('remitente excluido por @usuario con otras mayúsculas', () => {
    const message = buildMessage({ text: 'promo', username: 'COMPETENCIA_oficial' });
    const result = decideFlow(SEED_FLOWS, message, []);
    expect(reasonOf(result.trace, 'f6')).toBe('excluded_account');
  });

  it('followers_only con isFollower = null queda descartado', () => {
    const message = buildMessage({ text: 'promo', isFollower: null });
    const result = decideFlow(SEED_FLOWS, message, []);
    expect(reasonOf(result.trace, 'f6')).toBe('follower_status_unknown');
  });

  it('once con ejecución previa: se descarta y gana el siguiente comodín', () => {
    const message = buildMessage({ senderId: '1001', text: 'hola' });
    const executions = [{ flowId: 'f1', senderId: '1001', executedAt: '2026-01-01T00:00:00.000Z' }];

    expect(decideFlow(SEED_FLOWS, message, []).winner?.id).toBe('f1');

    const result = decideFlow(SEED_FLOWS, message, executions);
    expect(result.winner?.id).toBe('f2');
    expect(reasonOf(result.trace, 'f1')).toBe('already_executed');
  });

  it('"Información" no casa con info pero sí con informacion', () => {
    const result = decideFlow(SEED_FLOWS, buildMessage({ text: 'Información' }), []);
    expect(result.winner?.id).toBe('f5');
    expect(reasonOf(result.trace, 'f3')).toBe('no_keyword_match');
  });

  it('flujos pausados y en borrador nunca participan', () => {
    const result = decideFlow(SEED_FLOWS, buildMessage({ text: 'black friday verano' }), []);
    expect(reasonOf(result.trace, 'f7')).toBe('paused');
    expect(reasonOf(result.trace, 'f8')).toBe('draft');
  });
});

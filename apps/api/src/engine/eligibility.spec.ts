import { evaluateEligibility } from './eligibility.js';
import { buildFlow, buildMessage } from './test-builders.js';
import type { Execution } from './types.js';

describe('evaluateEligibility (reglas 1 a 5)', () => {
  describe('regla 1: estado', () => {
    it('descarta un flujo pausado', () => {
      const result = evaluateEligibility(buildFlow({ status: 'paused' }), buildMessage(), []);
      expect(result).toEqual({ eligible: false, reason: 'paused' });
    });

    it('descarta un flujo en borrador', () => {
      const result = evaluateEligibility(buildFlow({ status: 'draft' }), buildMessage(), []);
      expect(result).toEqual({ eligible: false, reason: 'draft' });
    });
  });

  describe('regla 2: cuentas excluidas', () => {
    it('descarta por @usuario aunque cambien las mayúsculas', () => {
      const flow = buildFlow({ excludedAccounts: ['@Ana_Garcia'] });
      const result = evaluateEligibility(flow, buildMessage({ username: 'ana_GARCIA' }), []);
      expect(result).toEqual({ eligible: false, reason: 'excluded_account' });
    });

    it('descarta por senderId numérico', () => {
      const flow = buildFlow({ excludedAccounts: ['1001'] });
      const result = evaluateEligibility(flow, buildMessage({ senderId: '1001' }), []);
      expect(result).toEqual({ eligible: false, reason: 'excluded_account' });
    });

    it('no descarta a otro remitente', () => {
      const flow = buildFlow({ excludedAccounts: ['@otra_cuenta', '9999'] });
      const result = evaluateEligibility(flow, buildMessage(), []);
      expect(result.eligible).toBe(true);
    });
  });

  describe('regla 3: audiencia', () => {
    it('descarta followers_only si isFollower es null (desconocido)', () => {
      const flow = buildFlow({ audience: 'followers_only' });
      const result = evaluateEligibility(flow, buildMessage({ isFollower: null }), []);
      expect(result).toEqual({ eligible: false, reason: 'follower_status_unknown' });
    });

    it('descarta followers_only si el remitente no es seguidor', () => {
      const flow = buildFlow({ audience: 'followers_only' });
      const result = evaluateEligibility(flow, buildMessage({ isFollower: false }), []);
      expect(result).toEqual({ eligible: false, reason: 'not_a_follower' });
    });

    it('acepta audience all aunque isFollower sea null', () => {
      const result = evaluateEligibility(buildFlow(), buildMessage({ isFollower: null }), []);
      expect(result.eligible).toBe(true);
    });
  });

  describe('regla 4: política de repetición', () => {
    const previousRun: Execution = {
      flowId: 'f1',
      senderId: '1001',
      executedAt: '2026-05-01T00:00:00.000Z',
    };

    it('descarta un flujo once que ya ejecutó este remitente', () => {
      const flow = buildFlow({ repeatPolicy: 'once' });
      const result = evaluateEligibility(flow, buildMessage(), [previousRun]);
      expect(result).toEqual({ eligible: false, reason: 'already_executed' });
    });

    it('no descarta un flujo once si la ejecución previa es de otro remitente', () => {
      const flow = buildFlow({ repeatPolicy: 'once' });
      const otherSender = { ...previousRun, senderId: '2002' };
      const result = evaluateEligibility(flow, buildMessage(), [otherSender]);
      expect(result.eligible).toBe(true);
    });

    it('no descarta un flujo always aunque ya se ejecutara', () => {
      const result = evaluateEligibility(buildFlow(), buildMessage(), [previousRun]);
      expect(result.eligible).toBe(true);
    });
  });

  describe('regla 5: keywords', () => {
    it('marca como keyword el flujo cuya keyword aparece en el texto', () => {
      const flow = buildFlow({ keywords: ['precio', 'info'] });
      const result = evaluateEligibility(flow, buildMessage({ text: 'Quiero INFO' }), []);
      expect(result).toEqual({ eligible: true, kind: 'keyword', matchedKeyword: 'info' });
    });

    it('descarta el flujo con keywords si ninguna aparece', () => {
      const flow = buildFlow({ keywords: ['info'] });
      const result = evaluateEligibility(flow, buildMessage({ text: 'información' }), []);
      expect(result).toEqual({ eligible: false, reason: 'no_keyword_match' });
    });

    it('trata como comodín un flujo sin keywords', () => {
      const result = evaluateEligibility(buildFlow({ keywords: [] }), buildMessage(), []);
      expect(result).toEqual({ eligible: true, kind: 'catch_all' });
    });

    it('trata como comodín un flujo cuyas keywords están todas en blanco', () => {
      const result = evaluateEligibility(buildFlow({ keywords: ['', '  '] }), buildMessage(), []);
      expect(result).toEqual({ eligible: true, kind: 'catch_all' });
    });
  });

  describe('orden de evaluación', () => {
    it('informa del primer motivo que falla (estado antes que exclusión)', () => {
      const flow = buildFlow({ status: 'paused', excludedAccounts: ['@ana_garcia'] });
      const result = evaluateEligibility(flow, buildMessage(), []);
      expect(result).toEqual({ eligible: false, reason: 'paused' });
    });
  });
});

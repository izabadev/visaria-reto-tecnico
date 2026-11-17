import { findMatchingKeyword } from './keyword-matcher.js';
import type { Eligibility, Execution, Flow, IncomingMessage } from './types.js';

// Normaliza una cuenta para compararla: sin espacios, sin @ inicial y en minúsculas.
function normalizeAccount(account: string): string {
  return account.trim().replace(/^@/, '').toLowerCase();
}

// Una entrada de la lista se compara contra el senderId y contra el username.
// Decisión: no exigimos el @ para distinguir usuarios de IDs; excluir de más es el lado seguro.
function isExcluded(flow: Flow, message: IncomingMessage): boolean {
  const senderId = normalizeAccount(message.senderId);
  const username = normalizeAccount(message.username);
  return flow.excludedAccounts
    .map(normalizeAccount)
    .some((account) => account === senderId || account === username);
}

function hasAlreadyExecuted(
  flow: Flow,
  message: IncomingMessage,
  executions: Execution[],
): boolean {
  return executions.some(
    (execution) =>
      execution.flowId === flow.id && execution.senderId === message.senderId,
  );
}

/**
 * Aplica las reglas 1 a 5 en el orden del enunciado y se detiene en la primera que falla,
 * de modo que el trace muestra un único motivo: el primero que dejó fuera al flujo.
 */
export function evaluateEligibility(
  flow: Flow,
  message: IncomingMessage,
  executions: Execution[],
): Eligibility {
  // Regla 1: solo participan los flujos activos.
  if (flow.status !== 'active') {
    return { eligible: false, reason: flow.status };
  }

  // Regla 2: cuentas excluidas.
  if (isExcluded(flow, message)) {
    return { eligible: false, reason: 'excluded_account' };
  }

  // Regla 3: audiencia. Si no sabemos si es seguidor, no se ejecuta.
  if (flow.audience === 'followers_only') {
    if (message.isFollower === null) {
      return { eligible: false, reason: 'follower_status_unknown' };
    }
    if (!message.isFollower) {
      return { eligible: false, reason: 'not_a_follower' };
    }
  }

  // Regla 4: flujos que solo se ejecutan una vez por persona.
  if (flow.repeatPolicy === 'once' && hasAlreadyExecuted(flow, message, executions)) {
    return { eligible: false, reason: 'already_executed' };
  }

  // Regla 5: un flujo sin keywords útiles es comodín; si tiene, alguna debe aparecer.
  const keywords = flow.keywords.filter((keyword) => keyword.trim().length > 0);
  if (keywords.length === 0) {
    return { eligible: true, kind: 'catch_all' };
  }

  const matchedKeyword = findMatchingKeyword(message.text, keywords);
  if (matchedKeyword === undefined) {
    return { eligible: false, reason: 'no_keyword_match' };
  }
  return { eligible: true, kind: 'keyword', matchedKeyword };
}

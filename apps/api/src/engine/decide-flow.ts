import { evaluateEligibility } from './eligibility.js';
import { isMessagingWindowClosed } from './messaging-window.js';
import type {
  Decision,
  Eligibility,
  Execution,
  Flow,
  IncomingMessage,
  TraceEntry,
} from './types.js';

type EligibleResult = Extract<Eligibility, { eligible: true }>;
type Evaluated = { flow: Flow; eligibility: Eligibility };
type Candidate = { flow: Flow; eligibility: EligibleResult };

function isCandidate(evaluated: Evaluated): evaluated is Candidate {
  return evaluated.eligibility.eligible;
}

/**
 * Orden de la carrera (regla 6), en un único sitio para que añadir criterios
 * (por ejemplo, una prioridad manual) solo toque esta función:
 *   1. Un flujo con keyword gana a un comodín.
 *   2. Entre los del mismo tipo, gana el más antiguo (createdAt como instante, no como texto).
 *   3. Si empatan, desempate estable por id.
 */
function compareCandidates(a: Candidate, b: Candidate): number {
  const kindRank = (candidate: Candidate) =>
    candidate.eligibility.kind === 'keyword' ? 0 : 1;
  if (kindRank(a) !== kindRank(b)) return kindRank(a) - kindRank(b);

  const age = Date.parse(a.flow.createdAt) - Date.parse(b.flow.createdAt);
  if (age !== 0) return age;

  return a.flow.id.localeCompare(b.flow.id);
}

function buildTraceEntry(
  { flow, eligibility }: Evaluated,
  winner: Candidate | undefined,
): TraceEntry {
  const base = { flowId: flow.id, flowName: flow.name };

  // Descartado por alguna de las reglas 1 a 5.
  if (!eligibility.eligible) {
    return { ...base, result: 'discarded', reason: eligibility.reason };
  }

  if (winner !== undefined && winner.flow === flow) {
    return eligibility.kind === 'keyword'
      ? {
          ...base,
          result: 'winner',
          reason: 'keyword_match_oldest',
          matchedKeyword: eligibility.matchedKeyword,
        }
      : { ...base, result: 'winner', reason: 'catch_all_oldest' };
  }

  // Era candidato pero perdió el desempate. Si hay candidatos, siempre hay ganador.
  const winnerId = winner!.flow.id;
  const lostToKeyword =
    eligibility.kind === 'catch_all' && winner!.eligibility.kind === 'keyword';
  return {
    ...base,
    result: 'discarded',
    reason: lostToKeyword ? 'catch_all_loses_to_keyword' : 'older_flow_wins',
    lostTo: winnerId,
  };
}

/** Decide qué flujo responde a un mensaje y explica el motivo para cada flujo. */
export function decideFlow(
  flows: Flow[],
  message: IncomingMessage,
  executions: Execution[],
): Decision {
  const evaluated: Evaluated[] = flows.map((flow) => ({
    flow,
    eligibility: evaluateEligibility(flow, message, executions),
  }));

  const [winner] = evaluated.filter(isCandidate).sort(compareCandidates);

  return {
    winner: winner ? { id: winner.flow.id, name: winner.flow.name } : null,
    // La ventana no descarta flujos: el ganador se mantiene y solo se avisa de que
    // no se podría enviar texto libre. Se calcula aunque no haya ganador.
    windowClosed: isMessagingWindowClosed(message),
    trace: evaluated.map((entry) => buildTraceEntry(entry, winner)),
  };
}

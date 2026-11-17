// Modelo de datos del enunciado. El motor solo depende de estos tipos, no de Nest ni de HTTP.

export type FlowStatus = 'active' | 'paused' | 'draft';

export type Flow = {
  id: string;
  name: string;
  status: FlowStatus;
  keywords: string[]; // [] = flujo comodín (catch-all)
  audience: 'all' | 'followers_only';
  excludedAccounts: string[]; // IDs numéricos o @usuarios
  repeatPolicy: 'once' | 'always'; // 'once' = una sola vez por persona
  createdAt: string; // ISO 8601
};

export type IncomingMessage = {
  senderId: string;
  username: string; // sin @
  text: string;
  isFollower: boolean | null; // null = desconocido
  receivedAt: string; // ISO 8601
  lastUserMessageAt?: string; // ISO 8601
};

// Historial de ejecuciones: necesario para la regla repeatPolicy = 'once'.
export type Execution = {
  flowId: string;
  senderId: string;
  executedAt: string; // ISO 8601
};

// Motivos por los que un flujo queda fuera antes de la fase de desempate.
export type IneligibleReason =
  | 'paused'
  | 'draft'
  | 'excluded_account'
  | 'follower_status_unknown'
  | 'not_a_follower'
  | 'already_executed'
  | 'no_keyword_match';

// Resultado de evaluar un flujo contra un mensaje (reglas 1 a 5).
export type Eligibility =
  | { eligible: true; kind: 'keyword'; matchedKeyword: string }
  | { eligible: true; kind: 'catch_all' }
  | { eligible: false; reason: IneligibleReason };

// Contrato con la API (apps/api/src/engine/types.ts).
// Decisión: se duplican los tipos en vez de crear un paquete compartido; con una sola
// pantalla compensa la simplicidad. Con más consumidores, iría a un paquete del monorepo.

export type Flow = {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  keywords: string[];
  audience: 'all' | 'followers_only';
  excludedAccounts: string[];
  repeatPolicy: 'once' | 'always';
  createdAt: string;
};

export type IncomingMessage = {
  senderId: string;
  username: string;
  text: string;
  isFollower: boolean | null;
  receivedAt: string;
  lastUserMessageAt?: string;
};

export type TraceReason =
  | 'paused'
  | 'draft'
  | 'excluded_account'
  | 'follower_status_unknown'
  | 'not_a_follower'
  | 'already_executed'
  | 'no_keyword_match'
  | 'keyword_match_oldest'
  | 'catch_all_oldest'
  | 'catch_all_loses_to_keyword'
  | 'older_flow_wins';

export type TraceEntry = {
  flowId: string;
  flowName: string;
  result: 'winner' | 'discarded';
  reason: TraceReason;
  matchedKeyword?: string;
  lostTo?: string;
};

export type Decision = {
  winner: { id: string; name: string } | null;
  windowClosed: boolean;
  trace: TraceEntry[];
};

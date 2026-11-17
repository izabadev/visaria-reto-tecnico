import type { Execution } from '../engine/types.js';

// Puerto del historial de ejecuciones (necesario para repeatPolicy = 'once').
export abstract class ExecutionRepository {
  abstract findBySender(senderId: string): Promise<Execution[]>;
  abstract add(execution: Execution): Promise<void>;
}

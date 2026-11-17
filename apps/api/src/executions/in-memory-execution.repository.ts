import type { Execution } from '../engine/types.js';
import { ExecutionRepository } from './execution.repository.js';

// El historial vive en memoria: se pierde al reiniciar el servidor (útil para repetir la demo).
export class InMemoryExecutionRepository extends ExecutionRepository {
  private readonly executions: Execution[] = [];

  findBySender(senderId: string): Promise<Execution[]> {
    return Promise.resolve(
      this.executions
        .filter((execution) => execution.senderId === senderId)
        .map((execution) => ({ ...execution })),
    );
  }

  add(execution: Execution): Promise<void> {
    this.executions.push({ ...execution });
    return Promise.resolve();
  }
}

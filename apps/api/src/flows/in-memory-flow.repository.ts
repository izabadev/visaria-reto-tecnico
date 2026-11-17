import type { Flow } from '../engine/types.js';
import { FlowRepository } from './flow.repository.js';

export class InMemoryFlowRepository extends FlowRepository {
  constructor(private readonly flows: Flow[]) {
    super();
  }

  // Devuelve copias para que nadie pueda modificar el estado interno desde fuera.
  findAll(): Promise<Flow[]> {
    return Promise.resolve(structuredClone(this.flows));
  }
}

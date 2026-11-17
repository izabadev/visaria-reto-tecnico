import { Injectable } from '@nestjs/common';
import { decideFlow } from '../engine/decide-flow.js';
import type { Decision, IncomingMessage } from '../engine/types.js';
import { ExecutionRepository } from '../executions/execution.repository.js';
import { FlowRepository } from '../flows/flow.repository.js';

/**
 * Caso de uso "simular un mensaje entrante": une el motor (puro) con la persistencia.
 * El motor decide; este servicio solo carga los datos y registra el efecto.
 */
@Injectable()
export class SimulationService {
  constructor(
    private readonly flows: FlowRepository,
    private readonly executions: ExecutionRepository,
  ) {}

  async simulate(message: IncomingMessage): Promise<Decision> {
    const [flows, executions] = await Promise.all([
      this.flows.findAll(),
      this.executions.findBySender(message.senderId),
    ]);

    const decision = decideFlow(flows, message, executions);

    // Decisión: solo se registra si hay ganador y la ventana está abierta. Con la ventana
    // cerrada no se habría podido enviar nada, así que un flujo 'once' no debe consumirse.
    if (decision.winner !== null && !decision.windowClosed) {
      await this.executions.add({
        flowId: decision.winner.id,
        senderId: message.senderId,
        executedAt: message.receivedAt,
      });
    }

    return decision;
  }
}

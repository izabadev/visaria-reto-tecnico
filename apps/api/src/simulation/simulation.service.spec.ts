import { buildFlow, buildMessage } from '../engine/test-builders.js';
import type { Flow } from '../engine/types.js';
import { InMemoryExecutionRepository } from '../executions/in-memory-execution.repository.js';
import { InMemoryFlowRepository } from '../flows/in-memory-flow.repository.js';
import { SimulationService } from './simulation.service.js';

function setup(flows: Flow[]) {
  const executions = new InMemoryExecutionRepository();
  const service = new SimulationService(new InMemoryFlowRepository(flows), executions);
  return { service, executions };
}

describe('SimulationService', () => {
  it('registra la ejecución del ganador con la fecha de recepción del mensaje', async () => {
    const { service, executions } = setup([buildFlow({ id: 'general' })]);
    const message = buildMessage({ senderId: '1001', receivedAt: '2026-06-01T12:00:00.000Z' });

    await service.simulate(message);

    expect(await executions.findBySender('1001')).toEqual([
      { flowId: 'general', senderId: '1001', executedAt: '2026-06-01T12:00:00.000Z' },
    ]);
  });

  it('un flujo once queda descartado en la segunda simulación del mismo remitente', async () => {
    const { service } = setup([
      buildFlow({ id: 'bienvenida', repeatPolicy: 'once', createdAt: '2025-01-01T00:00:00.000Z' }),
      buildFlow({ id: 'general', createdAt: '2026-01-01T00:00:00.000Z' }),
    ]);
    const message = buildMessage({ senderId: '1001' });

    const first = await service.simulate(message);
    const second = await service.simulate(message);

    expect(first.winner?.id).toBe('bienvenida');
    expect(second.winner?.id).toBe('general');
    expect(second.trace[0]).toMatchObject({ flowId: 'bienvenida', reason: 'already_executed' });
  });

  it('no registra nada si ningún flujo responde', async () => {
    const { service, executions } = setup([buildFlow({ status: 'paused' })]);

    const result = await service.simulate(buildMessage({ senderId: '1001' }));

    expect(result.winner).toBeNull();
    expect(await executions.findBySender('1001')).toEqual([]);
  });

  it('no registra la ejecución si la ventana de 24 h está cerrada (no se pudo enviar)', async () => {
    const { service, executions } = setup([buildFlow({ id: 'general' })]);
    const message = buildMessage({
      senderId: '1001',
      receivedAt: '2026-06-02T12:00:00.000Z',
      lastUserMessageAt: '2026-06-01T11:59:00.000Z',
    });

    const result = await service.simulate(message);

    expect(result.winner?.id).toBe('general');
    expect(result.windowClosed).toBe(true);
    expect(await executions.findBySender('1001')).toEqual([]);
  });
});

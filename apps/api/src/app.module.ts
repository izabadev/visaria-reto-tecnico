import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ExecutionRepository } from './executions/execution.repository.js';
import { InMemoryExecutionRepository } from './executions/in-memory-execution.repository.js';
import { FlowRepository } from './flows/flow.repository.js';
import { FlowsController } from './flows/flows.controller.js';
import { InMemoryFlowRepository } from './flows/in-memory-flow.repository.js';
import { SEED_FLOWS } from './flows/seed-flows.js';
import { SimulationController } from './simulation/simulation.controller.js';
import { SimulationService } from './simulation/simulation.service.js';

@Module({
  controllers: [FlowsController, SimulationController],
  providers: [
    SimulationService,
    // Enlace puerto -> implementación (como bind() en un ServiceProvider de Laravel).
    {
      provide: FlowRepository,
      useFactory: () => new InMemoryFlowRepository(SEED_FLOWS),
    },
    { provide: ExecutionRepository, useClass: InMemoryExecutionRepository },
    // Validación global registrada en el módulo (y no en main.ts) para que los tests e2e la usen.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    },
  ],
})
export class AppModule {}

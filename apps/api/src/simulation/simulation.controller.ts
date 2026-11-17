import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { Decision } from '../engine/types.js';
import { SimulateMessageDto } from './simulate-message.dto.js';
import { SimulationService } from './simulation.service.js';

@Controller('simulate')
export class SimulationController {
  constructor(private readonly simulation: SimulationService) {}

  // 200 y no 201: la respuesta es una decisión, no un recurso nuevo.
  @Post()
  @HttpCode(HttpStatus.OK)
  simulate(@Body() message: SimulateMessageDto): Promise<Decision> {
    return this.simulation.simulate(message);
  }
}

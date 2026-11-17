import { Controller, Get } from '@nestjs/common';
import type { Flow } from '../engine/types.js';
import { FlowRepository } from './flow.repository.js';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flows: FlowRepository) {}

  @Get()
  findAll(): Promise<Flow[]> {
    return this.flows.findAll();
  }
}

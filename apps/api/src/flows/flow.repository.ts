import type { Flow } from '../engine/types.js';

// Puerto de persistencia de flujos. Se usa una clase abstracta (y no una interface) porque
// Nest necesita un valor en tiempo de ejecución como token de inyección.
// Cambiar a PostgreSQL = otra implementación de esta clase, sin tocar servicio ni motor.
export abstract class FlowRepository {
  abstract findAll(): Promise<Flow[]>;
}

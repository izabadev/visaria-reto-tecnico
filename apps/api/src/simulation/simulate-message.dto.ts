import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import type { IncomingMessage } from '../engine/types.js';

// Contrato de entrada de POST /simulate (equivalente a un FormRequest de Laravel).
// Implementa IncomingMessage: si el modelo del motor cambia, el compilador avisa aquí.
export class SimulateMessageDto implements IncomingMessage {
  @IsString()
  @IsNotEmpty()
  senderId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  // Decisión: se permite texto vacío (p. ej. un DM solo con imagen); solo responderían comodines.
  @IsString()
  text!: string;

  // Obligatorio, pero null es un valor válido ("desconocido").
  @ValidateIf((_, value) => value !== null)
  @IsBoolean()
  isFollower!: boolean | null;

  @IsISO8601({ strict: true })
  receivedAt!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  lastUserMessageAt?: string;
}

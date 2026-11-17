import type { Decision, Flow, IncomingMessage } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Error con los mensajes listos para mostrar (los de validación llegan como array en un 400).
export class ApiError extends Error {
  constructor(readonly messages: string[]) {
    super(messages.join('. '));
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    // fetch solo lanza si no hay respuesta: API caída, CORS o sin red.
    throw new ApiError([`No se pudo conectar con la API (${API_URL}). ¿Está arrancada?`]);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = (body as { message?: string | string[] } | null)?.message;
    throw new ApiError(
      Array.isArray(message) ? message : [message ?? `Error ${response.status}`],
    );
  }

  return (await response.json()) as T;
}

export function fetchFlows(): Promise<Flow[]> {
  return request<Flow[]>('/flows');
}

export function simulateMessage(message: IncomingMessage): Promise<Decision> {
  return request<Decision>('/simulate', {
    method: 'POST',
    body: JSON.stringify(message),
  });
}

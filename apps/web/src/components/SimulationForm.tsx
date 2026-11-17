'use client';

import { useState, type FormEvent } from 'react';
import type { IncomingMessage } from '@/lib/types';
import styles from './simulator.module.css';

type Props = {
  isSubmitting: boolean;
  onSubmit: (message: IncomingMessage) => void;
};

type FollowerOption = 'true' | 'false' | 'unknown';

// <input type="datetime-local"> trabaja con hora local sin zona: "2026-06-01T12:30".
// new Date("2026-06-01T12:30") la interpreta como local; toISOString la pasa a UTC.
function toIsoString(localValue: string): string {
  return new Date(localValue).toISOString();
}

const FOLLOWER_VALUES: Record<FollowerOption, boolean | null> = {
  true: true,
  false: false,
  unknown: null,
};

export function SimulationForm({ isSubmitting, onSubmit }: Props) {
  // Estado local del formulario: cada input es "controlado" (value + onChange ≈ v-model).
  const [text, setText] = useState('Hola, ¿qué precio tiene?');
  const [username, setUsername] = useState('ana_garcia');
  const [senderId, setSenderId] = useState('1001');
  const [isFollower, setIsFollower] = useState<FollowerOption>('true');
  // Vacío = "ahora" (se resuelve al enviar). No se inicializa con new Date() porque la
  // página se prerenderiza en el servidor y la hora no coincidiría con la del navegador.
  const [receivedAt, setReceivedAt] = useState('');
  const [lastUserMessageAt, setLastUserMessageAt] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // equivalente a @submit.prevent
    onSubmit({
      senderId: senderId.trim(),
      username: username.trim().replace(/^@/, ''), // el contrato espera el usuario sin @
      text,
      isFollower: FOLLOWER_VALUES[isFollower],
      receivedAt: receivedAt ? toIsoString(receivedAt) : new Date().toISOString(),
      ...(lastUserMessageAt && { lastUserMessageAt: toIsoString(lastUserMessageAt) }),
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.fullWidth}>
        Texto del mensaje
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      </label>

      <label>
        Usuario (sin @)
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>

      <label>
        ID del remitente
        <input value={senderId} onChange={(e) => setSenderId(e.target.value)} required />
      </label>

      <label>
        ¿Es seguidor?
        <select
          value={isFollower}
          onChange={(e) => setIsFollower(e.target.value as FollowerOption)}
        >
          <option value="true">Sí</option>
          <option value="false">No</option>
          <option value="unknown">Desconocido</option>
        </select>
      </label>

      <label>
        Fecha de recepción (vacío = ahora)
        <input
          type="datetime-local"
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
        />
      </label>

      <label>
        Último mensaje del usuario (opcional)
        <input
          type="datetime-local"
          value={lastUserMessageAt}
          onChange={(e) => setLastUserMessageAt(e.target.value)}
        />
      </label>

      <button type="submit" disabled={isSubmitting} className={styles.fullWidth}>
        {isSubmitting ? 'Simulando…' : 'Simular mensaje'}
      </button>
    </form>
  );
}

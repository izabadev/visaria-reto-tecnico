'use client';

import { useEffect, useState } from 'react';
import { ApiError, fetchFlows, simulateMessage } from '@/lib/api';
import type { Decision, Flow, IncomingMessage } from '@/lib/types';
import { FlowList } from './FlowList';
import { SimulationForm } from './SimulationForm';
import { SimulationResult } from './SimulationResult';
import styles from './simulator.module.css';

// Uniones discriminadas: es imposible estar "cargando" y tener datos a la vez.
type FlowsState =
  | { status: 'loading' }
  | { status: 'error'; messages: string[] }
  | { status: 'ready'; flows: Flow[] };

type SimulationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; messages: string[] }
  | { status: 'success'; decision: Decision };

function toMessages(error: unknown): string[] {
  return error instanceof ApiError ? error.messages : ['Error inesperado'];
}

function ErrorBox({ messages }: { messages: string[] }) {
  return (
    <div className={`${styles.callout} ${styles.error}`} role="alert">
      {messages.map((message) => (
        <div key={message}>{message}</div>
      ))}
    </div>
  );
}

// Contenedor: tiene el estado y habla con la API; los hijos solo pintan.
export function Simulator() {
  const [flowsState, setFlowsState] = useState<FlowsState>({ status: 'loading' });
  const [simulation, setSimulation] = useState<SimulationState>({ status: 'idle' });

  // Carga inicial (≈ onMounted). El flag evita actualizar el estado si el componente se desmonta.
  useEffect(() => {
    let cancelled = false;
    fetchFlows()
      .then((flows) => !cancelled && setFlowsState({ status: 'ready', flows }))
      .catch((error: unknown) => {
        if (!cancelled) setFlowsState({ status: 'error', messages: toMessages(error) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSimulate(message: IncomingMessage) {
    setSimulation({ status: 'loading' });
    try {
      const decision = await simulateMessage(message);
      setSimulation({ status: 'success', decision });
    } catch (error) {
      setSimulation({ status: 'error', messages: toMessages(error) });
    }
  }

  return (
    <>
      <section className={styles.section}>
        <h2>Flujos</h2>
        {flowsState.status === 'loading' && <p className={styles.muted}>Cargando flujos…</p>}
        {flowsState.status === 'error' && <ErrorBox messages={flowsState.messages} />}
        {flowsState.status === 'ready' && <FlowList flows={flowsState.flows} />}
      </section>

      <section className={styles.section}>
        <h2>Simular mensaje entrante</h2>
        <SimulationForm
          isSubmitting={simulation.status === 'loading'}
          onSubmit={handleSimulate}
        />
      </section>

      <section className={styles.section} aria-live="polite">
        <h2>Resultado</h2>
        {simulation.status === 'idle' && (
          <p className={styles.muted}>Envía un mensaje para ver qué flujo responde y por qué.</p>
        )}
        {simulation.status === 'loading' && <p className={styles.muted}>Evaluando flujos…</p>}
        {simulation.status === 'error' && <ErrorBox messages={simulation.messages} />}
        {simulation.status === 'success' && <SimulationResult decision={simulation.decision} />}
      </section>
    </>
  );
}

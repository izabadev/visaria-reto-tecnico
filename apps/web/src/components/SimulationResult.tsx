import { REASON_LABELS } from '@/lib/labels';
import type { Decision } from '@/lib/types';
import styles from './simulator.module.css';

type Props = { decision: Decision };

export function SimulationResult({ decision }: Props) {
  const nameById = new Map(decision.trace.map((entry) => [entry.flowId, entry.flowName]));

  return (
    <div className={styles.result}>
      {decision.winner ? (
        <div className={`${styles.callout} ${styles.success}`}>
          Responde <strong>{decision.winner.name}</strong> ({decision.winner.id})
        </div>
      ) : (
        <div className={`${styles.callout} ${styles.empty}`}>
          <strong>Ningún flujo responde a este mensaje.</strong> Revisa el motivo de cada
          flujo en la tabla.
        </div>
      )}

      {decision.windowClosed && (
        <div className={`${styles.callout} ${styles.warning}`}>
          <strong>Ventana de 24 h cerrada:</strong> han pasado más de 24 h desde el último
          mensaje del usuario, así que no se podría enviar texto libre.
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Flujo</th>
            <th>Resultado</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {decision.trace.map((entry) => (
            <tr key={entry.flowId} className={entry.result === 'winner' ? styles.winnerRow : undefined}>
              <td>
                {entry.flowName} <span className={styles.muted}>({entry.flowId})</span>
              </td>
              <td>{entry.result === 'winner' ? '✅ Gana' : 'Descartado'}</td>
              <td>
                {REASON_LABELS[entry.reason]}
                {entry.matchedKeyword && <> · keyword: «{entry.matchedKeyword}»</>}
                {entry.lostTo && <> · pierde contra {nameById.get(entry.lostTo) ?? entry.lostTo}</>}
                <div className={styles.code}>{entry.reason}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

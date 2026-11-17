import { formatAge, STATUS_LABELS } from '@/lib/labels';
import type { Flow } from '@/lib/types';
import styles from './simulator.module.css';

type Props = { flows: Flow[] };

// Presentacional: solo recibe datos por props y los pinta.
export function FlowList({ flows }: Props) {
  if (flows.length === 0) {
    return <p className={styles.muted}>No hay flujos configurados.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Estado</th>
          <th>Keywords</th>
          <th>Audiencia</th>
          <th>Repetición</th>
          <th>Antigüedad</th>
        </tr>
      </thead>
      <tbody>
        {flows.map((flow) => (
          <tr key={flow.id}>
            <td>
              {flow.name} <span className={styles.muted}>({flow.id})</span>
            </td>
            <td>
              <span className={`${styles.badge} ${styles[flow.status]}`}>
                {STATUS_LABELS[flow.status]}
              </span>
            </td>
            <td>{flow.keywords.length > 0 ? flow.keywords.join(', ') : <em>comodín</em>}</td>
            <td>{flow.audience === 'followers_only' ? 'Solo seguidores' : 'Todos'}</td>
            <td>{flow.repeatPolicy === 'once' ? 'Una vez' : 'Siempre'}</td>
            <td title={flow.createdAt}>{formatAge(flow.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

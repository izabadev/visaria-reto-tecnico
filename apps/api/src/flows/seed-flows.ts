import type { Flow } from '../engine/types.js';

// Datos de ejemplo pensados para reproducir desde la UI los casos de la tabla del enunciado.
// Ver seed-flows.spec.ts: cada caso está comprobado contra estos flujos.
export const SEED_FLOWS: Flow[] = [
  {
    id: 'f1',
    name: 'Bienvenida (solo una vez)',
    status: 'active',
    keywords: [], // comodín más antiguo: pierde contra cualquier keyword
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'once',
    createdAt: '2025-01-10T09:00:00.000Z',
  },
  {
    id: 'f2',
    name: 'Respuesta general',
    status: 'active',
    keywords: [], // comodín de respaldo cuando la bienvenida ya se ejecutó
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2025-02-01T09:00:00.000Z',
  },
  {
    id: 'f3',
    name: 'Info precios',
    status: 'active',
    keywords: ['precio', 'precios', 'info'],
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2025-03-01T09:00:00.000Z',
  },
  {
    id: 'f4',
    name: 'Info precios (copia nueva)',
    status: 'active',
    keywords: ['info'], // misma keyword que f3, pero más reciente: pierde
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2025-06-01T09:00:00.000Z',
  },
  {
    id: 'f5',
    name: 'Información detallada',
    status: 'active',
    keywords: ['informacion'], // casa con "Información" (sin tildes ni mayúsculas)
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2025-04-01T09:00:00.000Z',
  },
  {
    id: 'f6',
    name: 'Promo seguidores',
    status: 'active',
    keywords: ['promo'],
    audience: 'followers_only',
    excludedAccounts: ['@Competencia_Oficial', '99999'],
    repeatPolicy: 'always',
    createdAt: '2025-05-01T09:00:00.000Z',
  },
  {
    id: 'f7',
    name: 'Black Friday',
    status: 'paused',
    keywords: ['black friday'],
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2024-11-01T09:00:00.000Z',
  },
  {
    id: 'f8',
    name: 'Campaña verano',
    status: 'draft',
    keywords: ['verano'],
    audience: 'all',
    excludedAccounts: [],
    repeatPolicy: 'always',
    createdAt: '2025-07-01T09:00:00.000Z',
  },
];

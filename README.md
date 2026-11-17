# Visaria · ¿Qué flujo responde a este DM?

Motor de decisión que, ante un DM entrante, elige qué flujo responde **y explica por qué** el resto no lo hace. Incluye una API (`POST /simulate`) y una pantalla para probarlo.

El motor es una función pura (`decideFlow`) sin dependencias de Nest, HTTP ni UI; la API y la pantalla son adaptadores alrededor de ella.

## Arranque rápido

Requisitos: Node 20.9+ (probado con Node 24) y npm.

```bash
npm install
npm run dev      # API en http://localhost:3001 y web en http://localhost:3000
npm test         # tests unitarios (motor, seed, servicio) + e2e de la API
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta API y web a la vez (`concurrently`) |
| `npm test` | Vitest: unitarios y e2e de `apps/api` |
| `npm run build` | Compila API y web |

Variables opcionales: `PORT` (API, por defecto `3001`), `WEB_ORIGIN` (CORS, por defecto `http://localhost:3000`) y `NEXT_PUBLIC_API_URL` (web, por defecto `http://localhost:3001`).

> El historial de ejecuciones vive en memoria: **reiniciar la API lo vacía**, útil para repetir la demo de flujos `once`.

## Estructura

```
apps/
├─ api/                    NestJS 12 + TypeScript
│  ├─ src/engine/          Motor puro: reglas, desempate y trace (+ tests)
│  ├─ src/flows/           Repositorio de flujos, seed y GET /flows
│  ├─ src/executions/      Repositorio del historial de ejecuciones
│  ├─ src/simulation/      Caso de uso, DTO y POST /simulate
│  └─ test/                Tests e2e por HTTP
└─ web/                    Next.js 16 + React 19 (una sola pantalla)
   ├─ src/lib/             Cliente de la API, tipos del contrato y textos
   └─ src/components/      Simulator (contenedor) + componentes presentacionales
```

| Capa | Depende de | Responsabilidad |
|---|---|---|
| `engine/` | nada | Decide el ganador y construye el trace |
| `simulation/` | motor + repositorios | Carga datos, llama al motor y registra la ejecución |
| Controladores | servicio | Validan la entrada y traducen a HTTP |
| Repositorios | — | Puertos (`abstract class`) con implementación en memoria |

## Contrato de la API

### `GET /flows`

Devuelve los flujos del seed (`Flow[]`, con el modelo del enunciado).

### `POST /simulate`

```json
{
  "senderId": "1001",
  "username": "ana_garcia",
  "text": "¿Cuál es el precio?",
  "isFollower": true,
  "receivedAt": "2026-06-01T12:00:00.000Z",
  "lastUserMessageAt": "2026-06-01T10:00:00.000Z"
}
```

Respuesta `200`:

```json
{
  "winner": { "id": "f3", "name": "Info precios" },
  "windowClosed": false,
  "trace": [
    { "flowId": "f1", "flowName": "Bienvenida (solo una vez)", "result": "discarded", "reason": "catch_all_loses_to_keyword", "lostTo": "f3" },
    { "flowId": "f3", "flowName": "Info precios", "result": "winner", "reason": "keyword_match_oldest", "matchedKeyword": "precio" }
  ]
}
```

- `trace` tiene **una entrada por flujo**, en el orden en que se cargan.
- `winner` es `null` si ningún flujo responde.
- Errores de validación: `400` con `{ "message": string[] }`. Campos fuera del contrato también dan `400`.

### Motivos del trace

| `reason` | Regla | Significado |
|---|---|---|
| `paused` / `draft` | 1 | El flujo no está activo |
| `excluded_account` | 2 | El remitente está en `excludedAccounts` |
| `follower_status_unknown` | 3 | `followers_only` e `isFollower` es `null` |
| `not_a_follower` | 3 | `followers_only` e `isFollower` es `false` |
| `already_executed` | 4 | `once` y este remitente ya lo ejecutó |
| `no_keyword_match` | 5 | Tiene keywords y ninguna aparece |
| `keyword_match_oldest` | 6 | Gana: keyword que casa y es el más antiguo |
| `catch_all_oldest` | 6 | Gana: comodín más antiguo sin keywords que casen |
| `catch_all_loses_to_keyword` | 6 | Comodín válido, pero ganó un flujo con keyword (`lostTo`) |
| `older_flow_wins` | 6 | Candidato del mismo tipo, pero otro es más antiguo (`lostTo`) |

Cada flujo muestra **solo el primer motivo** que lo deja fuera, en el orden de las reglas del enunciado.

## Decisiones ante ambigüedades

| Hueco del enunciado | Decisión | Por qué |
|---|---|---|
| ¿Qué es "palabra completa"? | Se trocea por todo lo que no sea letra o número Unicode y se comparan tokens | `\b` de JS solo entiende ASCII y trata `á` como separador |
| Keywords de varias palabras (`"precio final"`) | Deben aparecer como frase consecutiva | Es lo que esperaría quien la escribe |
| Keywords vacías o en blanco | Se ignoran; si todas lo son, el flujo es comodín | Evita que `""` case con todo |
| `excludedAccounts` sin `@` | Cada entrada (sin `@`, en minúsculas) se compara con `senderId` **y** con `username` | Excluir de más es el lado seguro |
| Empate en `createdAt` | Desempate por `id` | Resultado determinista |
| Comparar `createdAt` | Como instante (`Date.parse`), no como texto | `10:00+02:00` es anterior a `09:00Z` |
| ¿Qué es "ahora" para la ventana? | `receivedAt` del mensaje | El motor no depende del reloj y los tests son deterministas |
| 24 h exactas | Ventana **abierta** (`>` estricto) | El enunciado dice "más de 24 h" |
| Sin `lastUserMessageAt` | Ventana abierta | No hay evidencia de que esté cerrada |
| `windowClosed` sin ganador | Se calcula igualmente | Describe al usuario, no al flujo |
| ¿`/simulate` registra la ejecución? | Sí, si hay ganador **y la ventana está abierta** | Con la ventana cerrada no se habría enviado nada: un `once` no debe consumirse |
| `executedAt` | `receivedAt` del mensaje | Determinismo |
| Texto vacío | Permitido (p. ej. DM solo con imagen); solo responden comodines | Es un mensaje real posible |
| `isFollower` ausente | `400`; `null` sí es válido | `null` significa "desconocido", ausente es un error del cliente |
| Código HTTP de `/simulate` | `200`, no `201` | Devuelve una decisión, no crea un recurso |
| Fecha de recepción vacía en la UI | Se usa la hora del envío | Inicializarla con `new Date()` rompe el prerenderizado de Next |

**Trade-off conocido:** al quitar tildes, `ñ` pasa a `n`, así que la keyword `año` casaría con "ano". Es consecuencia directa de "sin distinguir tildes".

## Qué dejé fuera y por qué

| Fuera | Motivo |
|---|---|
| PostgreSQL | El enunciado permite memoria. Los repositorios son puertos: cambiar de persistencia es otra implementación, sin tocar servicio ni motor |
| Extra opcional (LLM o cola) | Prioricé reglas, tests y trace, que es lo que se evalúa primero |
| Tests de frontend | El enunciado prioriza los tests de reglas; la UI se probó manualmente |
| Paquete de tipos compartido | Los tipos del contrato están duplicados en `apps/web/src/lib/types.ts`. Con una sola pantalla compensa la simplicidad |
| CRUD de flujos y endpoint para vaciar el historial | No se piden; reiniciar la API vacía el historial |

## Con una hora más

1. **Idempotencia**: el mensaje no trae id. Usaría el `mid` del webhook de Instagram como clave única para no ejecutar dos veces el mismo mensaje.
2. **Condición de carrera en `once`**: dos peticiones simultáneas del mismo remitente podrían leer el historial antes de que ninguna escriba. En PostgreSQL lo cerraría con una restricción única `(flowId, senderId)` para los flujos `once`.
3. **Tests de la pantalla** con Testing Library: estados de carga, error y "ningún flujo responde".
4. **Validar la respuesta en el frontend** (por ejemplo con zod) en lugar de confiar en el tipo.

## Uso de IA

Usé Claude Code como asistente durante todo el desarrollo:

- **Para qué:** generar el andamiaje del monorepo, proponer la estructura por capas, escribir los tests antes de cada pieza (TDD) y su implementación, y redactar este README.
- **Qué cambié o decidí yo:**
  - Comentarios y descripciones de tests en español.
  - Los tests de la ventana usan **24 h y 1 min** en lugar de 25 h, para probar el borde real.
  - Decidí que `/simulate` registre la ejecución del ganador, y acepté no registrarla con la ventana cerrada.
  - Revisé cada pieza y la probé antes de cada commit.

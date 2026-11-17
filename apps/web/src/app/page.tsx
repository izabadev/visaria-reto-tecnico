import { Simulator } from '@/components/Simulator';

// Server Component: solo pinta la cabecera; la parte interactiva vive en <Simulator /> (cliente).
export default function Home() {
  return (
    <main className="container">
      <h1>Simulador de flujos</h1>
      <p className="subtitle">¿Qué flujo responde a este DM? Y si no responde, ¿por qué?</p>
      <Simulator />
    </main>
  );
}

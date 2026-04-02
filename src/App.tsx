import { useReducer } from 'react';
import { PhaseCard } from './components/PhaseCard';
import { StatusPill } from './components/StatusPill';
import { pricingTable, samplePlayers } from './data/players';
import { initialGameState } from './state/game-initial-state';
import { gameReducer } from './state/game-reducer';

const phases = [
  'Home y reanudacion local',
  'Setup de participantes y presupuesto',
  'Subasta single-screen',
  'Vista de equipos 4-3-3',
  'Pantalla final para debate',
];

export function App() {
  const [state] = useReducer(gameReducer, initialGameState);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#17443b,_#081411_40%,_#040706_75%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label="Build-ready MVP" />
            <StatusPill label="Modo garantizado" tone="gold" />
            <StatusPill label="Vite + React + Tailwind" tone="green" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">
                Subasta Futbolera
              </p>
              <h1 className="max-w-3xl text-4xl font-black uppercase leading-none text-balance sm:text-5xl">
                Base inicial lista para construir el juego de la subasta.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-300">
                El proyecto arranca desde cero con la estructura del PRD, pricing por tiers,
                dataset estatico y estado centralizado. La proxima iteracion ya puede entrar a
                implementar el flujo real de setup y auction.
              </p>
            </div>
            <section className="grid gap-3 rounded-[1.5rem] border border-emerald-400/15 bg-emerald-300/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/75">Snapshot</p>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Phase" value={state.phase} />
                <Metric label="Room code" value={state.roomCode} />
                <Metric label="Players loaded" value={String(samplePlayers.length)} />
                <Metric label="Default budget" value={`${state.settings.initialBudget}M`} />
              </div>
            </section>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Pricing MVP</p>
            <h2 className="mt-3 text-2xl font-bold">Tabla de tiers</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-white/5 text-stone-300">
                  <tr>
                    <th className="px-4 py-3">Linea</th>
                    <th className="px-4 py-3">S</th>
                    <th className="px-4 py-3">A</th>
                    <th className="px-4 py-3">B</th>
                    <th className="px-4 py-3">C</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pricingTable).map(([line, tiers]) => (
                    <tr key={line} className="border-t border-white/10">
                      <td className="px-4 py-3 font-semibold">{line}</td>
                      <td className="px-4 py-3">{tiers.S}M</td>
                      <td className="px-4 py-3">{tiers.A}M</td>
                      <td className="px-4 py-3">{tiers.B}M</td>
                      <td className="px-4 py-3">{tiers.C}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Sample dataset</p>
            <h2 className="mt-3 text-2xl font-bold">Jugadores semilla</h2>
            <div className="mt-5 grid gap-3">
              {samplePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-sm text-stone-400">
                      {player.country} · {player.line} · {player.subPosition}
                    </p>
                  </div>
                  <StatusPill label={`${player.tier} · ${player.basePrice}M`} tone="green" />
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phases.map((phase, index) => (
            <PhaseCard key={phase} step={index + 1} title={phase} />
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

import type { Line } from '../../types/domain';
import type { GameState } from '../../types/state';
import { TeamsBoard } from '../teams/TeamsBoard';

type ResultsScreenProps = {
  state: GameState;
  onReset: () => void;
  onPickTeamSlot: (payload: { participantId: string; line: Line; slot: string }) => void;
};

export function ResultsScreen({ state, onReset, onPickTeamSlot }: ResultsScreenProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Resultados</p>
      <h1 className="mt-4 text-4xl font-black uppercase leading-none">Partida terminada</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
        Todos los participantes completaron su equipo. Ya podes discutir quien armo el mejor once.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.participants.map((participant) => {
          const spent = state.setup.initialBudget - participant.budget;
          return (
            <article key={participant.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-bold text-white">{participant.name}</h2>
              <p className="mt-2 text-sm text-stone-400">Total gastado: {spent}M</p>
              <p className="mt-1 text-sm text-stone-500">Saldo restante: {participant.budget}M</p>
            </article>
          );
        })}
      </div>
      <div className="mt-8">
        <TeamsBoard state={state} onPickSlot={onPickTeamSlot} />
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-8 inline-flex rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
      >
        Volver al inicio
      </button>
    </div>
  );
}

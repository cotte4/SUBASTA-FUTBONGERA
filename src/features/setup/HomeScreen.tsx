import { StatusPill } from '../../components/StatusPill';

type HomeScreenProps = {
  roomCodeInput: string;
  savedRooms: string[];
  errorMessage: string | null;
  playerCount: number;
  onNewGame: () => void;
  onRoomCodeChange: (value: string) => void;
  onResume: () => void;
  onEditRoster: () => void;
};

export function HomeScreen({
  roomCodeInput,
  savedRooms,
  errorMessage,
  playerCount,
  onNewGame,
  onRoomCodeChange,
  onResume,
  onEditRoster,
}: HomeScreenProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill label="Modo garantizado" tone="gold" />
        </div>
        <h1 className="mt-6 text-6xl font-black uppercase leading-[0.85] sm:text-7xl">
          Subasta
          <br />
          <span className="text-emerald-300">Futbolera</span>
        </h1>
        <p className="mt-5 text-base text-stone-400">Pujá, armá tu once, ganá la mesa.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNewGame}
            className="inline-flex rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
          >
            Nueva partida
          </button>
          <button
            type="button"
            onClick={onEditRoster}
            className="inline-flex rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/15"
          >
            Editar plantel
          </button>
          <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {playerCount} jugadores
          </span>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-black uppercase">Retomar</h2>
        <p className="mt-1 text-xs text-stone-500">Solo en este dispositivo.</p>
        <input
          value={roomCodeInput}
          onChange={(event) => onRoomCodeChange(event.target.value)}
          placeholder="AB3K"
          className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-lg font-semibold uppercase tracking-[0.35em] text-white outline-none placeholder:text-stone-500 focus:border-emerald-300/40"
        />
        <button
          type="button"
          onClick={onResume}
          className="mt-4 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/15"
        >
          Retomar partida
        </button>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {savedRooms.length ? (
              savedRooms.map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => onRoomCodeChange(room)}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-200 hover:border-emerald-300/30"
                >
                  {room}
                </button>
              ))
            ) : (
              <p className="text-xs text-stone-600">Sin partidas guardadas.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

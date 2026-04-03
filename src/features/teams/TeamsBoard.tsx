import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LINES, type Line } from '../../types/domain';
import type { GameState } from '../../types/state';

type TeamsBoardProps = {
  state: GameState;
  onPickSlot?: (payload: { participantId: string; line: Line; slot: string }) => void;
};

export function TeamsBoard({ state, onPickSlot }: TeamsBoardProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Equipos en vivo</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {state.participants.map((participant) => (
          <article key={participant.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">{participant.name}</h3>
              <span className="text-sm text-stone-300">{participant.budget}M</span>
            </div>
            <div className="mt-4 grid gap-3">
              {LINES.map((line) => (
                <div key={line}>
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{line}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {participant.team[line].map((slot) => {
                      const player = slot.playerId ? state.players[slot.playerId] : null;
                      const isClickable = Boolean(player && onPickSlot);

                      return (
                        <button
                          key={slot.slot}
                          type="button"
                          disabled={!isClickable}
                          onClick={() =>
                            onPickSlot?.({ participantId: participant.id, line, slot: slot.slot })
                          }
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition enabled:hover:border-emerald-300/40 enabled:hover:bg-emerald-300/10 disabled:cursor-default"
                        >
                          <div className="flex items-center gap-3">
                            {player ? (
                              <PlayerAvatar
                                name={player.name}
                                photo={player.photo}
                                className="h-14 w-14 shrink-0 rounded-2xl"
                              />
                            ) : (
                              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/5" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
                                {slot.slot}
                              </p>
                              <p className="mt-1 truncate text-sm font-semibold text-white">
                                {player ? player.name : 'Vacio'}
                              </p>
                              <p className="mt-1 text-xs text-stone-400">
                                {player ? `${player.country} - ${slot.pricePaid}M` : 'Sin asignar'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

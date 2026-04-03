import { PlayerAvatar } from '../../components/PlayerAvatar';
import { getOpenSlots } from '../../lib/game';
import type { GameState } from '../../types/state';

type AssignmentModalProps = {
  state: GameState;
  onCancel: () => void;
  onConfirm: (slot: string) => void;
};

export function AssignmentModal({ state, onCancel, onConfirm }: AssignmentModalProps) {
  if (!state.pendingAssignment) {
    return null;
  }

  const participant = state.participants.find(
    (entry) => entry.id === state.pendingAssignment?.participantId,
  );
  const player = state.players[state.pendingAssignment.playerId];

  if (!participant || !player) {
    return null;
  }

  const openSlots = getOpenSlots(participant, state.pendingAssignment.line);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#07100d] p-8 shadow-2xl">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <PlayerAvatar
            name={player.name}
            photo={player.photo}
            className="h-[260px] w-full"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Asignar jugador</p>
            <h2 className="mt-3 text-3xl font-black uppercase text-white">{player.name}</h2>
            <p className="mt-2 text-sm text-stone-400">
              {participant.name} gano por {state.pendingAssignment.pricePaid}M. Elegi el slot libre.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {openSlots.map((slot) => (
                <button
                  key={slot.slot}
                  type="button"
                  onClick={() => onConfirm(slot.slot)}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{slot.slot}</p>
                  <p className="mt-2 text-lg font-bold text-white">Asignar aca</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/15"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

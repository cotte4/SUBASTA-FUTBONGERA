import type { Participant, Line } from '../../types/domain';

type ReassignModalProps = {
  participant: Participant;
  line: Line;
  fromSlot: string;
  onClose: () => void;
  onConfirm: (toSlot: string) => void;
};

export function ReassignModal({
  participant,
  line,
  fromSlot,
  onClose,
  onConfirm,
}: ReassignModalProps) {
  const slots = participant.team[line];
  const source = slots.find((slot) => slot.slot === fromSlot);

  if (!source || !source.playerId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#07100d] p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Reasignar slot</p>
        <h2 className="mt-3 text-3xl font-black uppercase text-white">{source.slot}</h2>
        <p className="mt-2 text-sm text-stone-400">
          Elegi a que slot de {line} queres mover este jugador.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <button
              key={slot.slot}
              type="button"
              disabled={slot.slot === fromSlot}
              onClick={() => onConfirm(slot.slot)}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-left transition enabled:hover:border-emerald-300/40 enabled:hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{slot.slot}</p>
              <p className="mt-2 text-lg font-bold text-white">
                {slot.playerId ? 'Intercambiar' : 'Mover aca'}
              </p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/15"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

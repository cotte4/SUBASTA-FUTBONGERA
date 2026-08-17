import { useState } from 'react';
import { TEAM_LOGOS, type Line } from '../../types/domain';
import type { GameState } from '../../types/state';
import { TeamsBoard } from '../teams/TeamsBoard';

type ResultsScreenProps = {
  state: GameState;
  onReset: () => void;
  onPickTeamSlot: (payload: { participantId: string; line: Line; slot: string }) => void;
  onSetIdentity: (payload: { participantId: string; teamName?: string; logo?: string }) => void;
  onSetPodium: (position: number, participantId: string | null) => void;
};

/** Tres trofeos arriba y la berenjena para el que salio ultimo. */
const PODIUM_SLOTS = [
  { icon: '🏆', label: '1°', ring: 'border-amber-300/40 bg-amber-300/10', text: 'text-amber-200' },
  { icon: '🏆', label: '2°', ring: 'border-stone-300/30 bg-stone-300/10', text: 'text-stone-200' },
  { icon: '🏆', label: '3°', ring: 'border-orange-400/30 bg-orange-400/10', text: 'text-orange-200' },
  { icon: '🍆', label: 'Último', ring: 'border-purple-400/30 bg-purple-400/10', text: 'text-purple-200' },
];

export function ResultsScreen({
  state,
  onReset,
  onPickTeamSlot,
  onSetIdentity,
  onSetPodium,
}: ResultsScreenProps) {
  const [logoPickerFor, setLogoPickerFor] = useState<string | null>(null);

  const podium = [0, 1, 2, 3].map((position) => {
    const id = state.podium[position];
    return id ? (state.participants.find((entry) => entry.id === id) ?? null) : null;
  });

  const clubName = (participantId: string) => {
    const participant = state.participants.find((entry) => entry.id === participantId);
    return participant?.teamName?.trim() || participant?.name || '';
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur sm:p-8">
        <h1 className="text-5xl font-black uppercase leading-none">Se acabó</h1>

        {/* Podio */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {podium.map((participant, position) => (
            <div
              key={position}
              className={`rounded-[1.5rem] border p-4 ${PODIUM_SLOTS[position].ring}`}
            >
              <div className="flex items-center gap-2">
                <span className={position === 0 ? 'text-4xl' : 'text-2xl'}>
                  {PODIUM_SLOTS[position].icon}
                </span>
                <span
                  className={`text-xs font-black uppercase tracking-[0.25em] ${PODIUM_SLOTS[position].text}`}
                >
                  {PODIUM_SLOTS[position].label}
                </span>
              </div>
              <select
                value={participant?.id ?? ''}
                onChange={(event) => onSetPodium(position, event.target.value || null)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-lg font-bold text-white outline-none"
              >
                <option value="" className="bg-[#07100d]">
                  —
                </option>
                {state.participants.map((entry) => (
                  <option key={entry.id} value={entry.id} className="bg-[#07100d]">
                    {entry.logo} {clubName(entry.id)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Clubes */}
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.participants.map((participant) => {
            const spent = state.setup.initialBudget - participant.budget;

            return (
              <article
                key={participant.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLogoPickerFor(logoPickerFor === participant.id ? null : participant.id)
                    }
                    title="Cambiar logo"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-3xl transition hover:border-emerald-300/40"
                  >
                    {participant.logo}
                  </button>
                  <div className="min-w-0 flex-1">
                    <input
                      value={participant.teamName}
                      onChange={(event) =>
                        onSetIdentity({
                          participantId: participant.id,
                          teamName: event.target.value,
                        })
                      }
                      placeholder={participant.name}
                      maxLength={24}
                      className="w-full rounded-xl border border-transparent bg-transparent px-1 py-1 text-xl font-black uppercase text-white outline-none placeholder:text-stone-500 hover:border-white/10 focus:border-emerald-300/40"
                    />
                    <p className="mt-1 px-1 text-xs text-stone-500">
                      {participant.name} · gastó {spent}M · queda {participant.budget}M
                    </p>
                  </div>
                </div>

                {logoPickerFor === participant.id ? (
                  <div className="mt-3 grid grid-cols-8 gap-1">
                    {TEAM_LOGOS.map((logo) => (
                      <button
                        key={logo}
                        type="button"
                        onClick={() => {
                          onSetIdentity({ participantId: participant.id, logo });
                          setLogoPickerFor(null);
                        }}
                        className={`rounded-lg p-1 text-2xl transition hover:bg-white/10 ${
                          participant.logo === logo ? 'bg-emerald-300/20' : ''
                        }`}
                      >
                        {logo}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <TeamsBoard state={state} onPickSlot={onPickTeamSlot} />

      <button
        type="button"
        onClick={onReset}
        className="inline-flex self-start rounded-full bg-emerald-300 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
      >
        Nueva partida
      </button>
    </div>
  );
}

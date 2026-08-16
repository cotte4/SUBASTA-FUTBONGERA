import { useMemo, useState } from 'react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { VALID_SUB_POSITIONS } from '../../lib/game';
import {
  createCustomPlayer,
  getDraftError,
  getEffectivePlayers,
  getRemovalBlockReason,
  getRosterHealth,
  isCustomPlayer,
  type PlayerDraft,
  type Roster,
} from '../../lib/roster';
import { LINES, type Line, type Tier } from '../../types/domain';

type RosterModalProps = {
  roster: Roster;
  onChange: (roster: Roster) => void;
  onClose: () => void;
};

const TIERS: Tier[] = ['S', 'A', 'B', 'C'];

const emptyDraft: PlayerDraft = {
  name: '',
  country: '',
  line: 'FWD',
  subPosition: 'ST',
  tier: 'A',
  photo: '',
};

export function RosterModal({ roster, onChange, onClose }: RosterModalProps) {
  const [draft, setDraft] = useState<PlayerDraft>(emptyDraft);
  const [lineFilter, setLineFilter] = useState<Line>('FWD');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // El plantel efectivo se DERIVA del roster, no se guarda aparte: asi no hay
  // forma de que la lista y lo que se juega queden desincronizados.
  const players = useMemo(() => getEffectivePlayers(roster), [roster]);
  const health = useMemo(() => getRosterHealth(players), [players]);

  const visible = players
    .filter((player) => player.line === lineFilter)
    .filter((player) => player.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.subPosition.localeCompare(b.subPosition) || a.name.localeCompare(b.name));

  function handleAdd() {
    const problem = getDraftError(draft);
    if (problem) {
      setError(problem);
      return;
    }

    const player = createCustomPlayer(draft, players);
    onChange({ ...roster, customPlayers: [...roster.customPlayers, player] });
    setDraft({ ...emptyDraft, line: draft.line, subPosition: draft.subPosition, tier: draft.tier });
    setLineFilter(draft.line);
    setError(null);
  }

  function handleRemove(playerId: string) {
    const blocked = getRemovalBlockReason(players, playerId);
    if (blocked) {
      setError(blocked);
      return;
    }

    const player = players.find((entry) => entry.id === playerId);
    setError(null);

    // Un jugador agregado se borra de verdad; uno del dataset base solo se
    // oculta, porque el dataset no se toca.
    onChange(
      player && isCustomPlayer(player)
        ? { ...roster, customPlayers: roster.customPlayers.filter((entry) => entry.id !== playerId) }
        : { ...roster, excludedIds: [...roster.excludedIds, playerId] },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-8">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/10 bg-[#07100d] p-6 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Plantel</p>
            <h2 className="mt-2 text-3xl font-black uppercase text-white">Editar jugadores</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-400">
              {players.length} jugadores disponibles. Los cambios se guardan solo en este
              dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
          >
            Listo
          </button>
        </div>

        {health.broken.length ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            Faltan jugadores en {health.broken.map((entry) => entry.label).join(', ')}. Con 6
            participantes la partida podria no completarse.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        ) : null}

        <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Agregar jugador</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Nombre">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Lionel Messi"
                className={inputClass}
              />
            </Field>
            <Field label="Pais">
              <input
                value={draft.country}
                onChange={(event) => setDraft({ ...draft, country: event.target.value })}
                placeholder="Argentina"
                className={inputClass}
              />
            </Field>
            <Field label="Linea">
              <select
                value={draft.line}
                onChange={(event) => {
                  const line = event.target.value as Line;
                  setDraft({ ...draft, line, subPosition: VALID_SUB_POSITIONS[line][0] });
                }}
                className={inputClass}
              >
                {LINES.map((line) => (
                  <option key={line} value={line} className="bg-[#07100d]">
                    {line}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Posicion">
              <select
                value={draft.subPosition}
                onChange={(event) => setDraft({ ...draft, subPosition: event.target.value })}
                className={inputClass}
              >
                {VALID_SUB_POSITIONS[draft.line].map((sub) => (
                  <option key={sub} value={sub} className="bg-[#07100d]">
                    {sub}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tier (define el precio)">
              <select
                value={draft.tier}
                onChange={(event) => setDraft({ ...draft, tier: event.target.value as Tier })}
                className={inputClass}
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier} className="bg-[#07100d]">
                    {tier}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Foto (URL, opcional)">
              <input
                value={draft.photo}
                onChange={(event) => setDraft({ ...draft, photo: event.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-300/20"
          >
            + Agregar
          </button>
          <p className="mt-3 text-xs text-stone-500">
            Sin foto se muestran las iniciales. El precio sale del tier, no se escribe a mano.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {LINES.map((line) => (
            <button
              key={line}
              type="button"
              onClick={() => setLineFilter(line)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                lineFilter === line
                  ? 'border-emerald-300/40 bg-emerald-300/20 text-emerald-100'
                  : 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              {line}
            </button>
          ))}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre"
            className="ml-auto min-w-[200px] flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-emerald-300/40"
          />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {health.quotas
            .filter((entry) => entry.line === lineFilter)
            .map((entry) => (
              <p
                key={entry.label}
                className={`rounded-2xl border px-4 py-2 text-xs ${
                  entry.ok
                    ? 'border-white/10 bg-white/5 text-stone-400'
                    : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
                }`}
              >
                {entry.label}: {entry.have} disponibles, {entry.need} necesarios
                {entry.ok && entry.have - entry.need <= 1 ? ' (al limite)' : ''}
              </p>
            ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((player) => {
            const blocked = getRemovalBlockReason(players, player.id);

            return (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-3"
              >
                <PlayerAvatar name={player.name} photo={player.photo} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{player.name}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {player.subPosition} - {player.tier} - {player.basePrice}M
                  </p>
                  {isCustomPlayer(player) ? (
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-emerald-300/70">
                      Agregado
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(player.id)}
                  title={blocked ?? 'Sacar del plantel'}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition ${
                    blocked
                      ? 'cursor-not-allowed border-white/5 bg-white/5 text-stone-600'
                      : 'border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20'
                  }`}
                >
                  X
                </button>
              </div>
            );
          })}
          {!visible.length ? (
            <p className="text-sm text-stone-500">No hay jugadores que coincidan.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      {children}
    </label>
  );
}

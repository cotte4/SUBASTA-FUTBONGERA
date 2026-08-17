import { useMemo, useRef, useState } from 'react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { VALID_SUB_POSITIONS } from '../../lib/game';
import { ACCEPTED_IMAGE_TYPES, fileToAvatarDataUrl, formatBytes } from '../../lib/image';
import {
  createCustomPlayer,
  exportRoster,
  getDraftError,
  importRoster,
  getEffectivePlayers,
  getRemovalBlockReason,
  getRosterEntries,
  getRosterHealth,
  hideMany,
  removeCustomPlayer,
  restoreAllHidden,
  togglePlayerHidden,
  type PlayerDraft,
  type Roster,
} from '../../lib/roster';
import { LINES, type Line, type Tier } from '../../types/domain';

type RosterModalProps = {
  roster: Roster;
  /** Devuelve un mensaje de error si el navegador no pudo guardar el cambio. */
  onChange: (roster: Roster) => string | null;
  onClose: () => void;
};

type LineFilter = Line | 'TODAS';

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
  const [showForm, setShowForm] = useState(false);
  const [lineFilter, setLineFilter] = useState<LineFilter>('TODAS');
  const [countryFilter, setCountryFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [photoBytes, setPhotoBytes] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  /** Aplica un cambio y muestra el motivo si el navegador no pudo guardarlo. */
  function applyChange(next: Roster) {
    const error = onChange(next);
    setMessage(error);
    return !error;
  }

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setUploading(true);
    const result = await fileToAvatarDataUrl(file);
    setUploading(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setDraft((current) => ({ ...current, photo: result.dataUrl }));
    setPhotoBytes(result.bytes);
    setMessage(null);
  }

  /** Baja el plantel como archivo: respaldo y forma de pasarlo a otro equipo. */
  function handleExport() {
    const blob = new Blob([exportRoster(roster)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantel-subasta-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Plantel descargado. Guardalo: te sirve de respaldo y para pasarlo a otro dispositivo.');
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    const imported = importRoster(await file.text());
    if (!imported) {
      setMessage('Ese archivo no es un plantel válido.');
      return;
    }

    if (applyChange(imported)) {
      setMessage(
        `Plantel restaurado: ${imported.customPlayers.length} agregados y ${imported.excludedIds.length} escondidos.`,
      );
    }
  }

  function clearPhoto() {
    setDraft((current) => ({ ...current, photo: '' }));
    setPhotoBytes(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Todo se DERIVA del roster guardado: no hay una segunda lista que mantener.
  const entries = useMemo(() => getRosterEntries(roster), [roster]);
  const players = useMemo(() => getEffectivePlayers(roster), [roster]);
  const health = useMemo(() => getRosterHealth(players), [players]);

  const countries = useMemo(
    () => [...new Set(entries.map((entry) => entry.player.country))].sort(),
    [entries],
  );

  const hiddenCount = entries.filter((entry) => entry.hidden).length;

  const visible = entries
    .filter((entry) => lineFilter === 'TODAS' || entry.player.line === lineFilter)
    .filter((entry) => countryFilter === 'TODOS' || entry.player.country === countryFilter)
    .filter((entry) => entry.player.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort(
      (a, b) =>
        Number(a.hidden) - Number(b.hidden) ||
        LINES.indexOf(a.player.line) - LINES.indexOf(b.player.line) ||
        a.player.subPosition.localeCompare(b.player.subPosition) ||
        a.player.name.localeCompare(b.player.name),
    );

  const visibleActivos = visible.filter((entry) => !entry.hidden);

  function handleToggle(playerId: string, hidden: boolean, custom: boolean) {
    if (custom) {
      applyChange(removeCustomPlayer(roster, playerId));
      return;
    }

    if (!hidden) {
      const blocked = getRemovalBlockReason(players, playerId);
      if (blocked) {
        setMessage(blocked);
        return;
      }
    }

    applyChange(togglePlayerHidden(roster, playerId));
  }

  function handleHideAllVisible() {
    const { roster: next, blocked } = hideMany(
      roster,
      visibleActivos.filter((entry) => !entry.custom).map((entry) => entry.player.id),
    );

    if (applyChange(next) && blocked.length) {
      setMessage(
        `Escondí los que pude. Quedaron ${blocked.length} porque sin ellos no alcanzarían los cupos.`,
      );
    }
  }

  function handleAdd() {
    const problem = getDraftError(draft);
    if (problem) {
      setMessage(problem);
      return;
    }

    const saved = applyChange({
      ...roster,
      customPlayers: [...roster.customPlayers, createCustomPlayer(draft, players)],
    });
    if (!saved) {
      return;
    }

    setDraft({ ...emptyDraft, line: draft.line, subPosition: draft.subPosition, tier: draft.tier });
    clearPhoto();
    setLineFilter(draft.line);
    setCountryFilter('TODOS');
    setSearch('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-6">
      <div className="w-full max-w-6xl rounded-[2rem] border border-white/10 bg-[#07100d] p-5 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Plantel</p>
            <h2 className="mt-2 text-3xl font-black uppercase text-white">Editar jugadores</h2>
            <p className="mt-2 text-sm text-stone-400">
              <span className="font-bold text-emerald-300">{players.length} juegan</span>
              {hiddenCount ? ` · ${hiddenCount} escondidos` : ''} · tocá una tarjeta para sacarla o
              devolverla
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
          >
            Listo
          </button>
        </div>

        {health.broken.length ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            Faltan jugadores en {health.broken.map((entry) => entry.label).join(', ')}.
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            {message}
          </p>
        ) : null}

        {/* Filtros */}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-2">
            {(['TODAS', ...LINES] as LineFilter[]).map((line) => (
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
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-200 outline-none"
            >
              <option value="TODOS" className="bg-[#07100d]">
                Todos los paises
              </option>
              {countries.map((country) => (
                <option key={country} value={country} className="bg-[#07100d]">
                  {country}
                </option>
              ))}
            </select>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre"
            className="min-w-[220px] rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-emerald-300/40"
          />
        </div>

        {/* Acciones en lote */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-stone-500">
            Mostrando {visible.length} de {entries.length}
          </span>
          {visibleActivos.length && (lineFilter !== 'TODAS' || countryFilter !== 'TODOS' || search.trim()) ? (
            <button
              type="button"
              onClick={handleHideAllVisible}
              className="rounded-full border border-rose-300/20 bg-rose-300/10 px-4 py-2 font-bold uppercase tracking-[0.2em] text-rose-100 transition hover:bg-rose-300/20"
            >
              Esconder estos {visibleActivos.length}
            </button>
          ) : null}
          {hiddenCount ? (
            <button
              type="button"
              onClick={() => applyChange(restoreAllHidden(roster))}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 font-bold uppercase tracking-[0.2em] text-emerald-100 transition hover:bg-emerald-300/20"
            >
              Devolver los {hiddenCount} escondidos
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleExport}
            title="Bajar el plantel como archivo"
            className="ml-auto rounded-full border border-white/15 bg-white/10 px-4 py-2 font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
          >
            Respaldar
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            title="Restaurar desde un archivo"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
          >
            Restaurar
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-4 py-2 font-bold uppercase tracking-[0.2em] text-emerald-100 transition hover:bg-emerald-300/25"
          >
            {showForm ? 'Cerrar' : '+ Agregar jugador'}
          </button>
        </div>

        {/* Alta */}
        {showForm ? (
          <section className="mt-4 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/5 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
              <PlayerAvatar
                name={draft.name || '?'}
                photo={draft.photo}
                className="h-24 w-24 shrink-0"
              />
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-stone-400">Foto</span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition enabled:hover:bg-white/15 disabled:opacity-50"
                  >
                    {uploading ? 'Procesando...' : 'Subir del dispositivo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES}
                    onChange={(event) => void handleFile(event.target.files?.[0])}
                    className="hidden"
                  />
                  {draft.photo ? (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="rounded-full border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-100 transition hover:bg-rose-300/20"
                    >
                      Quitar
                    </button>
                  ) : null}
                  {photoBytes ? (
                    <span className="text-xs text-stone-500">
                      {formatBytes(photoBytes)} despues de comprimir
                    </span>
                  ) : null}
                </div>
                <input
                  value={draft.photo.startsWith('data:') ? '' : draft.photo}
                  onChange={(event) => {
                    setDraft({ ...draft, photo: event.target.value });
                    setPhotoBytes(null);
                  }}
                  placeholder="...o pegá una URL: https://..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-emerald-300/40"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 inline-flex rounded-full bg-emerald-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
            >
              Agregar al plantel
            </button>
            <p className="mt-3 text-xs text-stone-500">
              Las fotos subidas se achican a 320px y se guardan en este navegador. Sin foto se
              muestran las iniciales. El precio sale del tier.
            </p>
          </section>
        ) : null}

        {/* Cupos de la linea filtrada */}
        {lineFilter !== 'TODAS' ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {health.quotas
              .filter((entry) => entry.line === lineFilter)
              .map((entry) => (
                <span
                  key={entry.label}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    entry.ok
                      ? 'border-white/10 bg-white/5 text-stone-400'
                      : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
                  }`}
                >
                  {entry.label}: {entry.have}/{entry.need}
                  {entry.ok && entry.have - entry.need <= 1 ? ' (al limite)' : ''}
                </span>
              ))}
          </div>
        ) : null}

        {/* Jugadores */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ player, hidden, custom }) => {
            const blocked = !hidden && !custom ? getRemovalBlockReason(players, player.id) : null;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => handleToggle(player.id, hidden, custom)}
                title={
                  blocked ??
                  (custom ? 'Borrar' : hidden ? 'Devolver al plantel' : 'Sacar del plantel')
                }
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  hidden
                    ? 'border-white/5 bg-white/[0.02] opacity-45 hover:opacity-80'
                    : blocked
                      ? 'border-white/10 bg-white/5 cursor-not-allowed'
                      : 'border-white/10 bg-white/5 hover:border-rose-300/30 hover:bg-rose-300/5'
                }`}
              >
                <PlayerAvatar name={player.name} photo={player.photo} className="h-12 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{player.name}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-400">
                    {player.line} {player.subPosition} · {player.tier} · {player.basePrice}M
                  </p>
                  <p className="mt-0.5 truncate text-[0.65rem] text-stone-500">{player.country}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] ${
                    hidden
                      ? 'bg-emerald-300/15 text-emerald-200'
                      : custom
                        ? 'bg-emerald-300/15 text-emerald-200'
                        : blocked
                          ? 'bg-white/5 text-stone-600'
                          : 'bg-rose-300/10 text-rose-200'
                  }`}
                >
                  {hidden ? 'Devolver' : custom ? 'Agregado' : blocked ? 'Fijo' : 'Sacar'}
                </span>
              </button>
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

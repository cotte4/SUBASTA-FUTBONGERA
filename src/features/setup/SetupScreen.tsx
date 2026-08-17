import { useState, type ReactNode } from 'react';
import { MAX_POOL_MARGIN, MAX_SKIPS_PER_ROUND, MIN_POOL_MARGIN } from '../../lib/game';
import type { SetupDraft } from '../../types/state';

type SetupScreenProps = {
  setup: SetupDraft;
  /** Motivo por el que el plantel guardado no alcanza para jugar, si lo hay. */
  rosterProblem: string | null;
  /** Aviso que no impide jugar (poco margen para skipear). */
  rosterWarning: string | null;
  onBack: () => void;
  onStart: () => void;
  onUpdate: (value: Partial<SetupDraft>) => void;
  onNameChange: (index: number, value: string) => void;
};

export function SetupScreen({
  setup,
  rosterProblem,
  rosterWarning,
  onBack,
  onStart,
  onUpdate,
  onNameChange,
}: SetupScreenProps) {
  const visibleNames = setup.names.slice(0, setup.participantCount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-4xl font-black uppercase leading-none">Armá la mesa</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Participantes">
            <select
              value={setup.participantCount}
              onChange={(event) => onUpdate({ participantCount: Number(event.target.value) })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none"
            >
              {[4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Presupuesto">
            <NumberField
              value={setup.initialBudget}
              min={54}
              onCommit={(initialBudget) => onUpdate({ initialBudget })}
            />
          </Field>
          <Field label="Incremento">
            <NumberField
              value={setup.bidIncrement}
              min={1}
              onCommit={(bidIncrement) => onUpdate({ bidIncrement })}
            />
          </Field>
          <Field label="Skips por ronda">
            <div className="flex gap-2">
              <NumberField
                value={setup.skipsPerRound}
                min={0}
                max={MAX_SKIPS_PER_ROUND}
                placeholder="∞"
                disabled={setup.skipsPerRound === null}
                onCommit={(skipsPerRound) => onUpdate({ skipsPerRound })}
              />
              <button
                type="button"
                onClick={() => onUpdate({ skipsPerRound: setup.skipsPerRound === null ? 2 : null })}
                title={setup.skipsPerRound === null ? 'Poner un tope' : 'Skips ilimitados'}
                className={`shrink-0 rounded-2xl border px-4 text-sm font-black transition ${
                  setup.skipsPerRound === null
                    ? 'border-emerald-300/40 bg-emerald-300/20 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-stone-400 hover:bg-white/10'
                }`}
              >
                ∞
              </button>
            </div>
          </Field>
          <Field label="Jugadores de sobra">
            <NumberField
              value={setup.poolMargin}
              min={MIN_POOL_MARGIN}
              max={MAX_POOL_MARGIN}
              onCommit={(poolMargin) => onUpdate({ poolMargin })}
            />
          </Field>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {visibleNames.map((name, index) => (
            <Field key={index} label={`Nombre ${index + 1}`}>
              <input
                value={name}
                onChange={(event) => onNameChange(index, event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none placeholder:text-stone-500"
              />
            </Field>
          ))}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Resumen</p>
        <div className="mt-5 space-y-3">
          <SummaryLine label="Participantes" value={String(setup.participantCount)} />
          <SummaryLine label="Presupuesto inicial" value={`${setup.initialBudget}M`} />
          <SummaryLine label="Incremento" value={`+${setup.bidIncrement}M`} />
          <SummaryLine
            label="Skips por ronda"
            value={setup.skipsPerRound === null ? 'Sin tope' : String(setup.skipsPerRound)}
          />
          <SummaryLine
            label="Pool por rol"
            value={`${setup.participantCount} + ${setup.poolMargin}`}
          />
          <SummaryLine label="Objetivo" value="4-3-3" />
        </div>
        <p className="mt-4 text-xs text-stone-500">Mínimo 54M: es el piso para llenar el 4-3-3.</p>
        {rosterProblem ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {rosterProblem}
          </p>
        ) : null}
        {rosterWarning ? (
          <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            {rosterWarning}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={!!rosterProblem}
            className="inline-flex justify-center rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition enabled:hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comenzar subasta
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/15"
          >
            Volver
          </button>
        </div>
      </aside>
    </div>
  );
}

/**
 * Input numerico que se deja escribir.
 *
 * El estado del juego sanea los valores en cada cambio (presupuesto minimo 54,
 * etc.). Si el input mostrara ese valor saneado mientras se tipea, borrar el
 * campo lo devolveria al default y escribir "5" camino a "500" lo corregiria a
 * "54", pegandole el siguiente digito: 540. Por eso, mientras el campo esta en
 * foco manda lo que el usuario escribio; al salir se muestra ya el valor
 * saneado.
 */
function NumberField({
  value,
  min,
  max,
  placeholder,
  disabled,
  onCommit,
}: {
  value: number | null;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  onCommit: (value: number) => void;
}) {
  const [buffer, setBuffer] = useState<string | null>(null);

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={1}
      disabled={disabled}
      placeholder={placeholder}
      value={buffer ?? (value ?? '')}
      onFocus={() => setBuffer(value === null ? '' : String(value))}
      onChange={(event) => {
        const raw = event.target.value;
        setBuffer(raw);

        // Vacio o intermedio: no se toca el estado hasta que haya un numero.
        if (raw.trim() === '') {
          return;
        }

        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          onCommit(parsed);
        }
      }}
      onBlur={() => {
        if (buffer !== null && buffer.trim() === '') {
          onCommit(min ?? 0);
        }
        setBuffer(null);
      }}
      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none disabled:opacity-40"
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-stone-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

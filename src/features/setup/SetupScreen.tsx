import type { ReactNode } from 'react';
import { MAX_SKIP_LIMIT } from '../../lib/game';
import type { SetupDraft } from '../../types/state';

type SetupScreenProps = {
  setup: SetupDraft;
  /** Motivo por el que el plantel guardado no alcanza para jugar, si lo hay. */
  rosterProblem: string | null;
  onBack: () => void;
  onStart: () => void;
  onUpdate: (value: Partial<SetupDraft>) => void;
  onNameChange: (index: number, value: string) => void;
};

export function SetupScreen({
  setup,
  rosterProblem,
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
            <input
              type="number"
              min={54}
              step={1}
              value={setup.initialBudget}
              onChange={(event) => onUpdate({ initialBudget: Number(event.target.value) })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none"
            />
          </Field>
          <Field label="Incremento">
            <input
              type="number"
              min={1}
              step={1}
              value={setup.bidIncrement}
              onChange={(event) => onUpdate({ bidIncrement: Number(event.target.value) })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none"
            />
          </Field>
          <Field label="Skips">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={MAX_SKIP_LIMIT}
                step={1}
                disabled={setup.skipLimit === null}
                value={setup.skipLimit ?? ''}
                placeholder="∞"
                onChange={(event) => onUpdate({ skipLimit: Number(event.target.value) })}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none disabled:opacity-40"
              />
              <button
                type="button"
                onClick={() => onUpdate({ skipLimit: setup.skipLimit === null ? 5 : null })}
                title={setup.skipLimit === null ? 'Poner un tope' : 'Skips ilimitados'}
                className={`shrink-0 rounded-2xl border px-4 text-sm font-black transition ${
                  setup.skipLimit === null
                    ? 'border-emerald-300/40 bg-emerald-300/20 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-stone-400 hover:bg-white/10'
                }`}
              >
                ∞
              </button>
            </div>
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
            label="Skips"
            value={setup.skipLimit === null ? 'Sin tope' : String(setup.skipLimit)}
          />
          <SummaryLine label="Objetivo" value="4-3-3" />
        </div>
        <p className="mt-4 text-xs text-stone-500">Mínimo 54M: es el piso para llenar el 4-3-3.</p>
        {rosterProblem ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {rosterProblem}
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

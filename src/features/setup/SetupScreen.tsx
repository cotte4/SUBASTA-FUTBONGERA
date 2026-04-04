import type { ReactNode } from 'react';
import type { SetupDraft } from '../../types/state';

type SetupScreenProps = {
  setup: SetupDraft;
  onBack: () => void;
  onStart: () => void;
  onUpdate: (value: Partial<SetupDraft>) => void;
  onNameChange: (index: number, value: string) => void;
};

export function SetupScreen({
  setup,
  onBack,
  onStart,
  onUpdate,
  onNameChange,
}: SetupScreenProps) {
  const visibleNames = setup.names.slice(0, setup.participantCount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Setup</p>
        <h1 className="mt-4 text-4xl font-black uppercase leading-none text-balance">
          Configura la mesa antes de abrir la puja.
        </h1>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
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
          <SummaryLine label="Objetivo" value="4-3-3 completo" />
        </div>
        <p className="mt-4 text-sm text-stone-400">
          El minimo de presupuesto es 54M porque es el piso necesario para completar un 4-3-3 en modo garantizado.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex justify-center rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-200"
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

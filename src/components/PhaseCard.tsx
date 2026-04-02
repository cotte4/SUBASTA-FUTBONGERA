type PhaseCardProps = {
  step: number;
  title: string;
};

export function PhaseCard({ step, title }: PhaseCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Paso {step}</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
    </article>
  );
}

import { clsx } from 'clsx';

type StatusPillProps = {
  label: string;
  tone?: 'green' | 'gold' | 'neutral';
};

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        tone === 'green' && 'border-emerald-300/30 bg-emerald-300/15 text-emerald-100',
        tone === 'gold' && 'border-amber-300/30 bg-amber-300/15 text-amber-100',
        tone === 'neutral' && 'border-white/15 bg-white/10 text-stone-200',
      )}
    >
      {label}
    </span>
  );
}

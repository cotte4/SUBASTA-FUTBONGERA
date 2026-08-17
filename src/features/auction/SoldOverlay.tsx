import { useEffect } from 'react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import type { Player } from '../../types/domain';

export const SOLD_OVERLAY_MS = 3000;

export type SoldFlash = {
  player: Player;
  buyerName: string;
  price: number;
  slot: string;
};

type SoldOverlayProps = {
  flash: SoldFlash | null;
  onDone: () => void;
};

/**
 * Golpe de martillo: muestra al jugador vendido durante 3 segundos.
 * Se cierra sola, o antes si tocan la pantalla.
 */
export function SoldOverlay({ flash, onDone }: SoldOverlayProps) {
  useEffect(() => {
    if (!flash) {
      return;
    }

    const timer = window.setTimeout(onDone, SOLD_OVERLAY_MS);
    return () => window.clearTimeout(timer);
  }, [flash, onDone]);

  if (!flash) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="sold-animated fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-black/85 px-4 backdrop-blur-sm [animation:sold-backdrop_180ms_ease-out]"
    >
      <div className="w-full max-w-md [animation:sold-card_520ms_cubic-bezier(0.22,1,0.36,1)]">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/30 bg-[#07100d] [animation:sold-glow_1.6s_ease-in-out_infinite]">
          <PlayerAvatar
            name={flash.player.name}
            photo={flash.player.photo}
            className="h-[380px] w-full"
          />

          {/* destello */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent [animation:sold-shine_900ms_420ms_ease-out_both]" />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07100d] via-[#07100d]/20 to-transparent" />

          <div className="absolute right-4 top-4 [animation:sold-stamp_460ms_120ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <span className="inline-block rounded-2xl border-4 border-emerald-300 bg-emerald-300/15 px-4 py-2 text-2xl font-black uppercase tracking-[0.2em] text-emerald-200">
              Vendido
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-4xl font-black uppercase leading-none text-white [animation:sold-rise_420ms_260ms_ease-out_both]">
              {flash.player.name}
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3 [animation:sold-rise_420ms_360ms_ease-out_both]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                  {flash.player.line} · {flash.slot}
                </p>
                <p className="mt-1 text-xl font-bold text-white">{flash.buyerName}</p>
              </div>
              <p className="text-5xl font-black leading-none text-emerald-300">{flash.price}M</p>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full origin-left bg-emerald-300"
            style={{ animation: `sold-timer ${SOLD_OVERLAY_MS}ms linear both` }}
          />
        </div>
      </div>
    </div>
  );
}

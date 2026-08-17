import { useState } from 'react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import {
  canParticipantBid,
  canSkipCurrentPlayer,
  getBidBlockReason,
  getCurrentPlayer,
  getLineProgress,
  getNextBidAmount,
  getSkipBlockReason,
  getSkipsLeft,
} from '../../lib/game';
import type { Line } from '../../types/domain';
import type { GameState } from '../../types/state';
import { AssignmentModal } from './AssignmentModal';
import { TeamsBoard } from '../teams/TeamsBoard';

type AuctionScreenProps = {
  state: GameState;
  onPlaceBid: (participantId: string, amount?: number) => void;
  onSkip: () => void;
  onSell: () => void;
  onUndo: () => void;
  onReset: () => void;
  onCancelAssignment: () => void;
  onConfirmAssignment: (slot: string) => void;
  onPickTeamSlot: (payload: { participantId: string; line: Line; slot: string }) => void;
};

export function AuctionScreen({
  state,
  onPlaceBid,
  onSkip,
  onSell,
  onUndo,
  onReset,
  onCancelAssignment,
  onConfirmAssignment,
  onPickTeamSlot,
}: AuctionScreenProps) {
  const [fixedBidInput, setFixedBidInput] = useState('');
  const currentPlayer = getCurrentPlayer(state);
  const canSkip = canSkipCurrentPlayer(state);
  const skipReason = getSkipBlockReason(state);
  const skipsLeft = getSkipsLeft(state);
  const leader = state.participants.find((participant) => participant.id === state.auction?.currentLeaderId);
  const progress = state.auction ? getLineProgress(state, state.auction.currentLine) : null;
  const minimumBid = getNextBidAmount(state);
  const fixedBidAmount =
    fixedBidInput.trim() === '' || Number.isNaN(Number(fixedBidInput)) ? null : Math.floor(Number(fixedBidInput));
  const hasManualBid = fixedBidAmount !== null && fixedBidAmount !== minimumBid;

  if (!state.auction || !currentPlayer) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-black/30 p-8">
        <p className="text-sm text-stone-300">No hay jugador activo. La partida ya puede cerrarse.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <PlayerAvatar
                name={currentPlayer.name}
                photo={currentPlayer.photo}
                className="h-[340px] w-full"
              />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Auction</p>
                    <h1 className="mt-3 text-4xl font-black uppercase leading-none">{currentPlayer.name}</h1>
                    <p className="mt-3 text-sm text-stone-400">
                      {currentPlayer.country} - {currentPlayer.line} - {currentPlayer.subPosition}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                      Base {currentPlayer.basePrice}M
                      {state.auction.currentBid < currentPlayer.basePrice
                        ? ` - apertura garantizada ${state.auction.currentBid}M`
                        : ''}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/75">
                      {leader ? 'Puja' : 'Apertura'}
                    </p>
                    <p className="mt-1 text-4xl font-black text-white">{state.auction.currentBid}M</p>
                    {leader ? (
                      <p className="mt-1 text-sm font-bold text-emerald-200">{leader.name}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  <InfoCard label="Codigo" value={state.roomCode} detail="" />
                  <InfoCard
                    label="Linea"
                    value={state.auction.currentLine}
                    detail={progress ? `${progress.filled}/${progress.total}` : '-'}
                  />
                  <InfoCard
                    label="Incremento"
                    value={`+${state.setup.bidIncrement}M`}
                    detail={`${state.auction.lineQueues[state.auction.currentLine].length} vivos`}
                  />
                  <InfoCard
                    label="Skips"
                    value={skipsLeft === null ? '∞' : `${skipsLeft}`}
                    detail={skipsLeft === null ? 'sin tope' : `de ${state.setup.skipLimit}`}
                  />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <label className="flex-1">
                      <span className="text-xs uppercase tracking-[0.25em] text-stone-400">Oferta fija</span>
                      <input
                        type="number"
                        min={minimumBid}
                        step={1}
                        value={fixedBidInput}
                        placeholder={String(minimumBid)}
                        onChange={(event) => setFixedBidInput(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <div className="min-w-[160px] text-sm text-stone-500">
                      Mínimo {minimumBid}M
                    </div>
                  </div>
                  {state.auction.currentBid < currentPlayer.basePrice ? (
                    <p className="mt-3 text-xs text-amber-100/80">
                      Apertura bajada de {currentPlayer.basePrice}M: nadie puede pagar más sin
                      quedarse sin equipo.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.participants.map((participant) => {
                const enabled = !state.pendingAssignment && canParticipantBid(state, participant.id);
                const disabledReason = getBidBlockReason(state, participant.id);
                const fixedBidEnabled =
                  hasManualBid &&
                  !state.pendingAssignment &&
                  canParticipantBid(state, participant.id, fixedBidAmount ?? undefined);
                const fixedBidReason = hasManualBid
                  ? getBidBlockReason(state, participant.id, fixedBidAmount ?? undefined)
                  : null;

                return (
                  <div
                    key={participant.id}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-left"
                  >
                    <p className="text-2xl font-black uppercase text-white">{participant.name}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-300">{participant.budget}M</p>
                    {enabled ? null : (
                      <p className="mt-2 text-xs text-stone-500">{disabledReason}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={() => onPlaceBid(participant.id)}
                        className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100 transition enabled:hover:border-emerald-300/40 enabled:hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Pujar {minimumBid}M
                      </button>
                      {hasManualBid ? (
                        <button
                          type="button"
                          disabled={!fixedBidEnabled}
                          onClick={() => onPlaceBid(participant.id, fixedBidAmount ?? undefined)}
                          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Ofertar {fixedBidAmount}M
                        </button>
                      ) : null}
                    </div>
                    {hasManualBid && !fixedBidEnabled ? (
                      <p className="mt-3 text-xs text-stone-500">{fixedBidReason}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSell}
                disabled={!state.auction.currentLeaderId || !!state.pendingAssignment}
                className="inline-flex rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black transition enabled:hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Vendido
              </button>
              <button
                type="button"
                onClick={onSkip}
                disabled={!canSkip || !!state.pendingAssignment}
                className="inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Skip {skipsLeft === null ? '' : `(${skipsLeft})`}
              </button>
              <button
                type="button"
                onClick={onUndo}
                disabled={!state.lastUndoState || !!state.pendingAssignment}
                className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-amber-100 transition enabled:hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={onReset}
                className="inline-flex rounded-full border border-rose-300/20 bg-rose-300/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-rose-100 transition hover:bg-rose-300/15"
              >
                Salir
              </button>
            </div>

            {!canSkip && !state.pendingAssignment ? (
              <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {skipReason}
              </p>
            ) : null}
          </section>

          <aside className="grid gap-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Presupuestos</p>
              <div className="mt-4 grid gap-3">
                {state.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <span className="font-semibold text-white">{participant.name}</span>
                    <span className="text-sm text-stone-300">{participant.budget}M</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <TeamsBoard state={state} onPickSlot={onPickTeamSlot} />
      </div>

      <AssignmentModal state={state} onCancel={onCancelAssignment} onConfirm={onConfirmAssignment} />
    </>
  );
}

function InfoCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{detail}</p>
    </div>
  );
}

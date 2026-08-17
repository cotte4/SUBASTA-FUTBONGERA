import { useEffect, useMemo, useReducer, useState } from 'react';
import { AuctionScreen } from './features/auction/AuctionScreen';
import { ResultsScreen } from './features/results/ResultsScreen';
import { RosterModal } from './features/roster/RosterModal';
import { HomeScreen } from './features/setup/HomeScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { ReassignModal } from './features/teams/ReassignModal';
import { createRoomCode, createSnapshot } from './lib/game';
import {
  getEffectivePlayers,
  getRosterHealth,
  loadRoster,
  saveRoster,
  type Roster,
} from './lib/roster';
import { listSavedRoomCodes, loadGameSnapshot, saveGameSnapshot } from './lib/storage';
import { initialGameState } from './state/game-initial-state';
import { gameReducer } from './state/game-reducer';
import type { Line } from './types/domain';

type ReassignDraft = {
  participantId: string;
  line: Line;
  slot: string;
} | null;

export function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [reassignDraft, setReassignDraft] = useState<ReassignDraft>(null);
  const [roster, setRoster] = useState<Roster>(loadRoster);
  const [rosterOpen, setRosterOpen] = useState(false);

  // Fuente unica: el plantel con el que se juega se deriva del roster guardado.
  const effectivePlayers = useMemo(() => getEffectivePlayers(roster), [roster]);

  // El editor no deja romper los cupos, pero el plantel guardado sobrevive a los
  // cambios del dataset: si una version nueva saca jugadores de una linea donde
  // el usuario ya habia escondido otros, la suma puede quedar corta. Se revisa
  // antes de empezar, no cuando ya es tarde.
  const rosterProblem = useMemo(() => {
    const broken = getRosterHealth(effectivePlayers).broken;
    if (!broken.length) {
      return null;
    }

    return `Al plantel le faltan jugadores en ${broken
      .map((entry) => `${entry.label} (${entry.have} de ${entry.need})`)
      .join(', ')}. Entrá a "Editar plantel" y devolvé escondidos o agregá jugadores.`;
  }, [effectivePlayers]);

  useEffect(() => {
    if (state.phase === 'auction' || state.phase === 'results') {
      saveGameSnapshot(createSnapshot(state));
    }
  }, [state]);

  const savedRooms = listSavedRoomCodes();
  const participantForModal = reassignDraft
    ? state.participants.find((entry) => entry.id === reassignDraft.participantId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#17443b,_#081411_40%,_#040706_75%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        {state.phase === 'home' ? null : (
          <header className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-300">
              Subasta Futbolera
            </p>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-stone-400">
              {effectivePlayers.length} jugadores
            </div>
          </header>
        )}

        {state.phase === 'home' ? (
          <HomeScreen
            roomCodeInput={state.setup.roomCodeInput}
            savedRooms={savedRooms}
            errorMessage={state.errorMessage}
            playerCount={effectivePlayers.length}
            onEditRoster={() => setRosterOpen(true)}
            onNewGame={() => {
              setReassignDraft(null);
              dispatch({ type: 'SET_PHASE', payload: 'setup' });
            }}
            onRoomCodeChange={(value) =>
              dispatch({ type: 'UPDATE_SETUP', payload: { roomCodeInput: value.toUpperCase() } })
            }
            onResume={() => {
              const snapshot = loadGameSnapshot(state.setup.roomCodeInput);
              if (!snapshot) {
                dispatch({
                  type: 'SET_ERROR',
                  payload: 'No encontre una partida con ese codigo en este navegador.',
                });
                return;
              }

              setReassignDraft(null);
              dispatch({ type: 'LOAD_GAME', payload: snapshot });
            }}
          />
        ) : null}

        {state.phase === 'setup' ? (
          <SetupScreen
            setup={state.setup}
            rosterProblem={rosterProblem}
            onBack={() => {
              setReassignDraft(null);
              dispatch({ type: 'RESET_TO_HOME' });
            }}
            onStart={() => {
              setReassignDraft(null);
              dispatch({
                type: 'START_GAME',
                payload: { roomCode: createRoomCode(), players: effectivePlayers },
              });
            }}
            onUpdate={(value) => dispatch({ type: 'UPDATE_SETUP', payload: value })}
            onNameChange={(index, value) =>
              dispatch({ type: 'UPDATE_PARTICIPANT_NAME', payload: { index, value } })
            }
          />
        ) : null}

        {state.phase === 'auction' ? (
          <AuctionScreen
            state={state}
            onPlaceBid={(participantId, amount) =>
              dispatch({ type: 'PLACE_BID', payload: { participantId, amount } })
            }
            onSkip={() => dispatch({ type: 'SKIP_PLAYER' })}
            onSell={() => {
              setReassignDraft(null);
              dispatch({ type: 'OPEN_ASSIGNMENT' });
            }}
            onUndo={() => {
              setReassignDraft(null);
              dispatch({ type: 'UNDO_LAST_ACTION' });
            }}
            onReset={() => {
              setReassignDraft(null);
              dispatch({ type: 'RESET_TO_HOME' });
            }}
            onCancelAssignment={() => dispatch({ type: 'CANCEL_ASSIGNMENT' })}
            onConfirmAssignment={(slot) =>
              dispatch({ type: 'CONFIRM_ASSIGNMENT', payload: { slot } })
            }
            onPickTeamSlot={(payload) => {
              if (!state.pendingAssignment) {
                setReassignDraft(payload);
              }
            }}
          />
        ) : null}

        {state.phase === 'results' ? (
          <ResultsScreen
            state={state}
            onReset={() => {
              setReassignDraft(null);
              dispatch({ type: 'RESET_TO_HOME' });
            }}
            onPickTeamSlot={(payload) => setReassignDraft(payload)}
            onSetIdentity={(payload) => dispatch({ type: 'SET_TEAM_IDENTITY', payload })}
            onSetPodium={(position, participantId) =>
              dispatch({ type: 'SET_PODIUM_SLOT', payload: { position, participantId } })
            }
          />
        ) : null}
      </div>

      {rosterOpen ? (
        <RosterModal
          roster={roster}
          onChange={(next) => {
            // Si el navegador no puede guardarlo, el cambio no se aplica y el
            // modal muestra el motivo: mejor eso que perderlo al recargar.
            const result = saveRoster(next);
            if (!result.ok) {
              return result.error;
            }

            setRoster(next);
            return null;
          }}
          onClose={() => setRosterOpen(false)}
        />
      ) : null}

      {participantForModal && reassignDraft ? (
        <ReassignModal
          participant={participantForModal}
          line={reassignDraft.line}
          fromSlot={reassignDraft.slot}
          onClose={() => setReassignDraft(null)}
          onConfirm={(toSlot) => {
            dispatch({
              type: 'REASSIGN_TEAM_SLOT',
              payload: {
                participantId: reassignDraft.participantId,
                line: reassignDraft.line,
                fromSlot: reassignDraft.slot,
                toSlot,
              },
            });
            setReassignDraft(null);
          }}
        />
      ) : null}
    </main>
  );
}

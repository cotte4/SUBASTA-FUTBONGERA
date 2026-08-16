/**
 * Simulacion headless de partidas completas contra el reducer real.
 * Verifica el invariante del modo garantizado: ninguna secuencia legal de
 * acciones puede dejar una partida imposible de completar.
 *
 * Uso: npx tsx scripts/simulate-auction.ts [cantidadDePartidas]
 */
import { allPlayers } from '../src/data/players';
import {
  canParticipantBid,
  canSkipCurrentPlayer,
  createRoomCode,
  getCurrentPlayer,
  getNextBidAmount,
  getOpenSlots,
} from '../src/lib/game';
import { initialGameState } from '../src/state/game-initial-state';
import { gameReducer } from '../src/state/game-reducer';
import { LINES } from '../src/types/domain';
import type { GameAction, GameState } from '../src/types/state';

const RUNS = Number(process.argv[2]) || 200;
const MAX_STEPS = 5000;

type Failure = { run: number; reason: string; detail: string };
const failures: Failure[] = [];

for (let run = 1; run <= RUNS; run += 1) {
  const participantCount = 4 + Math.floor(Math.random() * 3);
  const initialBudget = [54, 80, 150, 300][Math.floor(Math.random() * 4)];
  const bidIncrement = [1, 2, 5][Math.floor(Math.random() * 3)];

  let state = apply(initialGameState, { type: 'SET_PHASE', payload: 'setup' });
  state = apply(state, {
    type: 'UPDATE_SETUP',
    payload: { participantCount, initialBudget, bidIncrement },
  });
  state = apply(state, {
    type: 'START_GAME',
    payload: { roomCode: createRoomCode(), players: allPlayers },
  });

  let steps = 0;
  while (state.phase === 'auction' && steps < MAX_STEPS) {
    steps += 1;

    const violation = checkInvariants(state);
    if (violation) {
      failures.push({ run, reason: violation, detail: describe(state) });
      break;
    }

    if (state.pendingAssignment) {
      const winner = state.participants.find((p) => p.id === state.pendingAssignment!.participantId)!;
      const open = getOpenSlots(winner, state.pendingAssignment.line);
      if (!open.length) {
        failures.push({ run, reason: 'pendingAssignment sin slots libres', detail: describe(state) });
        break;
      }
      state = apply(state, {
        type: 'CONFIRM_ASSIGNMENT',
        payload: { slot: open[Math.floor(Math.random() * open.length)].slot },
      });
      continue;
    }

    if (state.auction?.currentLeaderId) {
      // 30% de las veces alguien sube la puja antes de cerrar
      const challengers = state.participants.filter(
        (p) => p.id !== state.auction!.currentLeaderId && canParticipantBid(state, p.id),
      );
      if (challengers.length && Math.random() < 0.3) {
        const challenger = challengers[Math.floor(Math.random() * challengers.length)];
        state = apply(state, { type: 'PLACE_BID', payload: { participantId: challenger.id } });
        continue;
      }
      state = apply(state, { type: 'OPEN_ASSIGNMENT' });
      if (!state.pendingAssignment) {
        failures.push({ run, reason: 'OPEN_ASSIGNMENT no abrio con lider activo', detail: describe(state) });
        break;
      }
      continue;
    }

    const bidders = state.participants.filter((p) => canParticipantBid(state, p.id));
    const canSkip = canSkipCurrentPlayer(state);

    if (!bidders.length && !canSkip) {
      failures.push({
        run,
        reason: 'DEADLOCK: nadie puede pujar y el skip esta bloqueado',
        detail: describe(state),
      });
      break;
    }

    if (bidders.length && (!canSkip || Math.random() < 0.75)) {
      const bidder = bidders[Math.floor(Math.random() * bidders.length)];
      const before = getNextBidAmount(state);
      state = apply(state, { type: 'PLACE_BID', payload: { participantId: bidder.id } });
      if (!state.auction?.currentLeaderId) {
        failures.push({ run, reason: `PLACE_BID legal ignorado (min ${before}M)`, detail: describe(state) });
        break;
      }
      continue;
    }

    state = apply(state, { type: 'SKIP_PLAYER' });
  }

  if (steps >= MAX_STEPS) {
    failures.push({ run, reason: 'LOOP: la partida no termino en 5000 pasos', detail: describe(state) });
    continue;
  }

  if (state.phase === 'results') {
    const incomplete = state.participants.filter((p) =>
      LINES.some((line) => p.team[line].some((slot) => slot.playerId === null)),
    );
    if (incomplete.length) {
      failures.push({
        run,
        reason: `RESULTS con ${incomplete.length} equipo(s) incompleto(s)`,
        detail: describe(state),
      });
    }
    const negative = state.participants.filter((p) => p.budget < 0);
    if (negative.length) {
      failures.push({ run, reason: 'presupuesto negativo', detail: describe(state) });
    }
    const ids = state.participants.flatMap((p) =>
      LINES.flatMap((line) => p.team[line].map((s) => s.playerId).filter(Boolean)),
    );
    if (new Set(ids).size !== ids.length) {
      failures.push({ run, reason: 'jugador asignado a dos equipos', detail: describe(state) });
    }
  }
}

function apply(state: GameState, action: GameAction) {
  return gameReducer(state, action);
}

function checkInvariants(state: GameState) {
  if (state.participants.some((p) => p.budget < 0)) {
    return 'presupuesto negativo durante la subasta';
  }
  // Cada linea debe tener al menos tantos jugadores en cola como slots pendientes
  for (const line of LINES) {
    const pending = state.participants.reduce(
      (t, p) => t + p.team[line].filter((s) => s.playerId === null).length,
      0,
    );
    const available = state.auction?.lineQueues[line].length ?? 0;
    if (pending > available) {
      return `linea ${line}: ${pending} slots pendientes pero solo ${available} jugadores en cola`;
    }
  }
  return null;
}

function describe(state: GameState) {
  const player = getCurrentPlayer(state);
  const teams = state.participants
    .map((p) => `${p.name}=${p.budget}M[${LINES.map((l) => p.team[l].filter((s) => s.playerId).length).join('/')}]`)
    .join(' ');
  return `fase=${state.phase} linea=${state.auction?.currentLine} jugador=${player?.name ?? '-'} puja=${state.auction?.currentBid} | ${teams}`;
}

console.log(`\nSimuladas ${RUNS} partidas completas.`);
if (!failures.length) {
  console.log('OK — ninguna violacion del modo garantizado.\n');
  process.exit(0);
}

const grouped = new Map<string, Failure[]>();
for (const failure of failures) {
  const key = failure.reason.replace(/\d+/g, 'N');
  grouped.set(key, [...(grouped.get(key) ?? []), failure]);
}

console.log(`FALLAS: ${failures.length} de ${RUNS} partidas\n`);
for (const [key, items] of grouped) {
  console.log(`  [${items.length}x] ${key}`);
  console.log(`        ej. run ${items[0].run}: ${items[0].reason}`);
  console.log(`        ${items[0].detail}\n`);
}
process.exit(1);

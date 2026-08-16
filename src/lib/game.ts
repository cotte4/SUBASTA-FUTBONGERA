import { LINES, SLOT_ORDER, type Line, type Participant, type Player, type TeamSlot } from '../types/domain';
import type { AuctionState, GameSnapshot, GameState, SetupDraft } from '../types/state';

export const floorPriceByLine: Record<Line, number> = {
  GK: 5,
  DEF: 4,
  MID: 5,
  FWD: 6,
};

export const MIN_PARTICIPANTS = 4;
export const MAX_PARTICIPANTS = 6;

/**
 * Composicion del pool de subasta por sub-rol. La cantidad tomada de cada
 * regla es `(participantCount + 1) * multiplier`, o sea un jugador de margen
 * por rol (dos para CB y CM/CDM, que ocupan dos slots por equipo).
 *
 * Es la fuente unica: la usan el armado del pool, el validador del seed y el
 * editor de plantel. Si un sub-rol no llega a su cupo, la partida puede
 * volverse imposible de completar.
 */
export const POOL_RULES: Array<{ line: Line; subPositions: string[]; multiplier: number }> = [
  { line: 'GK', subPositions: ['GK'], multiplier: 1 },
  { line: 'DEF', subPositions: ['LB'], multiplier: 1 },
  { line: 'DEF', subPositions: ['CB'], multiplier: 2 },
  { line: 'DEF', subPositions: ['RB'], multiplier: 1 },
  { line: 'MID', subPositions: ['CM', 'CDM'], multiplier: 2 },
  { line: 'MID', subPositions: ['CAM'], multiplier: 1 },
  { line: 'FWD', subPositions: ['LW'], multiplier: 1 },
  { line: 'FWD', subPositions: ['ST'], multiplier: 1 },
  { line: 'FWD', subPositions: ['RW'], multiplier: 1 },
];

/** Sub-posiciones aceptadas por linea, derivadas de POOL_RULES. */
export const VALID_SUB_POSITIONS = LINES.reduce(
  (acc, line) => {
    acc[line] = POOL_RULES.filter((rule) => rule.line === line).flatMap((rule) => rule.subPositions);
    return acc;
  },
  {} as Record<Line, string[]>,
);

export type QuotaEntry = {
  line: Line;
  subPositions: string[];
  label: string;
  need: number;
  have: number;
  ok: boolean;
};

/**
 * Cuantos jugadores hace falta tener de cada sub-rol y cuantos hay.
 * Por defecto evalua el peor caso (la cantidad maxima de participantes).
 */
export function getQuotaReport(players: Player[], participantCount = MAX_PARTICIPANTS): QuotaEntry[] {
  const extraPool = participantCount + 1;

  return POOL_RULES.map((rule) => {
    const need = extraPool * rule.multiplier;
    const have = players.filter(
      (player) => player.line === rule.line && rule.subPositions.includes(player.subPosition),
    ).length;

    return {
      line: rule.line,
      subPositions: rule.subPositions,
      label: `${rule.line} ${rule.subPositions.join('/')}`,
      need,
      have,
      ok: have >= need,
    };
  });
}

export function createRoomCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 6);
}

export function sanitizeSetup(setup: SetupDraft): SetupDraft {
  const participantCount = Math.min(6, Math.max(4, Number(setup.participantCount) || 4));
  const initialBudget = Math.max(54, Number(setup.initialBudget) || 150);
  const bidIncrement = Math.max(1, Number(setup.bidIncrement) || 1);

  return {
    ...setup,
    participantCount,
    initialBudget,
    bidIncrement,
    roomCodeInput: setup.roomCodeInput.trim().toUpperCase(),
    names: setup.names.map((name, index) => name.trim() || `Jugador ${index + 1}`),
  };
}

export function buildPlayersMap(players: Player[]) {
  return Object.fromEntries(players.map((player) => [player.id, player]));
}

export function buildParticipants(setup: SetupDraft): Participant[] {
  return setup.names.slice(0, setup.participantCount).map((name, index) => ({
    id: `participant-${index + 1}`,
    name,
    budget: setup.initialBudget,
    team: {
      GK: createSlots('GK'),
      DEF: createSlots('DEF'),
      MID: createSlots('MID'),
      FWD: createSlots('FWD'),
    },
  }));
}

export function buildAuction(players: Player[], participantCount: number): AuctionState {
  const lineQueues = {
    GK: buildLineQueue(players, 'GK', participantCount),
    DEF: buildLineQueue(players, 'DEF', participantCount),
    MID: buildLineQueue(players, 'MID', participantCount),
    FWD: buildLineQueue(players, 'FWD', participantCount),
  };

  return {
    currentLine: getFirstPlayableLine(lineQueues, 'GK'),
    lineQueues,
    currentBid: 0,
    currentLeaderId: null,
  };
}

export function getCurrentPlayer(state: GameState | GameSnapshot) {
  if (!state.auction) {
    return null;
  }

  const currentPlayerId = state.auction.lineQueues[state.auction.currentLine][0];
  return currentPlayerId ? state.players[currentPlayerId] : null;
}

export function getNextBidAmount(state: GameState | GameSnapshot) {
  const currentPlayer = getCurrentPlayer(state);
  if (!state.auction || !currentPlayer) {
    return 0;
  }

  return state.auction.currentLeaderId ? state.auction.currentBid + state.setup.bidIncrement : state.auction.currentBid;
}

export function canParticipantBid(state: GameState | GameSnapshot, participantId: string, requestedAmount?: number) {
  return getBidBlockReason(state, participantId, requestedAmount) === null;
}

export function getBidBlockReason(state: GameState | GameSnapshot, participantId: string, requestedAmount?: number) {
  if (!state.auction) {
    return 'La subasta no esta activa.';
  }

  const participant = state.participants.find((entry) => entry.id === participantId);
  if (!participant) {
    return 'Participante no encontrado.';
  }

  const line = state.auction.currentLine;
  const minimumBid = getNextBidAmount(state);
  const nextBid = normalizeBidAmount(requestedAmount) ?? minimumBid;
  const affordableCap = getParticipantAffordableCap(state, participantId);

  if (!participant.team[line].some((slot) => slot.playerId === null)) {
    return `Ya completo todos sus cupos de ${line}.`;
  }

  if (nextBid < minimumBid) {
    return `La oferta minima es ${minimumBid}M.`;
  }

  if (nextBid <= 0) {
    return 'Ingresa una oferta valida.';
  }

  if (affordableCap < nextBid) {
    return affordableCap > 0
      ? `Solo puede llegar a ${affordableCap}M sin romper la garantia.`
      : 'No tiene presupuesto libre para ofertar en esta linea.';
  }

  return null;
}

export function canSkipCurrentPlayer(state: GameState | GameSnapshot) {
  if (!state.auction || state.auction.currentLeaderId) {
    return false;
  }

  const line = state.auction.currentLine;
  const remainingPlayers = state.auction.lineQueues[line].length;
  const pendingSlots = state.participants.reduce(
    (total, participant) => total + participant.team[line].filter((slot) => slot.playerId === null).length,
    0,
  );

  return remainingPlayers > pendingSlots;
}

export function getSkipBlockReason(state: GameState | GameSnapshot) {
  if (!state.auction) {
    return 'No hay subasta activa.';
  }

  if (state.auction.currentLeaderId) {
    return 'No podes skipear un jugador que ya recibio una puja.';
  }

  const line = state.auction.currentLine;
  const remainingPlayers = state.auction.lineQueues[line].length;
  const pendingSlots = state.participants.reduce(
    (total, participant) => total + participant.team[line].filter((slot) => slot.playerId === null).length,
    0,
  );

  if (remainingPlayers <= pendingSlots) {
    return `Skip bloqueado: quedan ${remainingPlayers} jugadores para ${pendingSlots} cupos en ${line}.`;
  }

  return null;
}

export function getLineProgress(state: GameState | GameSnapshot, line: Line) {
  const filled = state.participants.reduce(
    (total, participant) => total + participant.team[line].filter((slot) => slot.playerId !== null).length,
    0,
  );
  const total = state.participants.reduce((sum, participant) => sum + participant.team[line].length, 0);
  return { filled, total, remaining: total - filled };
}

export function isAuctionComplete(state: GameSnapshot) {
  return state.participants.every((participant) =>
    LINES.every((line) => participant.team[line].every((slot) => slot.playerId !== null)),
  );
}

export function createSnapshot(state: GameState): GameSnapshot {
  return {
    phase: state.phase,
    roomCode: state.roomCode,
    setup: structuredClone(state.setup),
    players: structuredClone(state.players),
    participants: structuredClone(state.participants),
    auction: state.auction ? structuredClone(state.auction) : null,
    pendingAssignment: state.pendingAssignment ? structuredClone(state.pendingAssignment) : null,
  };
}

export function advanceAuction(snapshot: GameSnapshot) {
  if (!snapshot.auction) {
    return snapshot;
  }

  const hasPendingSlots = (line: Line) =>
    snapshot.participants.some((participant) => participant.team[line].some((slot) => slot.playerId === null));

  const currentHasPlayer = snapshot.auction.lineQueues[snapshot.auction.currentLine].length > 0;
  const currentNeedsPlayers = hasPendingSlots(snapshot.auction.currentLine);

  if (!currentHasPlayer || !currentNeedsPlayers) {
    const nextLine = LINES.find(
      (line) => snapshot.auction && snapshot.auction.lineQueues[line].length > 0 && hasPendingSlots(line),
    );
    if (nextLine) {
      snapshot.auction.currentLine = nextLine;
    }
  }

  const currentPlayer = getCurrentPlayer(snapshot);
  snapshot.auction.currentBid = currentPlayer ? getOpeningBid(snapshot, currentPlayer) : 0;
  snapshot.auction.currentLeaderId = null;
  snapshot.phase = isAuctionComplete(snapshot) || !currentPlayer ? 'results' : 'auction';

  return snapshot;
}

export function getOpenSlots(participant: Participant, line: Line) {
  return participant.team[line].filter((slot) => slot.playerId === null);
}

export function assignPlayerToSlot(
  participant: Participant,
  playerId: string,
  line: Line,
  slotName: string,
  pricePaid: number,
) {
  const openSlot = participant.team[line].find((slot) => slot.slot === slotName && slot.playerId === null);
  if (!openSlot) {
    return false;
  }

  openSlot.playerId = playerId;
  openSlot.pricePaid = pricePaid;
  return true;
}

function getFirstPlayableLine(lineQueues: Record<Line, string[]>, fallback: Line) {
  return LINES.find((line) => lineQueues[line].length > 0) ?? fallback;
}

function createSlots(line: Line): TeamSlot[] {
  return SLOT_ORDER[line].map((slot) => ({
    slot,
    playerId: null,
    pricePaid: null,
  }));
}

function buildLineQueue(players: Player[], line: Line, participantCount: number) {
  const linePlayers = players.filter((player) => player.line === line);
  const selectedPlayers = getLinePoolByRole(linePlayers, line, participantCount);

  return shuffle(selectedPlayers.map((player) => player.id));
}

function getLinePoolByRole(players: Player[], line: Line, participantCount: number) {
  const extraPool = participantCount + 1;
  const rules = POOL_RULES.filter((rule) => rule.line === line);

  if (!rules.length) {
    return shuffle(players);
  }

  return takePlayersBySubPositions(
    players,
    rules.map((rule) => ({ subPositions: rule.subPositions, count: extraPool * rule.multiplier })),
  );
}

function takePlayersBySubPositions(
  players: Player[],
  rules: Array<{ subPositions: string[]; count: number }>,
) {
  return rules.flatMap(({ subPositions, count }) =>
    shuffle(players.filter((player) => subPositions.includes(player.subPosition))).slice(0, count),
  );
}

function shuffle<T>(items: T[]) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
}

function getOpeningBid(state: GameState | GameSnapshot, player: Player) {
  const maxAffordable = Math.max(
    0,
    ...state.participants
      .filter((participant) => participant.team[player.line].some((slot) => slot.playerId === null))
      .map((participant) => getParticipantAffordableCap(state, participant.id)),
  );

  return Math.min(player.basePrice, maxAffordable);
}

function getParticipantAffordableCap(state: GameState | GameSnapshot, participantId: string) {
  const participant = state.participants.find((entry) => entry.id === participantId);
  if (!participant || !state.auction) {
    return 0;
  }

  const line = state.auction.currentLine;
  const reserved = LINES.reduce((total, currentLine) => {
    const missingSlots = participant.team[currentLine].filter((slot) => slot.playerId === null).length;
    const hypotheticalRemaining = currentLine === line ? Math.max(0, missingSlots - 1) : missingSlots;
    return total + hypotheticalRemaining * floorPriceByLine[currentLine];
  }, 0);

  return Math.max(0, participant.budget - reserved);
}

function normalizeBidAmount(requestedAmount?: number) {
  if (requestedAmount === undefined) {
    return null;
  }

  if (!Number.isFinite(requestedAmount)) {
    return -1;
  }

  return Math.floor(requestedAmount);
}

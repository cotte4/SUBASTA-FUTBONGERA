import {
  advanceAuction,
  assignPlayerToSlot,
  buildAuction,
  buildParticipants,
  buildPlayersMap,
  canParticipantBid,
  canSkipCurrentPlayer,
  createSnapshot,
  getCurrentPlayer,
  getNextBidAmount,
  getOpenSlots,
  sanitizeSetup,
} from '../lib/game';
import { initialGameState } from './game-initial-state';
import type { GameAction, GameState } from '../types/state';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'UPDATE_SETUP':
      return {
        ...state,
        setup: sanitizeSetup({ ...state.setup, ...action.payload }),
        errorMessage: null,
      };
    case 'UPDATE_PARTICIPANT_NAME': {
      const names = [...state.setup.names];
      names[action.payload.index] = action.payload.value;
      return { ...state, setup: sanitizeSetup({ ...state.setup, names }) };
    }
    case 'START_GAME': {
      const setup = sanitizeSetup(state.setup);
      const nextState: GameState = {
        phase: 'auction',
        roomCode: action.payload.roomCode,
        setup,
        players: buildPlayersMap(action.payload.players),
        participants: buildParticipants(setup),
        auction: buildAuction(action.payload.players, setup.participantCount, setup.poolMargin),
        pendingAssignment: null,
        podium: [],
        lastUndoState: null,
        savedAt: null,
        errorMessage: null,
      };
      advanceAuction(nextState);
      return nextState;
    }
    case 'LOAD_GAME':
      return {
        ...action.payload,
        lastUndoState: null,
        savedAt: new Date().toISOString(),
        errorMessage: null,
      };
    case 'SET_ERROR':
      return { ...state, errorMessage: action.payload };
    case 'PLACE_BID': {
      const bidAmount = action.payload.amount ?? getNextBidAmount(state);

      if (!state.auction || state.pendingAssignment || !canParticipantBid(state, action.payload.participantId, bidAmount)) {
        return state;
      }

      return {
        ...state,
        lastUndoState: createSnapshot(state),
        auction: {
          ...state.auction,
          currentBid: bidAmount,
          currentLeaderId: action.payload.participantId,
        },
        errorMessage: null,
      };
    }
    case 'SKIP_PLAYER': {
      const currentPlayer = getCurrentPlayer(state);
      if (!state.auction || state.pendingAssignment || !currentPlayer || !canSkipCurrentPlayer(state)) {
        return state;
      }

      const snapshot = createSnapshot(state);
      if (snapshot.auction) {
        snapshot.auction.lineQueues[snapshot.auction.currentLine].shift();
        snapshot.auction.skipsUsed += 1;
      }
      advanceAuction(snapshot);

      return {
        ...snapshot,
        lastUndoState: createSnapshot(state),
        savedAt: null,
        errorMessage: null,
      };
    }
    case 'OPEN_ASSIGNMENT': {
      const currentPlayer = getCurrentPlayer(state);
      if (!state.auction || !currentPlayer || !state.auction.currentLeaderId) {
        return state;
      }

      const winner = state.participants.find((participant) => participant.id === state.auction?.currentLeaderId);
      if (!winner) {
        return state;
      }

      const openSlots = getOpenSlots(winner, state.auction.currentLine);
      if (!openSlots.length) {
        return state;
      }

      return {
        ...state,
        pendingAssignment: {
          participantId: winner.id,
          playerId: currentPlayer.id,
          line: state.auction.currentLine,
          pricePaid: state.auction.currentBid,
        },
      };
    }
    case 'CANCEL_ASSIGNMENT':
      return {
        ...state,
        pendingAssignment: null,
      };
    case 'CONFIRM_ASSIGNMENT': {
      if (!state.pendingAssignment || !state.auction) {
        return state;
      }

      const snapshot = createSnapshot(state);
      const pendingAssignment = snapshot.pendingAssignment;
      if (!pendingAssignment) {
        return state;
      }

      const winner = snapshot.participants.find(
        (participant) => participant.id === pendingAssignment.participantId,
      );
      if (!winner || !snapshot.auction) {
        return state;
      }

      const assigned = assignPlayerToSlot(
        winner,
        pendingAssignment.playerId,
        pendingAssignment.line,
        action.payload.slot,
        pendingAssignment.pricePaid,
      );
      if (!assigned) {
        return state;
      }

      winner.budget -= pendingAssignment.pricePaid;
      snapshot.auction.lineQueues[pendingAssignment.line].shift();
      snapshot.pendingAssignment = null;
      advanceAuction(snapshot);

      return {
        ...snapshot,
        lastUndoState: createSnapshot(state),
        savedAt: null,
        errorMessage: null,
      };
    }
    case 'REASSIGN_TEAM_SLOT': {
      const snapshot = createSnapshot(state);
      const participant = snapshot.participants.find(
        (entry) => entry.id === action.payload.participantId,
      );

      if (!participant) {
        return state;
      }

      const fromSlot = participant.team[action.payload.line].find(
        (slot) => slot.slot === action.payload.fromSlot,
      );
      const toSlot = participant.team[action.payload.line].find(
        (slot) => slot.slot === action.payload.toSlot,
      );

      if (!fromSlot || !toSlot || !fromSlot.playerId || fromSlot.slot === toSlot.slot) {
        return state;
      }

      const previousFrom = {
        playerId: fromSlot.playerId,
        pricePaid: fromSlot.pricePaid,
      };

      fromSlot.playerId = toSlot.playerId;
      fromSlot.pricePaid = toSlot.pricePaid;
      toSlot.playerId = previousFrom.playerId;
      toSlot.pricePaid = previousFrom.pricePaid;

      return {
        ...snapshot,
        lastUndoState: createSnapshot(state),
        savedAt: null,
        errorMessage: null,
      };
    }
    case 'SET_TEAM_IDENTITY': {
      const snapshot = createSnapshot(state);
      const participant = snapshot.participants.find(
        (entry) => entry.id === action.payload.participantId,
      );

      if (!participant) {
        return state;
      }

      if (action.payload.teamName !== undefined) {
        participant.teamName = action.payload.teamName.slice(0, 24);
      }
      if (action.payload.logo !== undefined) {
        participant.logo = action.payload.logo;
      }

      return { ...state, participants: snapshot.participants, savedAt: null };
    }
    case 'SET_PODIUM_SLOT': {
      const { position, participantId } = action.payload;
      // 0-2 son el podio; 3 es el ultimo puesto.
      if (position < 0 || position > 3) {
        return state;
      }

      // Un participante ocupa un solo lugar: si ya estaba en otro, se muda.
      const podium = [...state.podium];
      while (podium.length < 4) {
        podium.push('');
      }

      const previous = podium.indexOf(participantId ?? '');
      if (participantId && previous !== -1) {
        podium[previous] = podium[position];
      }
      podium[position] = participantId ?? '';

      return {
        ...state,
        podium: podium.map((entry) => entry ?? ''),
        savedAt: null,
      };
    }
    case 'UNDO_LAST_ACTION':
      return state.lastUndoState
        ? { ...state.lastUndoState, lastUndoState: null, savedAt: null, errorMessage: null }
        : state;
    case 'RESET_TO_HOME':
      return initialGameState;
    default:
      return state;
  }
}

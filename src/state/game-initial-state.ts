import type { GameState } from '../types/state';

export const defaultSetupDraft = {
  participantCount: 4,
  names: ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6'],
  initialBudget: 150,
  bidIncrement: 1,
  skipLimit: 5,
  roomCodeInput: '',
};

export const initialGameState: GameState = {
  phase: 'home',
  roomCode: '',
  setup: defaultSetupDraft,
  players: {},
  participants: [],
  auction: null,
  pendingAssignment: null,
  podium: [],
  lastUndoState: null,
  savedAt: null,
  errorMessage: null,
};

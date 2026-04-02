import type { GameState } from '../types/state';

export const initialGameState: GameState = {
  phase: 'home',
  roomCode: 'AB3K',
  settings: {
    participantCount: 4,
    initialBudget: 150,
    bidIncrement: 1,
  },
};

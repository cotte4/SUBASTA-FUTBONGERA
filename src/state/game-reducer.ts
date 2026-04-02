import type { GameAction, GameState } from '../types/state';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload,
      };
    default:
      return state;
  }
}

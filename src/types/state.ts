export type GamePhase = 'home' | 'setup' | 'auction' | 'teams' | 'results';

export type GameState = {
  phase: GamePhase;
  roomCode: string;
  settings: {
    participantCount: number;
    initialBudget: number;
    bidIncrement: number;
  };
};

export type GameAction = {
  type: 'SET_PHASE';
  payload: GamePhase;
};

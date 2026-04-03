import type { Line, Participant, Player } from './domain';

export type GamePhase = 'home' | 'setup' | 'auction' | 'results';

export type SetupDraft = {
  participantCount: number;
  names: string[];
  initialBudget: number;
  bidIncrement: number;
  roomCodeInput: string;
};

export type AuctionState = {
  currentLine: Line;
  lineQueues: Record<Line, string[]>;
  currentBid: number;
  currentLeaderId: string | null;
};

export type PendingAssignment = {
  participantId: string;
  playerId: string;
  line: Line;
  pricePaid: number;
};

export type GameSnapshot = {
  phase: GamePhase;
  roomCode: string;
  setup: SetupDraft;
  players: Record<string, Player>;
  participants: Participant[];
  auction: AuctionState | null;
  pendingAssignment: PendingAssignment | null;
};

export type GameState = GameSnapshot & {
  lastUndoState: GameSnapshot | null;
  savedAt: string | null;
  errorMessage: string | null;
};

export type GameAction =
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'UPDATE_SETUP'; payload: Partial<SetupDraft> }
  | { type: 'UPDATE_PARTICIPANT_NAME'; payload: { index: number; value: string } }
  | { type: 'START_GAME'; payload: { roomCode: string; players: Player[] } }
  | { type: 'LOAD_GAME'; payload: GameSnapshot }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'PLACE_BID'; payload: { participantId: string } }
  | { type: 'SKIP_PLAYER' }
  | { type: 'OPEN_ASSIGNMENT' }
  | { type: 'CANCEL_ASSIGNMENT' }
  | { type: 'CONFIRM_ASSIGNMENT'; payload: { slot: string } }
  | {
      type: 'REASSIGN_TEAM_SLOT';
      payload: {
        participantId: string;
        line: Line;
        fromSlot: string;
        toSlot: string;
      };
    }
  | { type: 'UNDO_LAST_ACTION' }
  | { type: 'RESET_TO_HOME' };

import { z } from 'zod';
import { TEAM_LOGOS } from '../types/domain';
import type { GameSnapshot } from '../types/state';

const STORAGE_PREFIX = 'subasta-futbolera';

const snapshotSchema = z.object({
  phase: z.enum(['home', 'setup', 'auction', 'results']),
  roomCode: z.string(),
  setup: z.object({
    participantCount: z.number(),
    names: z.array(z.string()),
    initialBudget: z.number(),
    bidIncrement: z.number(),
    // Los campos nuevos llevan default para que las partidas guardadas antes de
    // existir sigan cargando en vez de morir en la validacion.
    skipLimit: z.number().nullable().default(null),
    roomCodeInput: z.string(),
  }),
  players: z.record(z.string(), z.any()),
  participants: z.array(z.any()),
  auction: z.any().nullable(),
  podium: z.array(z.string()).default([]),
  pendingAssignment: z
    .object({
      participantId: z.string(),
      playerId: z.string(),
      line: z.enum(['GK', 'DEF', 'MID', 'FWD']),
      pricePaid: z.number(),
    })
    .nullable(),
});

export function buildStorageKey(roomCode: string) {
  return `${STORAGE_PREFIX}:${roomCode}`;
}

export function saveGameSnapshot(snapshot: GameSnapshot) {
  if (typeof window === 'undefined' || !snapshot.roomCode) {
    return;
  }

  window.localStorage.setItem(buildStorageKey(snapshot.roomCode), JSON.stringify(snapshot));
}

export function loadGameSnapshot(roomCode: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(buildStorageKey(roomCode.toUpperCase()));
  if (!raw) {
    return null;
  }

  try {
    return normalizeSnapshot(snapshotSchema.parse(JSON.parse(raw)) as GameSnapshot);
  } catch {
    return null;
  }
}

/**
 * Rellena lo que las partidas guardadas con versiones anteriores no traen.
 * Sin esto `skipsUsed` seria undefined y la cuenta de skips daria NaN.
 */
function normalizeSnapshot(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    auction: snapshot.auction
      ? { ...snapshot.auction, skipsUsed: snapshot.auction.skipsUsed ?? 0 }
      : null,
    participants: snapshot.participants.map((participant, index) => ({
      ...participant,
      teamName: participant.teamName ?? '',
      logo: participant.logo || TEAM_LOGOS[index % TEAM_LOGOS.length],
    })),
  };
}

export function listSavedRoomCodes() {
  if (typeof window === 'undefined') {
    return [];
  }

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(`${STORAGE_PREFIX}:`))
    .map((key) => key.replace(`${STORAGE_PREFIX}:`, ''))
    .sort();
}

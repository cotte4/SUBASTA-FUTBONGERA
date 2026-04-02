const STORAGE_PREFIX = 'subasta-futbolera';

export function buildStorageKey(roomCode: string) {
  return `${STORAGE_PREFIX}:${roomCode}`;
}

import { z } from 'zod';
import { allPlayers, pricingTable } from '../data/players';
import { getQuotaReport, VALID_SUB_POSITIONS } from './game';
import { LINES, type Line, type Player, type Tier } from '../types/domain';

/**
 * Plantel editable por dispositivo.
 *
 * El dataset de `src/data/players.ts` es la base y no se toca. Encima se
 * guardan dos cosas en localStorage: los jugadores agregados a mano y los ids
 * del dataset base que se ocultaron. El plantel efectivo es la base menos los
 * ocultos, mas los agregados.
 *
 * Ojo: esto vive en el navegador, asi que cada dispositivo tiene su propio
 * plantel. Dos celulares distintos no comparten los jugadores agregados.
 */

const STORAGE_KEY = 'subasta-futbolera:roster';
export const CUSTOM_ID_PREFIX = 'custom-';

const TIERS = ['S', 'A', 'B', 'C'] as const;

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  photo: z.string(),
  line: z.enum(LINES),
  subPosition: z.string(),
  tier: z.enum(TIERS),
  basePrice: z.number(),
});

const rosterSchema = z.object({
  customPlayers: z.array(playerSchema),
  excludedIds: z.array(z.string()),
});

export type Roster = z.infer<typeof rosterSchema>;

export type PlayerDraft = {
  name: string;
  country: string;
  line: Line;
  subPosition: string;
  tier: Tier;
  photo: string;
};

export const emptyRoster: Roster = { customPlayers: [], excludedIds: [] };

export function loadRoster(): Roster {
  if (typeof window === 'undefined') {
    return emptyRoster;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyRoster;
  }

  try {
    return rosterSchema.parse(JSON.parse(raw));
  } catch {
    return emptyRoster;
  }
}

export function saveRoster(roster: Roster) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
}

/** El plantel con el que se juega: base sin los ocultos, mas los agregados. */
export function getEffectivePlayers(roster: Roster): Player[] {
  const excluded = new Set(roster.excludedIds);
  return [...allPlayers.filter((player) => !excluded.has(player.id)), ...roster.customPlayers];
}

export function isCustomPlayer(player: Player) {
  return player.id.startsWith(CUSTOM_ID_PREFIX);
}

/**
 * Arma un Player completo desde el formulario, derivando lo mismo que deriva
 * el dataset: el precio sale de la tabla, nunca se escribe a mano.
 */
export function createCustomPlayer(draft: PlayerDraft, existing: Player[]): Player {
  // NFD separa cada letra de su acento; COMBINING_MARKS borra los acentos
  // sueltos para que "Mbappé" quede "mbappe" y no "mbapp-".
  const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

  const slug =
    draft.name
      .toLowerCase()
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'jugador';

  const taken = new Set(existing.map((player) => player.id));
  let id = `${CUSTOM_ID_PREFIX}${slug}`;
  let suffix = 2;
  while (taken.has(id)) {
    id = `${CUSTOM_ID_PREFIX}${slug}-${suffix}`;
    suffix += 1;
  }

  return {
    id,
    name: draft.name.trim(),
    country: draft.country.trim() || 'Sin pais',
    countryCode: '',
    photo: draft.photo.trim(),
    line: draft.line,
    subPosition: draft.subPosition,
    tier: draft.tier,
    basePrice: pricingTable[draft.line][draft.tier],
  };
}

/** Valida el formulario. Devuelve null si esta todo bien. */
export function getDraftError(draft: PlayerDraft): string | null {
  if (!draft.name.trim()) {
    return 'Poné un nombre.';
  }

  if (!VALID_SUB_POSITIONS[draft.line].includes(draft.subPosition)) {
    return `Para ${draft.line} la posición tiene que ser ${VALID_SUB_POSITIONS[draft.line].join(', ')}.`;
  }

  if (draft.photo.trim() && !/^(https?:\/\/|\/)/.test(draft.photo.trim())) {
    return 'La foto tiene que ser una URL (https://...) o una ruta local (/players/...).';
  }

  return null;
}

/**
 * Por que no se puede sacar este jugador, o null si se puede.
 *
 * Sacarlo esta prohibido cuando dejaria su sub-rol por debajo del cupo que
 * necesita el pool: ahi la partida podria volverse imposible de completar.
 */
export function getRemovalBlockReason(players: Player[], playerId: string): string | null {
  const target = players.find((player) => player.id === playerId);
  if (!target) {
    return 'Ese jugador ya no está en el plantel.';
  }

  const remaining = players.filter((player) => player.id !== playerId);
  const broken = getQuotaReport(remaining).find(
    (entry) =>
      !entry.ok && entry.line === target.line && entry.subPositions.includes(target.subPosition),
  );

  if (broken) {
    return `No podés bajar de ${broken.need} en ${broken.label}: quedarían ${broken.have} y la partida podría no completarse. Agregá otro primero.`;
  }

  return null;
}

/** Resumen para la UI: que sub-roles estan al limite o rotos. */
export function getRosterHealth(players: Player[]) {
  const quotas = getQuotaReport(players);
  return {
    quotas,
    broken: quotas.filter((entry) => !entry.ok),
    tight: quotas.filter((entry) => entry.ok && entry.have - entry.need <= 1),
  };
}

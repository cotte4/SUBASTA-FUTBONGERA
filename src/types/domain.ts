export const LINES = ['GK', 'DEF', 'MID', 'FWD'] as const;
export const SLOT_ORDER = {
  GK: ['GK'],
  DEF: ['LB', 'LCB', 'RCB', 'RB'],
  MID: ['LCM', 'CM', 'RCM'],
  FWD: ['LW', 'ST', 'RW'],
} as const;

export type Line = (typeof LINES)[number];
export type Tier = 'S' | 'A' | 'B' | 'C';
export type SlotName = (typeof SLOT_ORDER)[Line][number];

export type Player = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  photo: string;
  line: Line;
  subPosition: string;
  tier: Tier;
  basePrice: number;
};

export type PricingTable = Record<Line, Record<Tier, number>>;

export type TeamSlot = {
  slot: string;
  playerId: string | null;
  pricePaid: number | null;
};

export type Participant = {
  id: string;
  name: string;
  budget: number;
  /** Identidad del club, se elige al final de la partida. */
  teamName: string;
  logo: string;
  team: Record<Line, TeamSlot[]>;
};

/** Logos disponibles para los clubes. */
export const TEAM_LOGOS = [
  '🦁', '🐺', '🦅', '🐍', '🦈', '🐂', '🐉', '🦂',
  '👑', '💀', '⚡', '🔥', '🧿', '🎯', '🏴‍☠️', '🛸',
] as const;

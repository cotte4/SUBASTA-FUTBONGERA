export type Line = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Tier = 'S' | 'A' | 'B' | 'C';

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

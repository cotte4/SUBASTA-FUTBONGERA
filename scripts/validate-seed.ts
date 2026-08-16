/**
 * Valida el dataset de jugadores (src/data/players.ts).
 *
 * Corrélo SIEMPRE despues de agregar o editar jugadores. El tipo `subPosition`
 * es `string`, asi que un typo ('FW' en vez de 'ST') compila igual y deja al
 * jugador fuera del pool de subasta sin ningun error visible.
 *
 * Uso: npm run validate:seed
 */
import { existsSync } from 'node:fs';
import { allPlayers } from '../src/data/players';
import { pricingTable } from '../src/data/players';
import { LINES, type Line } from '../src/types/domain';

const VALID_SUBS: Record<Line, string[]> = {
  GK: ['GK'],
  DEF: ['LB', 'CB', 'RB'],
  MID: ['CM', 'CDM', 'CAM'],
  FWD: ['LW', 'ST', 'RW'],
};

const VALID_TIERS = ['S', 'A', 'B', 'C'];
const MAX_PARTICIPANTS = 6;

// Cupos que arma getLinePoolByRole() con extraPool = participantCount + 1
const POOL_RULES: Array<{ line: Line; subs: string[]; multiplier: number }> = [
  { line: 'GK', subs: ['GK'], multiplier: 1 },
  { line: 'DEF', subs: ['LB'], multiplier: 1 },
  { line: 'DEF', subs: ['CB'], multiplier: 2 },
  { line: 'DEF', subs: ['RB'], multiplier: 1 },
  { line: 'MID', subs: ['CM', 'CDM'], multiplier: 2 },
  { line: 'MID', subs: ['CAM'], multiplier: 1 },
  { line: 'FWD', subs: ['LW'], multiplier: 1 },
  { line: 'FWD', subs: ['ST'], multiplier: 1 },
  { line: 'FWD', subs: ['RW'], multiplier: 1 },
];

const errors: string[] = [];
const warnings: string[] = [];

// --- 1. Integridad de cada jugador ---
const seenIds = new Set<string>();
for (const player of allPlayers) {
  const tag = `${player.id} (${player.name})`;

  if (seenIds.has(player.id)) {
    errors.push(`${tag}: id duplicado`);
  }
  seenIds.add(player.id);

  if (!LINES.includes(player.line)) {
    errors.push(`${tag}: linea invalida "${player.line}"`);
    continue;
  }

  if (!VALID_SUBS[player.line].includes(player.subPosition)) {
    errors.push(
      `${tag}: subPosition "${player.subPosition}" no es valida para ${player.line}. ` +
        `Validas: ${VALID_SUBS[player.line].join(', ')}. ` +
        `Este jugador NUNCA entraria al pool de subasta.`,
    );
  }

  if (!VALID_TIERS.includes(player.tier)) {
    errors.push(`${tag}: tier invalido "${player.tier}"`);
  }

  const expectedPrice = pricingTable[player.line]?.[player.tier];
  if (expectedPrice !== undefined && player.basePrice !== expectedPrice) {
    errors.push(`${tag}: basePrice ${player.basePrice} no coincide con la tabla (${expectedPrice})`);
  }

  if (!existsSync(`public${player.photo}`)) {
    warnings.push(`${tag}: falta la foto public${player.photo} — corré "npm run fetch:images"`);
  }
}

// --- 2. Cupos del pool por sub-posicion ---
// El pool se arma con participantCount + 1 por rol. Si no alcanzan los
// jugadores de un sub-rol, la linea queda corta y la partida puede volverse
// imposible de completar.
const extraPool = MAX_PARTICIPANTS + 1;
const cupos: string[] = [];

for (const rule of POOL_RULES) {
  const need = extraPool * rule.multiplier;
  const have = allPlayers.filter(
    (p) => p.line === rule.line && rule.subs.includes(p.subPosition),
  ).length;
  const label = `${rule.line} ${rule.subs.join('/')}`;

  if (have < need) {
    errors.push(`Cupo insuficiente en ${label}: necesita ${need} con 6 participantes, hay ${have}`);
  } else if (have < need + 3) {
    warnings.push(`Cupo justo en ${label}: ${have} disponibles para ${need} necesarios (margen ${have - need})`);
  }
  cupos.push(`  ${label.padEnd(16)} ${String(have).padStart(3)} / ${need} necesarios`);
}

// --- Reporte ---
console.log(`\nDataset: ${allPlayers.length} jugadores\n`);
console.log('Cupos por rol (peor caso: 6 participantes):');
console.log(cupos.join('\n'));

if (warnings.length) {
  console.log(`\nAVISOS (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.log(`\nERRORES (${errors.length}):`);
  errors.forEach((e) => console.log(`  x ${e}`));
  console.log('');
  process.exit(1);
}

console.log('\nSeed valido.\n');

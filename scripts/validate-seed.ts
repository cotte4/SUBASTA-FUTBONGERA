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
import { allPlayers, pricingTable } from '../src/data/players';
import { getQuotaReport, MAX_PARTICIPANTS, VALID_SUB_POSITIONS } from '../src/lib/game';
import { LINES } from '../src/types/domain';

// Las reglas de cupo viven en src/lib/game.ts (POOL_RULES): son las mismas que
// usa el armado del pool, asi que no se duplican aca.
const VALID_SUBS = VALID_SUB_POSITIONS;
const VALID_TIERS = ['S', 'A', 'B', 'C'];

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
const cupos: string[] = [];

for (const entry of getQuotaReport(allPlayers)) {
  if (!entry.ok) {
    errors.push(
      `Cupo insuficiente en ${entry.label}: necesita ${entry.need} con ${MAX_PARTICIPANTS} participantes, hay ${entry.have}`,
    );
  } else if (entry.have < entry.need + 3) {
    warnings.push(
      `Cupo justo en ${entry.label}: ${entry.have} disponibles para ${entry.need} necesarios (margen ${entry.have - entry.need})`,
    );
  }
  cupos.push(`  ${entry.label.padEnd(16)} ${String(entry.have).padStart(3)} / ${entry.need} necesarios`);
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

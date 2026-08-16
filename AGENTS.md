# Subasta Futbolera

## Stack
- Vite
- React 19
- TypeScript
- Tailwind CSS 4
- Zod

## Project Structure
- `src/components` UI reusable
- `src/features` pantallas y bloques por flujo
- `src/state` reducer y acciones del juego
- `src/lib` helpers de pricing, storage y validaciones
- `src/data` dataset estatico
- `src/types` tipos del dominio y del estado

## Key Commands
- `npm run dev` - start dev server
- `npm run build` - build for production
- `npm run lint` - run eslint

## Important Context
- El juego corre en modo garantizado: la app no debe permitir acciones que vuelvan imposible completar la partida.
- `SKIP` debe bloquearse cuando los jugadores restantes de una linea sean exactamente los slots pendientes de esa linea.
- La asignacion de slots es flexible por linea: `DEF`, `MID` y `FWD` pueden ir a cualquier slot de su linea.
- El MVP usa `localStorage` y un codigo de reanudacion local; no hay multi-device real.

## Seed de jugadores
- La fuente de verdad es `src/data/players.ts`. `src/data/players.json` esta muerto: nadie lo importa.
- `subPosition` esta tipado como `string`: un typo compila igual y deja al jugador fuera del pool sin error. Validas: GK / LB,CB,RB / CM,CDM,CAM / LW,ST,RW.
- El pool toma `participantCount + 1` por sub-rol (CB y CM/CDM al doble). Si un sub-rol queda corto, la partida puede volverse imposible.
- Despues de tocar el seed: `npm run validate:seed`, `npm run fetch:images`, `npm run simulate 300`.
- `basePrice` sale de `pricingTable`, nunca se escribe a mano. Si cambias precios, revisa `floorPriceByLine` en `src/lib/game.ts` (hoy espeja el tier C de cada linea).

## Workflow
- Siempre leer el PRD antes de implementar features nuevas.
- Mantener el reducer y las validaciones del dominio separados de la UI.
- Priorizar el flujo MVP: setup, auction, teams y results.
- Commit por feature cerrada, no por archivo individual.

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

## Workflow
- Siempre leer el PRD antes de implementar features nuevas.
- Mantener el reducer y las validaciones del dominio separados de la UI.
- Priorizar el flujo MVP: setup, auction, teams y results.
- Commit por feature cerrada, no por archivo individual.

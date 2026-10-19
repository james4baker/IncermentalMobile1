import { AREAS, type AreaDef } from '../data/areas';
import type { GameState } from './state';

export function areaById(areaId: string): AreaDef | undefined {
  return AREAS.find((a) => a.id === areaId);
}

/** The first area is always open; each later area opens once the previous area's boss is defeated. */
export function isAreaUnlocked(state: GameState, areaId: string): boolean {
  const index = AREAS.findIndex((a) => a.id === areaId);
  if (index <= 0) return index === 0;
  return state.bossesDefeated.includes(AREAS[index - 1]!.id);
}

/** The area unlocked by beating this area's boss, if any. */
export function nextArea(areaId: string): AreaDef | undefined {
  const index = AREAS.findIndex((a) => a.id === areaId);
  return index >= 0 ? AREAS[index + 1] : undefined;
}

/** The area just before this one, if any. */
export function previousArea(areaId: string): AreaDef | undefined {
  const index = AREAS.findIndex((a) => a.id === areaId);
  return index > 0 ? AREAS[index - 1] : undefined;
}

export function keysHeld(state: GameState, areaId: string): number {
  return state.keys[areaId] ?? 0;
}

export function spendKey(state: GameState, areaId: string): boolean {
  if (keysHeld(state, areaId) < 1) return false;
  state.keys[areaId] = keysHeld(state, areaId) - 1;
  return true;
}

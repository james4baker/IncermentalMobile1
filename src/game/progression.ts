import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId } from '../config';
import { AREAS, type AreaDef } from '../data/areas';
import type { GameState } from './state';

export function currentArea(state: GameState): AreaDef {
  return AREAS.find((a) => a.id === state.areaId) ?? AREAS[0]!;
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

export function keysHeld(state: GameState, areaId: string): number {
  return state.keys[areaId] ?? 0;
}

export function spawn(state: GameState, creatureId: CreatureId): void {
  state.creatureId = creatureId;
  state.creatureHp = new Decimal(CONFIG.creatures[creatureId].maxHp);
}

/** Travel to an unlocked area. Not allowed mid boss fight. */
export function selectArea(state: GameState, areaId: string): boolean {
  if (state.inLair || areaId === state.areaId || !isAreaUnlocked(state, areaId)) return false;
  const area = AREAS.find((a) => a.id === areaId)!;
  state.areaId = area.id;
  spawn(state, area.creatures[0]!);
  return true;
}

/** Spend one key to fight the current area's boss. */
export function enterLair(state: GameState): boolean {
  const area = currentArea(state);
  if (state.inLair || keysHeld(state, area.id) < 1) return false;
  state.keys[area.id] = keysHeld(state, area.id) - 1;
  state.inLair = true;
  spawn(state, area.boss);
  return true;
}

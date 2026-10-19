import { CONFIG, type CreatureId, type ItemId } from '../config';
import { AREAS } from '../data/areas';
import type { GameState } from './state';

/** Every creature in area order: lesser creatures first, then the boss. */
export function allCreatures(): CreatureId[] {
  return AREAS.flatMap((a) => [...a.creatures, a.boss]);
}

/** Unique items in a creature's loot table, in table order. */
export function lootItems(creatureId: CreatureId): ItemId[] {
  return [...new Set(CONFIG.loot[creatureId].map((e) => e.item))];
}

export function killCount(state: GameState, creatureId: CreatureId): number {
  return state.killCounts[creatureId] ?? 0;
}

export function dropCount(state: GameState, creatureId: CreatureId, itemId: ItemId): number {
  return state.drops[creatureId]?.[itemId] ?? 0;
}

/** Record a kill and its drops. Returns items this creature dropped for the first time. */
export function recordKill(state: GameState, creatureId: CreatureId, itemIds: ItemId[]): ItemId[] {
  state.killCounts[creatureId] = killCount(state, creatureId) + 1;
  const firsts: ItemId[] = [];
  const log = (state.drops[creatureId] ??= {});
  for (const id of itemIds) {
    if (!log[id]) firsts.push(id);
    log[id] = (log[id] ?? 0) + 1;
  }
  return firsts;
}

export interface CollectionProgress {
  monstersDefeated: number;
  monstersTotal: number;
  /** One slot per item per creature that drops it. */
  slotsFound: number;
  slotsTotal: number;
}

export function collectionProgress(state: GameState): CollectionProgress {
  const p: CollectionProgress = { monstersDefeated: 0, monstersTotal: 0, slotsFound: 0, slotsTotal: 0 };
  for (const c of allCreatures()) {
    p.monstersTotal++;
    if (killCount(state, c) > 0) p.monstersDefeated++;
    for (const item of lootItems(c)) {
      p.slotsTotal++;
      if (dropCount(state, c, item) > 0) p.slotsFound++;
    }
  }
  return p;
}

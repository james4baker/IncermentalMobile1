import { CONFIG, type CreatureId, type ItemId } from '../config';

/** Roll a creature's drop table. Each entry is rolled independently. */
export function rollLoot(creatureId: CreatureId, rng: () => number = Math.random): ItemId[] {
  const drops: ItemId[] = [];
  for (const entry of CONFIG.loot[creatureId]) {
    if (rng() < entry.chance) drops.push(entry.item);
  }
  return drops;
}

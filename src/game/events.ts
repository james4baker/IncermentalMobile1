import type Decimal from 'break_infinity.js';
import type { CreatureId, ItemId } from '../config';

/** Things that happened during a tick, for the UI to react to. Positions are in arena units. */
export type GameEvent =
  | { type: 'damage'; amount: Decimal; source: 'auto' | 'tap'; double: boolean; x: number; y: number }
  | { type: 'swing'; fromX: number; fromY: number; toX: number; toY: number }
  | { type: 'tap'; x: number; y: number }
  | { type: 'kill'; creatureId: CreatureId; gold: Decimal; xp: Decimal; x: number; y: number }
  | { type: 'loot'; itemIds: ItemId[] }
  | { type: 'firstKill'; creatureId: CreatureId }
  | { type: 'collection'; creatureId: CreatureId; itemIds: ItemId[] }
  | { type: 'key'; areaId: string }
  | { type: 'levelUp'; level: number }
  | { type: 'bossDefeated'; areaId: string; unlockedAreaId?: string }
  | { type: 'runEnded' };

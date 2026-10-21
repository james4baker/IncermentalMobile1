import type Decimal from 'break_infinity.js';
import type { CreatureId, ItemId } from '../config';
import type { ItemInstance } from './state';

/** Things that happened during a tick, for the UI to react to. Positions are in arena units. */
export type GameEvent =
  | { type: 'damage'; amount: Decimal; source: 'auto' | 'tap' | 'tile'; double: boolean; x: number; y: number }
  | { type: 'swing'; fromX: number; fromY: number; toX: number; toY: number }
  | { type: 'tap'; x: number; y: number; radius: number }
  | { type: 'kill'; creatureId: CreatureId; gold: Decimal; xp: Decimal; x: number; y: number }
  | { type: 'loot'; items: ItemInstance[] }
  | { type: 'firstKill'; creatureId: CreatureId }
  | { type: 'collection'; creatureId: CreatureId; itemIds: ItemId[] }
  | { type: 'key'; areaId: string }
  | { type: 'levelUp'; level: number }
  | { type: 'playerHit'; livesLeft: number; x: number; y: number }
  | { type: 'bossDefeated'; areaId: string; unlockedAreaId?: string }
  | { type: 'runEnded' };

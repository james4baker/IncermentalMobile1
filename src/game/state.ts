import Decimal from 'break_infinity.js';
import type { CreatureId, ItemId } from '../config';

export const EQUIP_SLOTS = ['head', 'chest', 'hands', 'legs', 'ring1', 'ring2', 'necklace'] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

/** One owned item. uid keeps identical items distinct (affixes will make them differ later). */
export interface ItemInstance {
  uid: number;
  itemId: ItemId;
}

export interface ShopOffer {
  itemId: ItemId;
  sold: boolean;
}

export type RunKind = 'hunt' | 'boss';

export interface Enemy {
  id: number;
  creatureId: CreatureId;
  isBoss: boolean;
  hp: Decimal;
  maxHp: Decimal;
  x: number;
  y: number;
  /** Wander direction in radians. */
  heading: number;
  /** Seconds until the next change of direction. */
  wanderTimer: number;
}

/** Totals for the results screen. Rewards are applied to the game state as they happen. */
export interface RunLoot {
  gold: Decimal;
  xp: Decimal;
  kills: number;
  items: ItemId[];
  keys: number;
  bossesDefeated: number;
}

/** One trip into an arena. Not saved: closing the app ends the run (loot is already kept). */
export interface RunState {
  kind: RunKind;
  areaId: string;
  /** Run length in seconds; null = no time limit (boss rooms, for now). */
  duration: number | null;
  elapsed: number;
  startLevel: number;
  player: {
    x: number;
    y: number;
    /** Set by the Move command; the player walks here, then goes back to hunting. */
    moveTarget: { x: number; y: number } | null;
    targetId: number | null;
    /** Seconds until the next auto-attack is ready. */
    cooldown: number;
  };
  enemies: Enemy[];
  nextEnemyId: number;
  spawnTimer: number;
  loot: RunLoot;
  ended: boolean;
  endReason: 'time' | 'left' | 'cleared' | null;
}

export interface GameState {
  gold: Decimal;
  xp: Decimal;
  kills: number;
  /** Boss keys held, by area id. */
  keys: Record<string, number>;
  /** Area ids whose boss has been defeated at least once. */
  bossesDefeated: string[];
  /** Unequipped items. */
  inventory: ItemInstance[];
  equipment: Record<EquipSlot, ItemInstance | null>;
  nextItemUid: number;
  shop: { offers: ShopOffer[]; refreshedAt: number };
  /** Collection log: kills per creature. */
  killCounts: Partial<Record<CreatureId, number>>;
  /** Collection log: how many of each item each creature has dropped. */
  drops: Partial<Record<CreatureId, Partial<Record<ItemId, number>>>>;
  /** The current arena run, if any. */
  run: RunState | null;
}

export function emptyEquipment(): Record<EquipSlot, ItemInstance | null> {
  return { head: null, chest: null, hands: null, legs: null, ring1: null, ring2: null, necklace: null };
}

export function createInitialState(): GameState {
  return {
    gold: new Decimal(0),
    xp: new Decimal(0),
    kills: 0,
    keys: {},
    bossesDefeated: [],
    inventory: [],
    equipment: emptyEquipment(),
    nextItemUid: 1,
    // refreshedAt 0 makes the shop stock itself on the first frame.
    shop: { offers: [], refreshedAt: 0 },
    killCounts: {},
    drops: {},
    run: null,
  };
}

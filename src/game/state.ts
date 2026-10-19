import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId, type ItemId } from '../config';
import { AREAS } from '../data/areas';

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

export interface GameState {
  gold: Decimal;
  xp: Decimal;
  areaId: string;
  creatureId: CreatureId;
  creatureHp: Decimal;
  /** True while fighting the current area's boss. */
  inLair: boolean;
  /** Seconds accumulated toward the next auto-attack. */
  attackProgress: number;
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
}

export function emptyEquipment(): Record<EquipSlot, ItemInstance | null> {
  return { head: null, chest: null, hands: null, legs: null, ring1: null, ring2: null, necklace: null };
}

export function createInitialState(): GameState {
  const area = AREAS[0]!;
  const creatureId = area.creatures[0]!;
  return {
    gold: new Decimal(0),
    xp: new Decimal(0),
    areaId: area.id,
    creatureId,
    creatureHp: new Decimal(CONFIG.creatures[creatureId].maxHp),
    inLair: false,
    attackProgress: 0,
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
  };
}

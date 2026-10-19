import Decimal from 'break_infinity.js';
import { CONFIG, type ItemId } from '../config';
import { ITEMS, type ItemSlot } from '../data/items';
import { itemValue } from './affixes';
import type { EquipSlot, GameState, ItemInstance } from './state';

export function addItem(state: GameState, itemId: ItemId, affixes: Pick<ItemInstance, 'prefix' | 'suffix'> = {}): ItemInstance {
  const item: ItemInstance = { uid: state.nextItemUid++, itemId, ...affixes };
  state.inventory.push(item);
  return item;
}

/** Items with the same base and the same affixes are interchangeable, so the bag groups them. */
export function groupKey(item: ItemInstance): string {
  const a = (r: ItemInstance['prefix']) => (r ? `${r.affixId}:${r.tier}` : '-');
  return `${item.itemId}|${a(item.prefix)}|${a(item.suffix)}`;
}

/** Which equipment slots an item of this type can go in. */
export function slotsFor(slot: ItemSlot): EquipSlot[] {
  return slot === 'ring' ? ['ring1', 'ring2'] : [slot];
}

/** Equip an inventory item. Whatever was in the slot goes back to the inventory. */
export function equip(state: GameState, uid: number, target?: EquipSlot): boolean {
  const index = state.inventory.findIndex((i) => i.uid === uid);
  if (index < 0) return false;
  const item = state.inventory[index]!;
  const allowed = slotsFor(ITEMS[item.itemId].slot);
  // Default target: the first empty allowed slot, else the first allowed slot.
  const slot = target ?? allowed.find((s) => state.equipment[s] === null) ?? allowed[0]!;
  if (!allowed.includes(slot)) return false;

  state.inventory.splice(index, 1);
  const previous = state.equipment[slot];
  if (previous) state.inventory.push(previous);
  state.equipment[slot] = item;
  return true;
}

export function unequip(state: GameState, slot: EquipSlot): boolean {
  const item = state.equipment[slot];
  if (!item) return false;
  state.equipment[slot] = null;
  state.inventory.push(item);
  return true;
}

export function sellPrice(item: ItemInstance): Decimal {
  return new Decimal(Math.floor(itemValue(item) * CONFIG.shop.sellFraction));
}

/** Sell every unequipped item matching the predicate. Returns gold gained. */
function sellWhere(state: GameState, pred: (item: ItemInstance) => boolean): Decimal {
  let gained = new Decimal(0);
  state.inventory = state.inventory.filter((item) => {
    if (!pred(item)) return true;
    gained = gained.add(sellPrice(item));
    return false;
  });
  state.gold = state.gold.add(gained);
  return gained;
}

/** Sell one unequipped item. */
export function sell(state: GameState, uid: number): boolean {
  const before = state.inventory.length;
  sellWhere(state, (i) => i.uid === uid);
  return state.inventory.length < before;
}

/** Sell every unequipped item in a group (same base and affixes). */
export function sellGroup(state: GameState, key: string): Decimal {
  return sellWhere(state, (i) => groupKey(i) === key);
}

/** Sell everything in the bag (equipped items are kept). */
export function sellBag(state: GameState): Decimal {
  return sellWhere(state, () => true);
}

/** Gold the whole bag would sell for. */
export function bagValue(state: GameState): Decimal {
  return state.inventory.reduce((sum, i) => sum.add(sellPrice(i)), new Decimal(0));
}

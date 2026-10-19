import Decimal from 'break_infinity.js';
import { CONFIG, itemBalance, type ItemId } from '../config';
import { ITEMS, type ItemSlot } from '../data/items';
import { EQUIP_SLOTS, type EquipSlot, type GameState, type ItemInstance } from './state';

export interface GearBonuses {
  damagePct: number;
  speedPct: number;
  doubleHitPct: number;
}

export function addItem(state: GameState, itemId: ItemId): ItemInstance {
  const item = { uid: state.nextItemUid++, itemId };
  state.inventory.push(item);
  return item;
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

export function sellPrice(itemId: ItemId): Decimal {
  return new Decimal(Math.floor(itemBalance(itemId).value * CONFIG.shop.sellFraction));
}

/** Sell an unequipped item. */
export function sell(state: GameState, uid: number): boolean {
  const index = state.inventory.findIndex((i) => i.uid === uid);
  if (index < 0) return false;
  const [item] = state.inventory.splice(index, 1);
  state.gold = state.gold.add(sellPrice(item!.itemId));
  return true;
}

export function gearBonuses(state: GameState): GearBonuses {
  const total: GearBonuses = { damagePct: 0, speedPct: 0, doubleHitPct: 0 };
  for (const slot of EQUIP_SLOTS) {
    const item = state.equipment[slot];
    if (!item) continue;
    const b = itemBalance(item.itemId);
    total.damagePct += b.damagePct;
    total.speedPct += b.speedPct;
    total.doubleHitPct += b.doubleHitPct ?? 0;
  }
  return total;
}

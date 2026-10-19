import Decimal from 'break_infinity.js';
import { CONFIG, itemBalance, type ItemId } from '../config';
import { SHOP_POOLS } from '../data/shop';
import { addItem } from './items';
import type { GameState } from './state';

/** Every item the shop can currently stock, given which bosses are defeated. */
export function shopPool(state: GameState): ItemId[] {
  const pool = new Set<ItemId>();
  for (const p of SHOP_POOLS) {
    if (p.unlockedBy === null || state.bossesDefeated.includes(p.unlockedBy)) {
      for (const id of p.items) pool.add(id);
    }
  }
  return [...pool];
}

/** Restock with random items from the pool (no duplicates while the pool is big enough). */
export function refreshShop(state: GameState, now: number, rng: () => number = Math.random): void {
  const remaining = shopPool(state);
  const offers = [];
  for (let i = 0; i < CONFIG.shop.slots && remaining.length > 0; i++) {
    const [itemId] = remaining.splice(Math.floor(rng() * remaining.length), 1);
    offers.push({ itemId: itemId!, sold: false });
  }
  state.shop = { offers, refreshedAt: now };
}

/** Restock if the refresh interval has passed. */
export function updateShop(state: GameState, now: number): void {
  if (now - state.shop.refreshedAt >= CONFIG.shop.refreshMs || now < state.shop.refreshedAt) {
    refreshShop(state, now);
  }
}

export function msUntilRefresh(state: GameState, now: number): number {
  return Math.max(0, state.shop.refreshedAt + CONFIG.shop.refreshMs - now);
}

export function buyPrice(itemId: ItemId): Decimal {
  return new Decimal(itemBalance(itemId).value);
}

export function buy(state: GameState, offerIndex: number): boolean {
  const offer = state.shop.offers[offerIndex];
  if (!offer || offer.sold) return false;
  const price = buyPrice(offer.itemId);
  if (state.gold.lt(price)) return false;
  state.gold = state.gold.sub(price);
  offer.sold = true;
  addItem(state, offer.itemId);
  return true;
}

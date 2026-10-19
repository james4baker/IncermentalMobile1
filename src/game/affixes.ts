import Decimal from 'break_infinity.js';
import { CONFIG, itemBalance, STAT_KEYS, type AffixId, type CreatureId, type ItemId, type StatKey } from '../config';
import { AFFIXES, type AffixSlot } from '../data/affixes';
import { AREAS } from '../data/areas';
import { EQUIP_SLOTS, type AffixRoll, type GameState, type ItemInstance } from './state';

const C = CONFIG.affixes;
export const MAX_TIER = 5;

export type Stats = Record<StatKey, number>;

export function emptyStats(): Stats {
  return Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
}

function addInto(total: Stats, add: Partial<Stats>): void {
  for (const k of STAT_KEYS) total[k] += add[k] ?? 0;
}

/** What one affix roll gives. */
export function affixStats(roll: AffixRoll): Partial<Stats> {
  const values = CONFIG.affixValues[roll.affixId] as Partial<Record<StatKey, readonly number[]>>;
  const tierIndex = Math.min(MAX_TIER, Math.max(1, roll.tier)) - 1;
  const out: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const v = values[k]?.[tierIndex];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Base item bonuses plus both affixes. */
export function itemStats(item: ItemInstance): Stats {
  const b = itemBalance(item.itemId);
  const total = emptyStats();
  total.damagePct += b.damagePct;
  total.speedPct += b.speedPct;
  total.doubleHitPct += b.doubleHitPct ?? 0;
  if (item.prefix) addInto(total, affixStats(item.prefix));
  if (item.suffix) addInto(total, affixStats(item.suffix));
  return total;
}

/** Sum of every equipped item's stats. */
export function equippedStats(state: GameState): Stats {
  const total = emptyStats();
  for (const slot of EQUIP_SLOTS) {
    const item = state.equipment[slot];
    if (item) addInto(total, itemStats(item));
  }
  return total;
}

/** Item value including affix tiers (drives sell price). */
export function itemValue(item: ItemInstance): number {
  const tiers = (item.prefix?.tier ?? 0) + (item.suffix?.tier ?? 0);
  return itemBalance(item.itemId).value * (1 + tiers * C.valuePerTier);
}

// --- Rolling ---

function areaIndexOf(creatureId: CreatureId): number {
  const i = AREAS.findIndex((a) => a.boss === creatureId || a.creatures.includes(creatureId));
  return Math.max(0, i);
}

function isBoss(creatureId: CreatureId): boolean {
  return AREAS.some((a) => a.boss === creatureId);
}

function rollTier(creatureId: CreatureId, rng: () => number): number {
  let tier = 1 + areaIndexOf(creatureId) + (isBoss(creatureId) ? C.bossTierBonus : 0);
  const r = rng();
  if (r < C.tierUpChance) tier += 1;
  else if (r < C.tierUpChance + C.tierDownChance) tier -= 1;
  return Math.min(MAX_TIER, Math.max(1, tier));
}

const ALL_AFFIX_IDS = Object.keys(AFFIXES) as AffixId[];

function pick<T>(list: T[], rng: () => number): T | undefined {
  return list.length ? list[Math.floor(rng() * list.length)] : undefined;
}

/** Choose which affix fills a slot: item-specific first, then boss-specific, else a generic one. */
function chooseAffix(slot: AffixSlot, itemId: ItemId, creatureId: CreatureId, rng: () => number): AffixId | undefined {
  const forSlot = ALL_AFFIX_IDS.filter((id) => AFFIXES[id].slot === slot);
  const itemSpecific = forSlot.find((id) => {
    const s = AFFIXES[id].source;
    return s.kind === 'item' && s.itemId === itemId;
  });
  if (itemSpecific && rng() < C.itemAffixChance) return itemSpecific;
  const bossSpecific = forSlot.find((id) => {
    const s = AFFIXES[id].source;
    return s.kind === 'boss' && s.creatureId === creatureId;
  });
  if (bossSpecific && rng() < C.bossAffixChance) return bossSpecific;
  return pick(forSlot.filter((id) => AFFIXES[id].source.kind === 'generic'), rng);
}

/** Roll affixes for an item dropped by a creature. Each slot may stay empty. */
export function rollAffixes(itemId: ItemId, creatureId: CreatureId, rng: () => number = Math.random): Pick<ItemInstance, 'prefix' | 'suffix'> {
  const out: Pick<ItemInstance, 'prefix' | 'suffix'> = {};
  for (const slot of ['prefix', 'suffix'] as const) {
    if (rng() >= (slot === 'prefix' ? C.prefixChance : C.suffixChance)) continue;
    const affixId = chooseAffix(slot, itemId, creatureId, rng);
    if (affixId) out[slot] = { affixId, tier: rollTier(creatureId, rng) };
  }
  return out;
}

// --- Forge ---

/** Find an owned item (bag or equipped) by uid. */
export function findItem(state: GameState, uid: number): ItemInstance | undefined {
  return state.inventory.find((i) => i.uid === uid) ?? EQUIP_SLOTS.map((s) => state.equipment[s]).find((i) => i?.uid === uid) ?? undefined;
}

/** Destroy a bag item, keeping one of its affixes in the stash. The other affix is lost. */
export function dismantle(state: GameState, uid: number, keep: AffixSlot): boolean {
  const index = state.inventory.findIndex((i) => i.uid === uid);
  const item = state.inventory[index];
  const roll = item?.[keep];
  if (!item || !roll) return false;
  state.inventory.splice(index, 1);
  state.affixStash.push({ ...roll });
  return true;
}

export function mountCost(roll: AffixRoll, target: ItemInstance): Decimal {
  const M = C.mount;
  const slot = AFFIXES[roll.affixId].slot;
  const otherFilled = slot === 'prefix' ? !!target.suffix : !!target.prefix;
  const tierMult = M.tierMultipliers[Math.min(MAX_TIER, Math.max(1, roll.tier)) - 1]!;
  const valueMult = 1 + Math.sqrt(itemBalance(target.itemId).value) / M.valueDivisor;
  return new Decimal(Math.ceil(M.base * tierMult * valueMult * (otherFilled ? M.filledMultiplier : 1)));
}

/** Mount a stashed affix onto an item (bag or equipped), replacing whatever was in that slot. */
export function mount(state: GameState, stashIndex: number, targetUid: number): boolean {
  const roll = state.affixStash[stashIndex];
  const target = findItem(state, targetUid);
  if (!roll || !target) return false;
  const cost = mountCost(roll, target);
  if (state.gold.lt(cost)) return false;
  state.gold = state.gold.sub(cost);
  state.affixStash.splice(stashIndex, 1);
  target[AFFIXES[roll.affixId].slot] = { ...roll };
  return true;
}

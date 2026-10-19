// ALL balance numbers live here. Placeholder values; tune freely.

/** Bonuses an item gives while equipped, in percent (0.5 = +0.5%). value = shop price; sells for value * shop.sellFraction. */
export interface ItemBalance {
  damagePct: number;
  speedPct: number;
  doubleHitPct?: number;
  value: number;
}

const ITEMS = {
  // Torn leather (rats, starter shop)
  tornLeatherCap: { damagePct: 0.5, speedPct: 0.3, value: 20 },
  tornLeatherVest: { damagePct: 0.8, speedPct: 0.4, value: 30 },
  tornLeatherGloves: { damagePct: 0.3, speedPct: 0.8, value: 20 },
  tornLeatherTrousers: { damagePct: 0.6, speedPct: 0.4, value: 25 },
  // Chain (goblins, shop after Rat Queen)
  chainCoif: { damagePct: 2, speedPct: 1.2, value: 200 },
  chainHauberk: { damagePct: 3.5, speedPct: 1.5, value: 320 },
  chainGauntlets: { damagePct: 1.5, speedPct: 3, value: 220 },
  chainLeggings: { damagePct: 2.5, speedPct: 1.5, value: 260 },
  // Jewellery
  copperRing: { damagePct: 0.5, speedPct: 0.5, value: 40 },
  silverRing: { damagePct: 1.5, speedPct: 1.5, value: 300 },
  goldRing: { damagePct: 4, speedPct: 4, value: 1500 },
  boneCharm: { damagePct: 0.5, speedPct: 0.5, value: 35 },
  jadeAmulet: { damagePct: 3, speedPct: 3, value: 1200 },
  // Uniques
  ratTeethNecklace: { damagePct: 3, speedPct: 1, doubleHitPct: 10, value: 400 },
} satisfies Record<string, ItemBalance>;

export type ItemId = keyof typeof ITEMS;

export interface LootEntry {
  item: ItemId;
  /** Chance per kill (0..1). Each entry is rolled independently. */
  chance: number;
}

const CREATURES = {
  rat: { maxHp: 10, gold: 1, xp: 8, keyChance: 1 / 30 },
  ratQueen: { maxHp: 300, gold: 25, xp: 160, keyChance: 0 },
  goblin: { maxHp: 40, gold: 3, xp: 20, keyChance: 1 / 30 },
  goblinLord: { maxHp: 1500, gold: 100, xp: 600, keyChance: 0 },
};

export type CreatureId = keyof typeof CREATURES;

const LOOT = {
  rat: [
    { item: 'tornLeatherCap', chance: 1 / 60 },
    { item: 'tornLeatherVest', chance: 1 / 60 },
    { item: 'tornLeatherGloves', chance: 1 / 60 },
    { item: 'tornLeatherTrousers', chance: 1 / 60 },
  ],
  ratQueen: [
    { item: 'ratTeethNecklace', chance: 0.2 },
    { item: 'tornLeatherVest', chance: 0.5 },
    { item: 'tornLeatherTrousers', chance: 0.5 },
  ],
  goblin: [
    { item: 'chainCoif', chance: 1 / 80 },
    { item: 'chainHauberk', chance: 1 / 80 },
    { item: 'chainGauntlets', chance: 1 / 80 },
    { item: 'chainLeggings', chance: 1 / 80 },
  ],
  goblinLord: [
    { item: 'chainCoif', chance: 0.3 },
    { item: 'chainHauberk', chance: 0.3 },
    { item: 'chainGauntlets', chance: 0.3 },
    { item: 'chainLeggings', chance: 0.3 },
  ],
} satisfies Record<CreatureId, LootEntry[]>;

export const CONFIG = {
  player: {
    /** Damage per auto-attack at level 1. */
    baseDamage: 2,
    /** Flat damage added per level above 1. */
    damagePerLevel: 1,
    /** Auto-attacks per second at level 1. */
    attacksPerSecond: 1,
    /** Attack speed added per level above 1, as a fraction of base (0.05 = +5%). */
    attackSpeedPerLevel: 0.05,
    /** Attack speed never exceeds this many attacks per second. */
    maxAttacksPerSecond: 10,
    /** Tap damage as a multiple of auto-attack damage. */
    tapDamageMultiplier: 1,
  },

  /** RuneScape-style XP curve: xp(L) = floor(sum_{n=1}^{L-1} floor(n + base * 2^(n / doublingLevels)) / divisor). */
  levels: {
    maxLevel: 999,
    base: 300,
    doublingLevels: 7,
    divisor: 4,
  },

  /**
   * Per-creature balance, keyed by creature id from data/creatures.ts.
   * keyChance: chance per kill to drop the area boss's key (lesser creatures only).
   */
  creatures: CREATURES,

  /** Drop tables per creature. */
  loot: LOOT,

  /** Item bonuses and values, keyed by item id from data/items.ts. */
  items: ITEMS,

  shop: {
    /** Number of items on offer at once. */
    slots: 5,
    /** Automatic restock interval. */
    refreshMs: 60 * 60 * 1000,
    /** Fraction of an item's value received when selling. */
    sellFraction: 0.25,
  },

  tick: {
    /** Largest delta (seconds) simulated in one frame. Stops huge jumps after the tab sleeps. */
    maxDeltaSeconds: 1,
  },

  save: {
    key: 'incremental1.save',
    version: 4,
    intervalMs: 5000,
  },
} as const;

export function itemBalance(id: ItemId): ItemBalance {
  return CONFIG.items[id];
}

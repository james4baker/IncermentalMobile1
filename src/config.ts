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
  // Spectral (ghosts, shop after Lich King)
  spectralHood: { damagePct: 4, speedPct: 2.5, value: 900 },
  spectralRobe: { damagePct: 6, speedPct: 3, value: 1400 },
  spectralGrips: { damagePct: 3, speedPct: 5.5, value: 1000 },
  spectralLeggings: { damagePct: 4.5, speedPct: 3, value: 1150 },
  // Runic (constructs, shop after Colossus Construct)
  runicHelm: { damagePct: 8, speedPct: 5, value: 4000 },
  runicCuirass: { damagePct: 12, speedPct: 6, value: 6000 },
  runicGauntlets: { damagePct: 6, speedPct: 11, value: 4500 },
  runicGreaves: { damagePct: 9, speedPct: 6, value: 5000 },
  // Dragonscale (green dragons, shop after Dragonia)
  dragonscaleHelm: { damagePct: 16, speedPct: 10, value: 20000 },
  dragonscaleMail: { damagePct: 24, speedPct: 12, value: 30000 },
  dragonscaleGloves: { damagePct: 12, speedPct: 22, value: 22000 },
  dragonscaleLegs: { damagePct: 18, speedPct: 12, value: 25000 },
  // Jewellery
  copperRing: { damagePct: 0.5, speedPct: 0.5, value: 40 },
  silverRing: { damagePct: 1.5, speedPct: 1.5, value: 300 },
  goldRing: { damagePct: 4, speedPct: 4, value: 1500 },
  platinumRing: { damagePct: 8, speedPct: 8, value: 6000 },
  boneCharm: { damagePct: 0.5, speedPct: 0.5, value: 35 },
  jadeAmulet: { damagePct: 3, speedPct: 3, value: 1200 },
  // Uniques
  ratTeethNecklace: { damagePct: 3, speedPct: 1, doubleHitPct: 10, value: 400 },
  lichPhylactery: { damagePct: 8, speedPct: 4, doubleHitPct: 15, value: 3000 },
  heartOfTheColossus: { damagePct: 12, speedPct: 8, doubleHitPct: 5, value: 12000 },
  eyeOfDragonia: { damagePct: 20, speedPct: 15, doubleHitPct: 20, value: 60000 },
} satisfies Record<string, ItemBalance>;

export type ItemId = keyof typeof ITEMS;

/** Every stat gear and affixes can boost. Percentages are in percent (5 = +5%); runSeconds is flat seconds. */
export const STAT_KEYS = [
  'damagePct',
  'speedPct',
  'doubleHitPct',
  'goldPct',
  'xpPct',
  'runSeconds',
  'tapDamagePct',
  'tapRadiusPct',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

/** Affix values per tier (index 0 = tier I ... 4 = tier V). An affix can boost several stats. */
export type AffixBalance = Partial<Record<StatKey, readonly [number, number, number, number, number]>>;

const AFFIXES = {
  // Generic prefixes
  vicious: { damagePct: [1, 2.5, 5, 9, 15] },
  hasty: { speedPct: [1, 2, 4, 7, 12] },
  gilded: { goldPct: [5, 10, 20, 35, 60] },
  wise: { xpPct: [5, 10, 20, 35, 60] },
  crushing: { tapDamagePct: [10, 25, 50, 90, 150] },
  // Generic suffixes
  ofMight: { damagePct: [1, 2.5, 5, 9, 15] },
  ofSwiftness: { speedPct: [1, 2, 4, 7, 12] },
  ofTwinStrikes: { doubleHitPct: [1, 2, 3, 5, 8] },
  ofFortune: { goldPct: [5, 10, 20, 35, 60] },
  ofLearning: { xpPct: [5, 10, 20, 35, 60] },
  ofEndurance: { runSeconds: [2, 4, 7, 11, 16] },
  ofReach: { tapRadiusPct: [5, 10, 15, 22, 30] },
  // Boss-specific
  verminous: { speedPct: [2, 4, 7, 11, 16], goldPct: [10, 20, 35, 55, 80] },
  ofTheWarband: { damagePct: [2, 4, 7, 12, 18], tapDamagePct: [20, 40, 70, 110, 170] },
  lichTouched: { xpPct: [10, 20, 35, 55, 80], runSeconds: [3, 6, 10, 15, 22] },
  ofTheColossus: { damagePct: [3, 5, 9, 14, 22], tapRadiusPct: [8, 14, 20, 28, 38] },
  dragonias: { damagePct: [4, 7, 12, 18, 28], speedPct: [3, 5, 9, 14, 20], doubleHitPct: [2, 3, 5, 7, 10] },
  // Item-specific
  gnawing: { damagePct: [3, 5, 9, 14, 20], doubleHitPct: [2, 4, 6, 9, 13] },
  ofUndeath: { xpPct: [15, 30, 50, 75, 110], runSeconds: [4, 8, 13, 19, 27] },
  titanic: { tapDamagePct: [30, 60, 100, 160, 250], tapRadiusPct: [10, 18, 26, 35, 45] },
  ofTheBlackFlame: { damagePct: [5, 9, 15, 23, 35], doubleHitPct: [3, 5, 8, 11, 15] },
} satisfies Record<string, AffixBalance>;

export type AffixId = keyof typeof AFFIXES;

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
  ghost: { maxHp: 130, gold: 8, xp: 50, keyChance: 1 / 30 },
  lichKing: { maxHp: 3000, gold: 300, xp: 1800, keyChance: 0 },
  construct: { maxHp: 300, gold: 25, xp: 200, keyChance: 1 / 30 },
  colossusConstruct: { maxHp: 8500, gold: 1200, xp: 7000, keyChance: 0 },
  greenDragon: { maxHp: 750, gold: 80, xp: 900, keyChance: 1 / 30 },
  dragonia: { maxHp: 32000, gold: 6000, xp: 40000, keyChance: 0 },
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
  ghost: [
    { item: 'spectralHood', chance: 1 / 90 },
    { item: 'spectralRobe', chance: 1 / 90 },
    { item: 'spectralGrips', chance: 1 / 90 },
    { item: 'spectralLeggings', chance: 1 / 90 },
  ],
  lichKing: [
    { item: 'lichPhylactery', chance: 0.15 },
    { item: 'spectralHood', chance: 0.3 },
    { item: 'spectralRobe', chance: 0.3 },
    { item: 'spectralGrips', chance: 0.3 },
    { item: 'spectralLeggings', chance: 0.3 },
  ],
  construct: [
    { item: 'runicHelm', chance: 1 / 100 },
    { item: 'runicCuirass', chance: 1 / 100 },
    { item: 'runicGauntlets', chance: 1 / 100 },
    { item: 'runicGreaves', chance: 1 / 100 },
  ],
  colossusConstruct: [
    { item: 'heartOfTheColossus', chance: 0.12 },
    { item: 'runicHelm', chance: 0.3 },
    { item: 'runicCuirass', chance: 0.3 },
    { item: 'runicGauntlets', chance: 0.3 },
    { item: 'runicGreaves', chance: 0.3 },
  ],
  greenDragon: [
    { item: 'dragonscaleHelm', chance: 1 / 120 },
    { item: 'dragonscaleMail', chance: 1 / 120 },
    { item: 'dragonscaleGloves', chance: 1 / 120 },
    { item: 'dragonscaleLegs', chance: 1 / 120 },
  ],
  dragonia: [
    { item: 'eyeOfDragonia', chance: 0.1 },
    { item: 'dragonscaleHelm', chance: 0.3 },
    { item: 'dragonscaleMail', chance: 0.3 },
    { item: 'dragonscaleGloves', chance: 0.3 },
    { item: 'dragonscaleLegs', chance: 0.3 },
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

  /** Affix values per tier, keyed by affix id from data/affixes.ts. */
  affixValues: AFFIXES,

  affixes: {
    /** Chance a dropped item rolls a prefix / a suffix (independent; shop items are always blank). */
    prefixChance: 0.3,
    suffixChance: 0.3,
    /** When an affix rolls on an item that has its own specific affix for that slot, chance it's that one. */
    itemAffixChance: 0.25,
    /** When an affix rolls on a boss drop and the boss has a specific affix for that slot, chance it's that one. */
    bossAffixChance: 0.2,
    /** Base tier = area number (Sewers I ... Dragon's Roost V); then a chance to roll one higher or lower. */
    tierUpChance: 0.25,
    tierDownChance: 0.25,
    /** Boss drops roll this many tiers higher. */
    bossTierBonus: 1,
    /** Each affix tier adds this fraction of the item's value (affects sell price). */
    valuePerTier: 0.25,
    mount: {
      /** cost = base * tierMultiplier[tier] * (1 + sqrt(item value) / valueDivisor) * (filledMultiplier if the other slot is filled) */
      base: 10,
      tierMultipliers: [1, 3, 8, 20, 50],
      valueDivisor: 5,
      filledMultiplier: 2,
    },
  },

  shop: {
    /** Number of items on offer at once. */
    slots: 5,
    /** Automatic restock interval. */
    refreshMs: 60 * 60 * 1000,
    /** Fraction of an item's value received when selling. */
    sellFraction: 0.25,
  },

  /** Run length grows with level: base + perLevel * (level - 1), capped. */
  run: {
    baseSeconds: 30,
    secondsPerLevel: 2,
    maxSeconds: 300,
  },

  /** Arena space is in world units; the canvas scales it to the screen. */
  arena: {
    width: 100,
    height: 130,
    /** Lesser creatures alive at once. */
    maxEnemies: 6,
    /** Seconds between spawns while below maxEnemies. */
    spawnInterval: 1.2,
    /** New enemies spawn at least this far from the player. */
    spawnMinDistance: 25,
    playerSpeed: 28,
    enemySpeed: 6,
    bossSpeed: 3,
    /** Auto-attack reach. */
    attackRange: 9,
    /** Tap strikes every enemy within this radius of the tap. */
    tapRadius: 12,
    /** Body sizes, used for drawing and spacing. */
    playerRadius: 4,
    enemyRadius: 4.5,
    bossRadius: 9,
  },

  /** Tile fights: bosses with mechanic 'tiles' in data/creatures.ts. Four tiles sit in the corners around the boss. */
  tileFight: {
    lives: 3,
    /** Delay before the first wave. */
    firstWaveSeconds: 2,
    /** A new wave (red or blue) starts this often. */
    waveSeconds: 2,
    /** Red tiles flash for this long, then strike; blue tiles stay up this long. */
    warnSeconds: 1.5,
    /** Chance a wave is red (otherwise blue). */
    redChance: 0.6,
    /** Blue tiles per blue wave. */
    blueTiles: 2,
    /** Damage per blue tile tapped, as a fraction of the boss's max HP. */
    blueDamageFraction: 0.05,
    /** Tile centres sit this far from the boss on each axis; tiles are this wide (world units). */
    tileOffset: 22,
    tileSize: 24,
  },

  tick: {
    /** Largest delta (seconds) simulated in one frame. Stops huge jumps after the tab sleeps. */
    maxDeltaSeconds: 1,
    /** Movement is simulated in steps no longer than this. */
    maxStepSeconds: 0.05,
  },

  save: {
    key: 'incremental1.save',
    version: 6,
    intervalMs: 5000,
  },
} as const;

export function itemBalance(id: ItemId): ItemBalance {
  return CONFIG.items[id];
}

// ALL balance numbers live here. Placeholder values for v0.1; tune freely.

export const CONFIG = {
  player: {
    /** Damage per auto-attack. */
    baseDamage: 2,
    /** Auto-attacks per second. */
    attacksPerSecond: 1,
    /** Tap damage as a multiple of baseDamage. */
    tapDamageMultiplier: 1,
  },

  /** Per-creature balance, keyed by creature id from data/creatures.ts. */
  creatures: {
    rat: { maxHp: 10, gold: 1, xp: 1 },
  },

  tick: {
    /** Largest delta (seconds) simulated in one frame. Stops huge jumps after the tab sleeps. */
    maxDeltaSeconds: 1,
  },

  save: {
    key: 'incremental1.save',
    version: 1,
    intervalMs: 5000,
  },
} as const;

export type CreatureId = keyof typeof CONFIG.creatures;

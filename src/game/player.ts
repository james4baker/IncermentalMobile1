import Decimal from 'break_infinity.js';
import { CONFIG } from '../config';
import { equippedStats, type Stats } from './affixes';
import { levelForXp } from './levels';
import type { GameState } from './state';

const P = CONFIG.player;

export interface PlayerStats {
  level: number;
  damage: Decimal;
  tapDamage: Decimal;
  attacksPerSecond: number;
  /** 0..1 chance that an attack hits twice. */
  doubleHitChance: number;
  /** Multipliers on gold and XP from kills. */
  goldMultiplier: number;
  xpMultiplier: number;
  /** Tap strike radius in arena units. */
  tapRadius: number;
  /** Totals from equipped gear (base items + affixes). */
  gear: Stats;
}

/** Seconds a hunting run lasts at this level, before gear. */
export function runSeconds(level: number): number {
  const R = CONFIG.run;
  return Math.min(R.maxSeconds, R.baseSeconds + R.secondsPerLevel * (level - 1));
}

/** Level gives flat damage and base attack speed; gear multiplies both by its total %. */
export function playerStats(state: GameState): PlayerStats {
  const level = levelForXp(state.xp);
  const gear = equippedStats(state);
  const damage = new Decimal(P.baseDamage + P.damagePerLevel * (level - 1)).mul(1 + gear.damagePct / 100);
  const speed = P.attacksPerSecond * (1 + P.attackSpeedPerLevel * (level - 1)) * (1 + gear.speedPct / 100);
  return {
    level,
    damage,
    tapDamage: damage.mul(P.tapDamageMultiplier).mul(1 + gear.tapDamagePct / 100),
    attacksPerSecond: Math.min(P.maxAttacksPerSecond, speed),
    doubleHitChance: Math.min(1, gear.doubleHitPct / 100),
    goldMultiplier: 1 + gear.goldPct / 100,
    xpMultiplier: 1 + gear.xpPct / 100,
    tapRadius: CONFIG.arena.tapRadius * (1 + gear.tapRadiusPct / 100),
    gear,
  };
}

/** Total hunting-run length: level-based time plus run-time affixes. */
export function runDuration(state: GameState): number {
  return runSeconds(levelForXp(state.xp)) + equippedStats(state).runSeconds;
}

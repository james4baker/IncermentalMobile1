import Decimal from 'break_infinity.js';
import { CONFIG } from '../config';
import { gearBonuses, type GearBonuses } from './items';
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
  gear: GearBonuses;
}

/** Level gives flat damage and base attack speed; gear multiplies both by its total %. */
export function playerStats(state: GameState): PlayerStats {
  const level = levelForXp(state.xp);
  const gear = gearBonuses(state);
  const damage = new Decimal(P.baseDamage + P.damagePerLevel * (level - 1)).mul(1 + gear.damagePct / 100);
  const speed = P.attacksPerSecond * (1 + P.attackSpeedPerLevel * (level - 1)) * (1 + gear.speedPct / 100);
  return {
    level,
    damage,
    tapDamage: damage.mul(P.tapDamageMultiplier),
    attacksPerSecond: Math.min(P.maxAttacksPerSecond, speed),
    doubleHitChance: Math.min(1, gear.doubleHitPct / 100),
    gear,
  };
}

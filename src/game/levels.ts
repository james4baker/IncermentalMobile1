import Decimal from 'break_infinity.js';
import { CONFIG } from '../config';

/** XP_TABLE[level] = total XP needed to reach that level. Index 0 is unused. */
const XP_TABLE: Decimal[] = buildXpTable();

function buildXpTable(): Decimal[] {
  const { maxLevel, base, doublingLevels, divisor } = CONFIG.levels;
  const table = [new Decimal(0), new Decimal(0)];
  let points = 0;
  for (let n = 1; n < maxLevel; n++) {
    points += Math.floor(n + base * Math.pow(2, n / doublingLevels));
    table.push(new Decimal(Math.floor(points / divisor)));
  }
  return table;
}

export const MAX_LEVEL = CONFIG.levels.maxLevel;

export function xpForLevel(level: number): Decimal {
  const clamped = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL);
  return XP_TABLE[clamped]!;
}

/** Highest level whose XP requirement is met. */
export function levelForXp(xp: Decimal): number {
  let lo = 1;
  let hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (xp.gte(XP_TABLE[mid]!)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

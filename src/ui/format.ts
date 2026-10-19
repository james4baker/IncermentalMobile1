import Decimal from 'break_infinity.js';

const NAMED_SUFFIXES = ['', 'K', 'M', 'B', 'T'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** Suffix for a power-of-1000 tier: K, M, B, T, then aa, ab, ac ... zz. */
function suffixFor(tier: number): string | null {
  if (tier < NAMED_SUFFIXES.length) return NAMED_SUFFIXES[tier] ?? null;
  const i = tier - NAMED_SUFFIXES.length;
  if (i >= LETTERS.length * LETTERS.length) return null;
  return LETTERS[Math.floor(i / LETTERS.length)]! + LETTERS[i % LETTERS.length]!;
}

/** Format a number per GAME_DESIGN.md: as-is under 1,000 (max 2 decimals), then K/M/B/T/aa/ab... */
export function formatNumber(value: Decimal | number): string {
  const d = value instanceof Decimal ? value : new Decimal(value);
  // Up to 2 decimals so small % bonuses stay visible (6.08 dmg); whole numbers stay whole.
  if (d.lt(1000)) return String(Number(d.toNumber().toFixed(2)));

  let tier = Math.floor(d.exponent / 3);
  let shown = d.mantissa * Math.pow(10, d.exponent - tier * 3);
  // Rounding can push 999.995 up to "1000.00"; roll over to the next tier.
  if (Number(shown.toFixed(2)) >= 1000) {
    tier += 1;
    shown /= 1000;
  }

  const suffix = suffixFor(tier);
  if (suffix === null) return d.toExponential(2);
  return shown.toFixed(2) + suffix;
}

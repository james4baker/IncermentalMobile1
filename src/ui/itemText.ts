import { itemBalance, STAT_KEYS, type ItemId, type StatKey } from '../config';
import { AFFIXES } from '../data/affixes';
import { ITEMS } from '../data/items';
import { affixStats, type Stats } from '../game/affixes';
import type { AffixRoll, EquipSlot, ItemInstance } from '../game/state';

export const SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  hands: 'Hands',
  legs: 'Legs',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  necklace: 'Necklace',
};

const STAT_LABELS: Record<StatKey, (v: string) => string> = {
  damagePct: (v) => `+${v}% dmg`,
  speedPct: (v) => `+${v}% speed`,
  doubleHitPct: (v) => `${v}% double hit`,
  goldPct: (v) => `+${v}% gold`,
  xpPct: (v) => `+${v}% XP`,
  runSeconds: (v) => `+${v}s run time`,
  tapDamagePct: (v) => `+${v}% tap dmg`,
  tapRadiusPct: (v) => `+${v}% tap radius`,
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

export function formatPct(n: number): string {
  return `${Number(n.toFixed(2))}%`;
}

function num(n: number): string {
  return String(Number(n.toFixed(2)));
}

/** e.g. "+5% dmg · +4% speed" for any set of stats; zero stats are skipped. */
export function statsText(stats: Partial<Stats>): string {
  return STAT_KEYS.filter((k) => stats[k]).map((k) => STAT_LABELS[k](num(stats[k]!))).join(' · ');
}

/** Base item bonuses only, e.g. "+0.5% dmg · +0.3% speed · 10% double hit". */
export function bonusText(itemId: ItemId): string {
  const b = itemBalance(itemId);
  return statsText({ damagePct: b.damagePct, speedPct: b.speedPct, doubleHitPct: b.doubleHitPct ?? 0 });
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** "Vicious Torn Leather Cap of Swiftness" */
export function itemName(item: ItemInstance): string {
  return [item.prefix && AFFIXES[item.prefix.affixId].name, ITEMS[item.itemId].name, item.suffix && AFFIXES[item.suffix.affixId].name]
    .filter(Boolean)
    .join(' ');
}

/** "Vicious III" */
export function affixLabel(roll: AffixRoll): string {
  return `${AFFIXES[roll.affixId].name} ${ROMAN[roll.tier] ?? roll.tier}`;
}

/** CSS class by affix source: generic, boss-specific or item-specific. */
export function affixClass(roll: AffixRoll): string {
  return `affix-${AFFIXES[roll.affixId].source.kind}`;
}

function affixLineHtml(roll: AffixRoll): string {
  return `<span class="item-affix ${affixClass(roll)}">${escapeHtml(affixLabel(roll))}: ${statsText(affixStats(roll))}</span>`;
}

/** Icon + rarity-coloured name + bonus line (+ affix lines), shared by Gear, Shop and Forge lists. */
export function itemLabelHtml(item: ItemId | ItemInstance): string {
  const inst: ItemInstance = typeof item === 'string' ? { uid: 0, itemId: item } : item;
  const def = ITEMS[inst.itemId];
  return `
    <span class="item-icon">${def.icon}</span>
    <span class="item-text">
      <span class="item-name rarity-${def.rarity}">${escapeHtml(itemName(inst))}</span>
      <span class="item-bonus">${bonusText(inst.itemId)}</span>
      ${inst.prefix ? affixLineHtml(inst.prefix) : ''}
      ${inst.suffix ? affixLineHtml(inst.suffix) : ''}
    </span>`;
}

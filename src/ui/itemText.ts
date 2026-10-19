import { itemBalance, type ItemId } from '../config';
import { ITEMS } from '../data/items';
import type { EquipSlot } from '../game/state';

export const SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  hands: 'Hands',
  legs: 'Legs',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  necklace: 'Necklace',
};

export function formatPct(n: number): string {
  return `${Number(n.toFixed(2))}%`;
}

/** e.g. "+0.5% dmg · +0.3% speed · 10% double hit" */
export function bonusText(itemId: ItemId): string {
  const b = itemBalance(itemId);
  const parts = [`+${formatPct(b.damagePct)} dmg`, `+${formatPct(b.speedPct)} speed`];
  if (b.doubleHitPct) parts.push(`${formatPct(b.doubleHitPct)} double hit`);
  return parts.join(' · ');
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Icon + rarity-coloured name + bonus line, shared by Gear and Shop lists. */
export function itemLabelHtml(itemId: ItemId): string {
  const def = ITEMS[itemId];
  return `
    <span class="item-icon">${def.icon}</span>
    <span class="item-text">
      <span class="item-name rarity-${def.rarity}">${escapeHtml(def.name)}</span>
      <span class="item-bonus">${bonusText(itemId)}</span>
    </span>`;
}

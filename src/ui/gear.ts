import type { ItemId } from '../config';
import { ITEMS } from '../data/items';
import { sellPrice, slotsFor } from '../game/items';
import { EQUIP_SLOTS, type EquipSlot, type GameState, type ItemInstance } from '../game/state';
import { formatNumber } from './format';
import { itemLabelHtml, SLOT_LABELS } from './itemText';

export interface GearView {
  render(state: GameState): void;
}

export interface GearActions {
  equip(uid: number, slot: EquipSlot): void;
  unequip(slot: EquipSlot): void;
  sell(uid: number): void;
}

/** Equipped slots and the bag. Lists are rebuilt only when items change. */
export function createGearView(root: HTMLElement, actions: GearActions): GearView {
  root.innerHTML = `
    <h2 class="section-title">Equipped</h2>
    <div class="slots" data-slots></div>
    <h2 class="section-title">Bag <span class="muted" data-bagcount></span></h2>
    <div class="item-list" data-bag></div>
  `;
  const slotsEl = root.querySelector<HTMLElement>('[data-slots]')!;
  const bagEl = root.querySelector<HTMLElement>('[data-bag]')!;
  const bagCountEl = root.querySelector<HTMLElement>('[data-bagcount]')!;

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const uid = Number(btn.dataset.uid);
    const slot = btn.dataset.slot as EquipSlot;
    if (btn.dataset.action === 'unequip') actions.unequip(slot);
    else if (btn.dataset.action === 'equip') actions.equip(uid, slot);
    else if (btn.dataset.action === 'sell') actions.sell(uid);
  });

  function slotsHtml(state: GameState): string {
    return EQUIP_SLOTS.map((slot) => {
      const item = state.equipment[slot];
      if (!item) {
        return `<div class="slot slot-empty"><span class="slot-label">${SLOT_LABELS[slot]}</span><span class="muted">Empty</span></div>`;
      }
      return `
        <button type="button" class="slot" data-action="unequip" data-slot="${slot}">
          <span class="slot-label">${SLOT_LABELS[slot]} · tap to remove</span>
          <span class="item-row">${itemLabelHtml(item.itemId)}</span>
        </button>`;
    }).join('');
  }

  function bagHtml(state: GameState): string {
    if (state.inventory.length === 0) {
      return `<p class="empty">No spare gear. Hunt creatures for drops or visit the shop.</p>`;
    }
    // Identical items are grouped; actions apply to the first one in the group.
    const groups = new Map<ItemId, ItemInstance[]>();
    for (const item of state.inventory) {
      const list = groups.get(item.itemId) ?? [];
      list.push(item);
      groups.set(item.itemId, list);
    }
    return [...groups.entries()].map(([itemId, items]) => {
      const first = items[0]!;
      const equipButtons = slotsFor(ITEMS[itemId].slot)
        .map((slot) => {
          const label = slotsFor(ITEMS[itemId].slot).length > 1 ? `Equip ${SLOT_LABELS[slot]}` : 'Equip';
          return `<button type="button" class="btn" data-action="equip" data-uid="${first.uid}" data-slot="${slot}">${label}</button>`;
        })
        .join('');
      return `
        <div class="item-card">
          <div class="item-row">${itemLabelHtml(itemId)}${items.length > 1 ? `<span class="item-count">×${items.length}</span>` : ''}</div>
          <div class="item-actions">
            ${equipButtons}
            <button type="button" class="btn btn-secondary" data-action="sell" data-uid="${first.uid}">Sell · ${formatNumber(sellPrice(itemId))}g</button>
          </div>
        </div>`;
    }).join('');
  }

  let renderedKey = '';

  return {
    render(state) {
      const key =
        EQUIP_SLOTS.map((s) => state.equipment[s]?.uid ?? 0).join(',') + '|' + state.inventory.map((i) => i.uid).join(',');
      if (key === renderedKey) return;
      renderedKey = key;
      slotsEl.innerHTML = slotsHtml(state);
      bagEl.innerHTML = bagHtml(state);
      bagCountEl.textContent = `(${state.inventory.length})`;
    },
  };
}

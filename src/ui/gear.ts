import { itemBalance, type ItemId } from '../config';
import { ITEMS } from '../data/items';
import { bagValue, sellPrice, slotsFor } from '../game/items';
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
  sellAllOf(itemId: ItemId): void;
  sellBag(): void;
}

const SORTS = [
  { id: 'damage', label: 'Damage', value: (id: ItemId) => itemBalance(id).damagePct },
  { id: 'speed', label: 'Speed', value: (id: ItemId) => itemBalance(id).speedPct },
  { id: 'value', label: 'Value', value: (id: ItemId) => itemBalance(id).value },
] as const;
type SortId = (typeof SORTS)[number]['id'];

/** How long the bag-wide "Sell all" waits for its confirming second tap. */
const CONFIRM_MS = 3000;

/** Equipped slots and the bag. Lists are rebuilt only when items or sort order change. */
export function createGearView(root: HTMLElement, actions: GearActions): GearView {
  root.innerHTML = `
    <h2 class="section-title">Equipped</h2>
    <div class="slots" data-slots></div>
    <div class="bag-header">
      <h2 class="section-title">Bag <span class="muted" data-bagcount></span></h2>
      <button type="button" class="btn btn-danger" data-sellbag></button>
    </div>
    <div class="sort-row">
      <span class="muted">Sort</span>
      ${SORTS.map((s) => `<button type="button" class="chip" data-sort="${s.id}">${s.label}</button>`).join('')}
    </div>
    <div class="item-list" data-bag></div>
  `;
  const slotsEl = root.querySelector<HTMLElement>('[data-slots]')!;
  const bagEl = root.querySelector<HTMLElement>('[data-bag]')!;
  const bagCountEl = root.querySelector<HTMLElement>('[data-bagcount]')!;
  const sellBagBtn = root.querySelector<HTMLButtonElement>('[data-sellbag]')!;
  const sortBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-sort]')];

  let sort: SortId = 'damage';
  let confirmUntil = 0;
  let renderedKey = '';

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const uid = Number(btn.dataset.uid);
    const slot = btn.dataset.slot as EquipSlot;
    switch (btn.dataset.action) {
      case 'unequip':
        actions.unequip(slot);
        break;
      case 'equip':
        actions.equip(uid, slot);
        break;
      case 'sell':
        actions.sell(uid);
        break;
      case 'sellall':
        actions.sellAllOf(btn.dataset.item as ItemId);
        break;
    }
  });

  sellBagBtn.addEventListener('click', () => {
    // Two taps: the first arms the button, the second (within CONFIRM_MS) sells.
    if (performance.now() < confirmUntil) {
      confirmUntil = 0;
      actions.sellBag();
    } else {
      confirmUntil = performance.now() + CONFIRM_MS;
    }
  });

  for (const btn of sortBtns) {
    btn.addEventListener('click', () => {
      sort = btn.dataset.sort as SortId;
      renderedKey = '';
    });
  }

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
    // Identical items are grouped; single actions apply to the first one in the group.
    const groups = new Map<ItemId, ItemInstance[]>();
    for (const item of state.inventory) {
      const list = groups.get(item.itemId) ?? [];
      list.push(item);
      groups.set(item.itemId, list);
    }
    // Explicit order (highest first, then name) so groups don't jump around as items come and go.
    const sortValue = SORTS.find((s) => s.id === sort)!.value;
    const ordered = [...groups.entries()].sort(
      ([a], [b]) => sortValue(b) - sortValue(a) || ITEMS[a].name.localeCompare(ITEMS[b].name),
    );

    return ordered.map(([itemId, items]) => {
      const first = items[0]!;
      const slots = slotsFor(ITEMS[itemId].slot);
      const equipButtons = slots
        .map((slot) => {
          const label = slots.length > 1 ? `Equip ${SLOT_LABELS[slot]}` : 'Equip';
          return `<button type="button" class="btn" data-action="equip" data-uid="${first.uid}" data-slot="${slot}">${label}</button>`;
        })
        .join('');
      const sellAll = items.length > 1
        ? `<button type="button" class="btn btn-secondary" data-action="sellall" data-item="${itemId}">Sell all ×${items.length} · ${formatNumber(sellPrice(itemId).mul(items.length))}g</button>`
        : '';
      return `
        <div class="item-card">
          <div class="item-row">${itemLabelHtml(itemId)}${items.length > 1 ? `<span class="item-count">×${items.length}</span>` : ''}</div>
          <div class="item-actions">
            ${equipButtons}
            <button type="button" class="btn btn-secondary" data-action="sell" data-uid="${first.uid}">Sell · ${formatNumber(sellPrice(itemId))}g</button>
            ${sellAll}
          </div>
        </div>`;
    }).join('');
  }

  return {
    render(state) {
      const armed = performance.now() < confirmUntil;
      sellBagBtn.disabled = state.inventory.length === 0;
      sellBagBtn.classList.toggle('armed', armed);
      sellBagBtn.textContent = armed
        ? `Tap again to sell ${state.inventory.length}`
        : `Sell all · ${formatNumber(bagValue(state))}g`;

      const key =
        sort + '|' + EQUIP_SLOTS.map((s) => state.equipment[s]?.uid ?? 0).join(',') + '|' + state.inventory.map((i) => i.uid).join(',');
      if (key === renderedKey) return;
      renderedKey = key;
      for (const b of sortBtns) b.classList.toggle('active', b.dataset.sort === sort);
      slotsEl.innerHTML = slotsHtml(state);
      bagEl.innerHTML = bagHtml(state);
      bagCountEl.textContent = `(${state.inventory.length})`;
    },
  };
}

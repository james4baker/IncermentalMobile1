import { AFFIXES, type AffixSlot } from '../data/affixes';
import { CREATURES } from '../data/creatures';
import { ITEMS } from '../data/items';
import { affixStats, mountCost } from '../game/affixes';
import { groupKey } from '../game/items';
import { EQUIP_SLOTS, type AffixRoll, type GameState, type ItemInstance } from '../game/state';
import { formatNumber } from './format';
import { affixClass, affixLabel, escapeHtml, itemLabelHtml, itemName, SLOT_LABELS, statsText } from './itemText';

export interface ForgeView {
  render(state: GameState): void;
}

export interface ForgeActions {
  dismantle(uid: number, keep: AffixSlot): void;
  mount(stashIndex: number, targetUid: number): void;
}

const CONFIRM_MS = 3000;

function rollKey(r: AffixRoll): string {
  return `${r.affixId}:${r.tier}`;
}

function sourceText(roll: AffixRoll): string {
  const s = AFFIXES[roll.affixId].source;
  if (s.kind === 'boss') return `${CREATURES[s.creatureId].name} drops`;
  if (s.kind === 'item') return `${ITEMS[s.itemId].name} only`;
  return 'Any drop';
}

/** Forge: dismantle items into the affix stash, and mount stashed affixes onto items for gold. */
export function createForgeView(root: HTMLElement, actions: ForgeActions): ForgeView {
  root.innerHTML = `
    <h2 class="section-title">Forge</h2>
    <div class="sort-row">
      <button type="button" class="chip" data-mode="dismantle">Dismantle</button>
      <button type="button" class="chip" data-mode="mount">Mount</button>
    </div>
    <div data-body></div>
  `;
  const bodyEl = root.querySelector<HTMLElement>('[data-body]')!;
  const modeBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-mode]')];

  let mode: 'dismantle' | 'mount' = 'dismantle';
  let selected: string | null = null;
  /** Action awaiting its confirming second tap, and when that offer expires. */
  let armed: { id: string; until: number } | null = null;
  let renderedKey = '';

  for (const b of modeBtns) {
    b.addEventListener('click', () => {
      mode = b.dataset.mode as typeof mode;
      armed = null;
    });
  }

  /** First tap arms the button; a second tap within CONFIRM_MS runs it. */
  function confirmed(id: string): boolean {
    if (armed && armed.id === id && performance.now() < armed.until) {
      armed = null;
      return true;
    }
    armed = { id, until: performance.now() + CONFIRM_MS };
    return false;
  }

  let lastState: GameState | null = null;

  bodyEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
    if (!btn || btn.disabled || !lastState) return;
    const state = lastState;
    switch (btn.dataset.act) {
      case 'dismantle': {
        const uid = Number(btn.dataset.uid);
        const keep = btn.dataset.keep as AffixSlot;
        if (confirmed(`d:${uid}:${keep}`)) actions.dismantle(uid, keep);
        break;
      }
      case 'select':
        selected = selected === btn.dataset.roll ? null : btn.dataset.roll!;
        armed = null;
        break;
      case 'mount': {
        const index = state.affixStash.findIndex((r) => rollKey(r) === selected);
        const uid = Number(btn.dataset.uid);
        // Replacing an existing affix destroys it, so that needs a second tap.
        if (btn.dataset.replaces && !confirmed(`m:${uid}`)) break;
        if (index >= 0) actions.mount(index, uid);
        if (!state.affixStash.some((r) => rollKey(r) === selected)) selected = null;
        break;
      }
    }
  });

  function isArmed(id: string): boolean {
    return !!armed && armed.id === id && performance.now() < armed.until;
  }

  function dismantleHtml(state: GameState): string {
    const items = state.inventory
      .filter((i) => i.prefix || i.suffix)
      .sort((a, b) => itemName(a).localeCompare(itemName(b)));
    const intro = `<p class="muted forge-hint">Keep one affix; the item and its other affix are destroyed. Unequip items to dismantle them.</p>`;
    if (items.length === 0) return intro + `<p class="empty">No bag items have affixes yet. Monster drops can roll them.</p>`;
    return (
      intro +
      `<div class="item-list">` +
      items
        .map((item) => {
          const btn = (slot: AffixSlot) => {
            const roll = item[slot];
            if (!roll) return '';
            const id = `d:${item.uid}:${slot}`;
            return `<button type="button" class="btn ${isArmed(id) ? 'btn-danger armed' : ''}" data-act="dismantle" data-uid="${item.uid}" data-keep="${slot}">
              ${isArmed(id) ? 'Tap again to dismantle' : `Keep ${escapeHtml(affixLabel(roll))}`}</button>`;
          };
          return `
            <div class="item-card">
              <div class="item-row">${itemLabelHtml(item)}</div>
              <div class="item-actions">${btn('prefix')}${btn('suffix')}</div>
            </div>`;
        })
        .join('') +
      `</div>`
    );
  }

  function mountHtml(state: GameState): string {
    if (state.affixStash.length === 0) {
      return `<p class="empty">Your affix stash is empty. Dismantle items with affixes to fill it.</p>`;
    }
    // Stash, grouped by affix + tier.
    const groups = new Map<string, { roll: AffixRoll; count: number }>();
    for (const r of state.affixStash) {
      const g = groups.get(rollKey(r));
      if (g) g.count++;
      else groups.set(rollKey(r), { roll: r, count: 1 });
    }
    if (selected && !groups.has(selected)) selected = null;
    const stash = [...groups.entries()]
      .sort(([, a], [, b]) => b.roll.tier - a.roll.tier || AFFIXES[a.roll.affixId].name.localeCompare(AFFIXES[b.roll.affixId].name))
      .map(
        ([key, { roll, count }]) => `
        <button type="button" class="affix-card ${key === selected ? 'selected' : ''}" data-act="select" data-roll="${key}">
          <span class="affix-card-top">
            <span class="item-name ${affixClass(roll)}">${escapeHtml(affixLabel(roll))}</span>
            <span class="muted affix-slot">${AFFIXES[roll.affixId].slot}</span>
            ${count > 1 ? `<span class="item-count">×${count}</span>` : ''}
          </span>
          <span class="item-bonus">${statsText(affixStats(roll))}</span>
          <span class="muted affix-source">${sourceText(roll)}</span>
        </button>`,
      )
      .join('');

    let targets = '';
    const sel = selected ? groups.get(selected)?.roll : undefined;
    if (sel) {
      const slot = AFFIXES[sel.affixId].slot;
      const equipped = EQUIP_SLOTS.flatMap((s) => {
        const item = state.equipment[s];
        return item ? [{ item, where: SLOT_LABELS[s] }] : [];
      });
      const bag = [...state.inventory]
        .sort((a, b) => itemName(a).localeCompare(itemName(b)))
        .map((item) => ({ item, where: 'Bag' }));
      // One card per identical bag group keeps the list short.
      const seen = new Set<string>();
      const list = [...equipped, ...bag].filter(({ item, where }) => {
        if (where !== 'Bag') return true;
        const k = groupKey(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      targets = `
        <h3 class="log-area">Mount ${escapeHtml(affixLabel(sel))} onto…</h3>
        <div class="item-list">
          ${list
            .map(({ item, where }) => {
              const cost = mountCost(sel, item);
              const existing = item[slot];
              const id = `m:${item.uid}`;
              const label = isArmed(id)
                ? `Tap again to replace ${escapeHtml(affixLabel(existing!))}`
                : `${existing ? `Replace ${escapeHtml(affixLabel(existing))}` : 'Mount'} · ${formatNumber(cost)}g`;
              return `
                <div class="item-card">
                  <div class="item-row">${itemLabelHtml(item)}<span class="item-count muted">${where}</span></div>
                  <div class="item-actions">
                    <button type="button" class="btn ${existing ? 'btn-danger' : ''} ${isArmed(id) ? 'armed' : ''}" data-act="mount" data-uid="${item.uid}"
                      ${existing ? 'data-replaces="1"' : ''} ${state.gold.lt(cost) ? 'disabled' : ''}>${label}</button>
                  </div>
                </div>`;
            })
            .join('')}
          ${list.length === 0 ? '<p class="empty">You have no items to mount onto.</p>' : ''}
        </div>`;
    }

    return `
      <p class="muted forge-hint">Pick an affix, then the item to mount it on. Mounting onto an item that already has an affix in the other slot costs more.</p>
      <h3 class="log-area">Affix stash (${state.affixStash.length})</h3>
      <div class="affix-grid">${stash}</div>
      ${targets || '<p class="muted forge-hint">Select an affix above to see where it can go.</p>'}`;
  }

  return {
    render(state) {
      lastState = state;
      if (armed && performance.now() >= armed.until) armed = null;
      const itemsKey =
        EQUIP_SLOTS.map((s) => (state.equipment[s] ? state.equipment[s]!.uid + groupKey(state.equipment[s]!) : '-')).join(',') +
        '|' +
        state.inventory.map((i: ItemInstance) => i.uid + groupKey(i)).join(',');
      const key = [mode, selected, armed?.id ?? '', state.gold.toString(), state.affixStash.map(rollKey).join(','), itemsKey].join('#');
      if (key === renderedKey) return;
      renderedKey = key;
      for (const b of modeBtns) b.classList.toggle('active', b.dataset.mode === mode);
      bodyEl.innerHTML = mode === 'dismantle' ? dismantleHtml(state) : mountHtml(state);
    },
  };
}

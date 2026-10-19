import { ITEMS } from '../data/items';
import { buyPrice, msUntilRefresh } from '../game/shop';
import type { GameState } from '../game/state';
import { formatNumber } from './format';
import { itemLabelHtml } from './itemText';

export interface ShopView {
  render(state: GameState, now: number): void;
}

export interface ShopActions {
  buy(offerIndex: number): void;
  refresh(): void;
}

const SLOT_NAMES = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', ring: 'Ring', necklace: 'Necklace' };

function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Shop stock, restock timer and on-demand refresh. */
export function createShopView(root: HTMLElement, actions: ShopActions): ShopView {
  root.innerHTML = `
    <div class="shop-header">
      <div>
        <h2 class="section-title">Shop</h2>
        <div class="muted">Restocks in <span data-countdown></span></div>
      </div>
      <button type="button" class="btn btn-secondary" data-refresh>Refresh now</button>
    </div>
    <div class="item-list" data-offers></div>
    <p class="muted shop-hint">Defeat bosses to unlock better stock.</p>
  `;
  const countdownEl = root.querySelector<HTMLElement>('[data-countdown]')!;
  const offersEl = root.querySelector<HTMLElement>('[data-offers]')!;
  root.querySelector<HTMLElement>('[data-refresh]')!.addEventListener('click', () => actions.refresh());
  offersEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-buy]');
    if (btn && !btn.disabled) actions.buy(Number(btn.dataset.buy));
  });

  let renderedKey = '';
  let buyButtons: HTMLButtonElement[] = [];

  return {
    render(state, now) {
      countdownEl.textContent = formatCountdown(msUntilRefresh(state, now));

      const key = `${state.shop.refreshedAt}|` + state.shop.offers.map((o) => `${o.itemId}:${o.sold}`).join(',');
      if (key !== renderedKey) {
        renderedKey = key;
        offersEl.innerHTML = state.shop.offers
          .map(
            (offer, i) => `
            <div class="item-card ${offer.sold ? 'sold' : ''}">
              <div class="item-row">${itemLabelHtml(offer.itemId)}<span class="item-count muted">${SLOT_NAMES[ITEMS[offer.itemId].slot]}</span></div>
              <div class="item-actions">
                <button type="button" class="btn" data-buy="${i}" data-sold="${offer.sold}">
                  ${offer.sold ? 'Sold' : `Buy · ${formatNumber(buyPrice(offer.itemId))}g`}
                </button>
              </div>
            </div>`,
          )
          .join('');
        buyButtons = [...offersEl.querySelectorAll<HTMLButtonElement>('[data-buy]')];
      }

      // Affordability changes every kill, so toggle buttons without rebuilding.
      state.shop.offers.forEach((offer, i) => {
        const btn = buyButtons[i];
        if (btn) btn.disabled = offer.sold || state.gold.lt(buyPrice(offer.itemId));
      });
    },
  };
}

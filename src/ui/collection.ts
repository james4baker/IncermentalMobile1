import { AREAS } from '../data/areas';
import { CREATURES } from '../data/creatures';
import { ITEMS } from '../data/items';
import { collectionProgress, dropCount, killCount, lootItems } from '../game/collection';
import type { CreatureId } from '../config';
import type { GameState } from '../game/state';
import { formatNumber } from './format';
import { escapeHtml } from './itemText';

export interface CollectionView {
  render(state: GameState): void;
}

/** Collection log: every monster and its drops. Unseen things are shown as silhouettes. */
export function createCollectionView(root: HTMLElement): CollectionView {
  function creatureHtml(state: GameState, creatureId: CreatureId, isBoss: boolean): string {
    const def = CREATURES[creatureId];
    const kills = killCount(state, creatureId);
    const known = kills > 0;
    const items = lootItems(creatureId)
      .map((itemId) => {
        const item = ITEMS[itemId];
        const count = dropCount(state, creatureId, itemId);
        const got = count > 0;
        return `
          <div class="log-item ${got ? '' : 'missing'}">
            <div class="log-orb rarity-bg-${item.rarity}">
              <span class="log-item-icon ${got ? '' : 'silhouette'}">${item.icon}</span>
              ${got ? `<span class="log-badge">${formatNumber(count)}</span>` : ''}
            </div>
            <span class="log-item-name">${got ? escapeHtml(item.name) : '???'}</span>
          </div>`;
      })
      .join('');
    return `
      <div class="log-card ${known ? '' : 'unknown'}">
        <div class="log-head">
          <span class="log-creature ${known ? '' : 'silhouette'}">${def.icon}</span>
          <span class="log-name">${known ? escapeHtml(def.name) : '???'}${isBoss ? ' <span class="boss-tag">Boss</span>' : ''}</span>
          <span class="log-tally">${known ? `${formatNumber(kills)} kill${kills === 1 ? '' : 's'}` : ''}</span>
        </div>
        <div class="log-items">${items}</div>
      </div>`;
  }

  let renderedKey = '';

  return {
    render(state) {
      const key = JSON.stringify(state.killCounts) + JSON.stringify(state.drops);
      if (key === renderedKey) return;
      renderedKey = key;

      const p = collectionProgress(state);
      root.innerHTML = `
        <h2 class="section-title">Collection Log</h2>
        <div class="log-summary">
          <div><span class="log-summary-value">${p.monstersDefeated} / ${p.monstersTotal}</span><span class="muted">Monsters</span></div>
          <div><span class="log-summary-value">${p.slotsFound} / ${p.slotsTotal}</span><span class="muted">Drops</span></div>
        </div>
        ${AREAS.map(
          (area) => `
          <h3 class="log-area">${escapeHtml(area.name)}</h3>
          ${area.creatures.map((c) => creatureHtml(state, c, false)).join('')}
          ${creatureHtml(state, area.boss, true)}`,
        ).join('')}
      `;
    },
  };
}

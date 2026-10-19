import type { GameEvent } from '../game/combat';
import { AREAS } from '../data/areas';
import { CREATURES } from '../data/creatures';
import { ITEMS } from '../data/items';

let container: HTMLElement | null = null;

export function mountToasts(el: HTMLElement): void {
  container = el;
}

export function toast(text: string, cls = ''): void {
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${cls}`;
  el.textContent = text;
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  // Keep the stack short if many things happen at once.
  while (container.children.length > 4) container.firstElementChild?.remove();
}

/** Toasts for notable events. Shown on every screen. */
export function toastEvents(events: GameEvent[]): void {
  for (const ev of events) {
    switch (ev.type) {
      case 'loot':
        for (const id of ev.itemIds) toast(`🎁 ${ITEMS[id].name}`, `rarity-${ITEMS[id].rarity}`);
        break;
      case 'firstKill':
        toast(`📖 New monster logged: ${CREATURES[ev.creatureId].name}`);
        break;
      case 'collection':
        for (const id of ev.itemIds) toast(`📖 New collection entry: ${ITEMS[id].name}`, `rarity-${ITEMS[id].rarity}`);
        break;
      case 'key': {
        const area = AREAS.find((a) => a.id === ev.areaId);
        toast(`🗝️ ${area?.keyName ?? 'Key'} dropped!`);
        break;
      }
      case 'levelUp':
        toast(`⬆️ Level ${ev.level}!`);
        break;
      case 'bossDefeated': {
        const area = AREAS.find((a) => a.id === ev.areaId);
        if (area) toast(`🏆 ${CREATURES[area.boss].name} defeated!`);
        const unlocked = AREAS.find((a) => a.id === ev.unlockedAreaId);
        if (unlocked) toast(`🔓 ${unlocked.name} unlocked!`);
        break;
      }
    }
  }
}

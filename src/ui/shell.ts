import { levelForXp, MAX_LEVEL, xpForLevel } from '../game/levels';
import type { GameState } from '../game/state';
import { formatNumber } from './format';
import { mountToasts } from './toast';

export const SCREENS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'hunt', label: 'Hunt', icon: '⚔️' },
  { id: 'gear', label: 'Gear', icon: '🎒' },
  { id: 'shop', label: 'Shop', icon: '🛒' },
  { id: 'forge', label: 'Forge', icon: '🔨' },
  { id: 'log', label: 'Collection', icon: '📖' },
] as const;
export type ScreenId = (typeof SCREENS)[number]['id'];

export interface Shell {
  screens: Record<ScreenId, HTMLElement>;
  active(): ScreenId;
  renderTopbar(state: GameState): void;
}

/** Top bar (gold, level), one container per screen, bottom tab bar and toast layer. */
export function createShell(root: HTMLElement, initial: ScreenId): Shell {
  root.innerHTML = `
    <header class="topbar">
      <div class="resource resource-gold"><span class="resource-label">Gold</span><span class="resource-value" data-gold></span></div>
      <div class="resource resource-level">
        <span class="resource-label">Level</span><span class="resource-value" data-level></span>
        <div class="xpbar"><div class="xpbar-fill" data-xpfill></div></div>
        <span class="resource-sub" data-xptext></span>
      </div>
    </header>
    <div class="screens">
      ${SCREENS.map((s) => `<section class="screen screen-${s.id}" data-screen="${s.id}" hidden></section>`).join('')}
    </div>
    <nav class="tabbar">
      ${SCREENS.map((s) => `<button type="button" class="tab" data-tab="${s.id}"><span class="tab-icon">${s.icon}</span><span>${s.label}</span></button>`).join('')}
    </nav>
    <div class="toasts" data-toasts></div>
  `;

  const q = <T extends HTMLElement>(sel: string): T => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Missing element ${sel}`);
    return el;
  };
  const goldEl = q('[data-gold]');
  const levelEl = q('[data-level]');
  const xpFill = q('[data-xpfill]');
  const xpText = q('[data-xptext]');
  mountToasts(q('[data-toasts]'));

  const screens = Object.fromEntries(SCREENS.map((s) => [s.id, q(`[data-screen="${s.id}"]`)])) as Record<ScreenId, HTMLElement>;
  const tabs = SCREENS.map((s) => ({ id: s.id, btn: q<HTMLButtonElement>(`[data-tab="${s.id}"]`) }));

  let current: ScreenId = initial;
  function show(id: ScreenId): void {
    current = id;
    for (const s of SCREENS) screens[s.id].hidden = s.id !== id;
    for (const t of tabs) t.btn.classList.toggle('active', t.id === id);
  }
  for (const t of tabs) t.btn.addEventListener('click', () => show(t.id));
  show(initial);

  return {
    screens,
    active: () => current,
    renderTopbar(state) {
      const level = levelForXp(state.xp);
      goldEl.textContent = formatNumber(state.gold);
      levelEl.textContent = String(level);
      if (level >= MAX_LEVEL) {
        xpFill.style.width = '100%';
        xpText.textContent = `${formatNumber(state.xp)} XP (max)`;
      } else {
        const from = xpForLevel(level);
        const to = xpForLevel(level + 1);
        const pct = state.xp.sub(from).div(to.sub(from)).toNumber() * 100;
        xpFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
        xpText.textContent = `${formatNumber(state.xp)} / ${formatNumber(to)} XP`;
      }
    },
  };
}

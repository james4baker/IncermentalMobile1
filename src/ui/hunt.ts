import type { GameEvent } from '../game/combat';
import { creatureMaxHp } from '../game/combat';
import type { GameState } from '../game/state';
import { CREATURES } from '../data/creatures';
import { formatNumber } from './format';

export interface HuntView {
  render(state: GameState): void;
  showEvents(events: GameEvent[]): void;
}

/** Builds the Hunt screen once; render() then only updates text and widths. */
export function createHuntView(root: HTMLElement, onTap: () => void): HuntView {
  root.innerHTML = `
    <header class="topbar">
      <div class="resource"><span class="resource-label">Gold</span><span class="resource-value" data-gold></span></div>
      <div class="resource"><span class="resource-label">XP</span><span class="resource-value" data-xp></span></div>
    </header>
    <main class="hunt">
      <div class="area-name">Sewers</div>
      <div class="creature-name" data-name></div>
      <div class="hpbar"><div class="hpbar-fill" data-hpfill></div><span class="hpbar-text" data-hptext></span></div>
      <button class="creature" type="button" aria-label="Attack" data-creature>
        <span class="creature-icon" data-icon></span>
      </button>
      <div class="hint">Tap to attack</div>
      <div class="kills">Kills: <span data-kills></span></div>
    </main>
  `;

  const q = <T extends HTMLElement>(sel: string): T => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Missing element ${sel}`);
    return el;
  };
  const goldEl = q('[data-gold]');
  const xpEl = q('[data-xp]');
  const nameEl = q('[data-name]');
  const hpFill = q('[data-hpfill]');
  const hpText = q('[data-hptext]');
  const creatureBtn = q<HTMLButtonElement>('[data-creature]');
  const iconEl = q('[data-icon]');
  const killsEl = q('[data-kills]');

  creatureBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onTap();
  });

  function floatText(text: string, cls: string): void {
    const el = document.createElement('span');
    el.className = `float ${cls}`;
    el.textContent = text;
    el.style.left = `${35 + Math.random() * 30}%`;
    creatureBtn.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function bump(): void {
    iconEl.classList.remove('hit');
    void iconEl.offsetWidth; // restart the animation
    iconEl.classList.add('hit');
  }

  return {
    render(state) {
      const def = CREATURES[state.creatureId];
      const max = creatureMaxHp(state);
      const pct = Math.max(0, state.creatureHp.div(max).toNumber()) * 100;

      goldEl.textContent = formatNumber(state.gold);
      xpEl.textContent = formatNumber(state.xp);
      nameEl.textContent = def.name;
      iconEl.textContent = def.icon;
      hpFill.style.width = `${pct}%`;
      hpText.textContent = `${formatNumber(state.creatureHp.max(0))} / ${formatNumber(max)}`;
      killsEl.textContent = formatNumber(state.kills);
    },

    showEvents(events) {
      for (const ev of events) {
        if (ev.type === 'damage') {
          floatText(`-${formatNumber(ev.amount)}`, ev.source === 'tap' ? 'float-tap' : 'float-auto');
          bump();
        } else {
          floatText(`+${formatNumber(ev.gold)} gold`, 'float-gold');
        }
      }
    },
  };
}

import { creatureMaxHp, type GameEvent } from '../game/combat';
import { playerStats } from '../game/player';
import { currentArea, isAreaUnlocked, keysHeld } from '../game/progression';
import type { GameState } from '../game/state';
import { AREAS } from '../data/areas';
import { CREATURES } from '../data/creatures';
import { formatNumber } from './format';

export interface HuntView {
  render(state: GameState): void;
  /** Floating combat text. Only call while the Hunt screen is visible. */
  showEvents(events: GameEvent[]): void;
}

export interface HuntActions {
  tap(): void;
  selectArea(areaId: string): void;
  enterLair(): void;
}

/** Builds the Hunt screen once; render() then only updates text, classes and widths. */
export function createHuntView(root: HTMLElement, actions: HuntActions): HuntView {
  root.innerHTML = `
    <nav class="areas" data-areas></nav>
    <div class="hunt">
      <div class="area-name" data-areaname></div>
      <div class="creature-name" data-name></div>
      <div class="hpbar"><div class="hpbar-fill" data-hpfill></div><span class="hpbar-text" data-hptext></span></div>
      <button class="creature" type="button" aria-label="Attack" data-creature>
        <span class="creature-icon" data-icon></span>
      </button>
      <div class="stats" data-stats></div>
    </div>
    <section class="lair-panel">
      <div class="keys"><span class="keys-icon">🗝️</span><span data-keyname></span><span class="keys-count" data-keycount></span></div>
      <button class="lair-btn" type="button" data-lair></button>
    </section>
  `;

  const q = <T extends HTMLElement>(sel: string): T => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Missing element ${sel}`);
    return el;
  };
  const areasEl = q('[data-areas]');
  const areaNameEl = q('[data-areaname]');
  const nameEl = q('[data-name]');
  const hpFill = q('[data-hpfill]');
  const hpText = q('[data-hptext]');
  const creatureBtn = q<HTMLButtonElement>('[data-creature]');
  const iconEl = q('[data-icon]');
  const statsEl = q('[data-stats]');
  const keyNameEl = q('[data-keyname]');
  const keyCountEl = q('[data-keycount]');
  const lairBtn = q<HTMLButtonElement>('[data-lair]');

  const areaButtons = AREAS.map((area) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'area-tab';
    btn.addEventListener('click', () => actions.selectArea(area.id));
    areasEl.appendChild(btn);
    return { area, btn };
  });

  creatureBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    actions.tap();
  });
  lairBtn.addEventListener('click', () => actions.enterLair());

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
      const area = currentArea(state);
      const def = CREATURES[state.creatureId];
      const max = creatureMaxHp(state);
      const hpPct = Math.max(0, state.creatureHp.div(max).toNumber()) * 100;
      const stats = playerStats(state);

      for (const { area: a, btn } of areaButtons) {
        const unlocked = isAreaUnlocked(state, a.id);
        btn.textContent = unlocked ? a.name : `🔒 ${a.name}`;
        btn.disabled = !unlocked || state.inLair;
        btn.classList.toggle('active', a.id === area.id);
      }

      areaNameEl.textContent = state.inLair ? `${CREATURES[area.boss].name}'s Lair` : area.name;
      nameEl.textContent = def.name;
      nameEl.classList.toggle('boss', state.inLair);
      iconEl.textContent = def.icon;
      hpFill.style.width = `${hpPct}%`;
      hpText.textContent = `${formatNumber(state.creatureHp.max(0))} / ${formatNumber(max)}`;
      statsEl.textContent = `${formatNumber(stats.damage)} dmg · ${stats.attacksPerSecond.toFixed(2)} attacks/s`;

      const keys = keysHeld(state, area.id);
      keyNameEl.textContent = area.keyName;
      keyCountEl.textContent = `× ${keys}`;
      lairBtn.disabled = state.inLair || keys < 1;
      lairBtn.textContent = state.inLair ? 'Fighting…' : 'Enter lair';
    },

    showEvents(events) {
      for (const ev of events) {
        if (ev.type === 'damage') {
          const label = ev.double ? `-${formatNumber(ev.amount)} ×2!` : `-${formatNumber(ev.amount)}`;
          floatText(label, ev.double ? 'float-double' : ev.source === 'tap' ? 'float-tap' : 'float-auto');
          bump();
        } else if (ev.type === 'kill') {
          floatText(`+${formatNumber(ev.gold)} gold`, 'float-gold');
        }
      }
    },
  };
}

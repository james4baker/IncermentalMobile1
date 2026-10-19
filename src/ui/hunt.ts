import type { ItemId } from '../config';
import { AREAS } from '../data/areas';
import { CREATURES } from '../data/creatures';
import { ITEMS } from '../data/items';
import type { GameEvent } from '../game/events';
import { levelForXp } from '../game/levels';
import { runSeconds } from '../game/player';
import { areaById, isAreaUnlocked, keysHeld, previousArea } from '../game/progression';
import { canStartRun, timeLeft } from '../game/run';
import type { GameState, RunKind, RunState } from '../game/state';
import { createArenaRenderer } from './arena';
import { formatNumber } from './format';
import { escapeHtml } from './itemText';

export interface HuntView {
  render(state: GameState, dt: number): void;
  /** Arena effects. Only call while the Hunt screen is visible. */
  showEvents(events: GameEvent[]): void;
}

export interface HuntActions {
  start(areaId: string, kind: RunKind): void;
  tap(x: number, y: number): void;
  move(x: number, y: number): void;
  end(): void;
  close(): void;
}

const CONFIRM_MS = 3000;

/** Hunt tab: area map, the live arena during a run, and the results screen after it. */
export function createHuntView(root: HTMLElement, actions: HuntActions): HuntView {
  root.innerHTML = `
    <div class="area-map" data-map>
      <h2 class="section-title">Choose a hunting ground</h2>
      <p class="muted map-hint" data-runlength></p>
      <div class="area-cards" data-cards></div>
    </div>
    <div class="run" data-run hidden>
      <div class="run-hud">
        <div class="run-title" data-runtitle></div>
        <div class="timerbar"><div class="timerbar-fill" data-timerfill></div><span class="timerbar-text" data-timertext></span></div>
        <div class="run-tally" data-tally></div>
      </div>
      <div class="arena-wrap" data-arenawrap><canvas class="arena" data-canvas></canvas></div>
      <div class="run-controls">
        <button type="button" class="btn btn-secondary" data-move>🚶 Move</button>
        <span class="muted run-hint" data-hint></span>
        <button type="button" class="btn btn-danger" data-end></button>
      </div>
      <div class="results" data-results hidden></div>
    </div>
  `;

  const q = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel)!;
  const mapEl = q('[data-map]');
  const runLengthEl = q('[data-runlength]');
  const cardsEl = q('[data-cards]');
  const runEl = q('[data-run]');
  const runTitleEl = q('[data-runtitle]');
  const timerFill = q('[data-timerfill]');
  const timerText = q('[data-timertext]');
  const tallyEl = q('[data-tally]');
  const wrapEl = q('[data-arenawrap]');
  const canvas = q<HTMLCanvasElement>('[data-canvas]');
  const moveBtn = q<HTMLButtonElement>('[data-move]');
  const hintEl = q('[data-hint]');
  const endBtn = q<HTMLButtonElement>('[data-end]');
  const resultsEl = q('[data-results]');

  const arena = createArenaRenderer(canvas, wrapEl);
  new ResizeObserver(() => arena.resize()).observe(wrapEl);

  let moveMode = false;
  let endConfirmUntil = 0;
  let currentRun: RunState | null = null;
  let resultsShownFor: RunState | null = null;

  // --- Map ---
  const cards = AREAS.map((area) => {
    const card = document.createElement('div');
    card.className = 'area-card';
    card.innerHTML = `
      <div class="area-card-head">
        <span class="area-card-icon" data-icon></span>
        <div class="area-card-text">
          <div class="area-card-name">${escapeHtml(area.name)}</div>
          <div class="muted area-card-sub" data-sub></div>
        </div>
      </div>
      <div class="area-card-actions">
        <button type="button" class="btn" data-hunt>Hunt</button>
        <button type="button" class="btn btn-danger" data-boss></button>
      </div>`;
    const huntBtn = card.querySelector<HTMLButtonElement>('[data-hunt]')!;
    const bossBtn = card.querySelector<HTMLButtonElement>('[data-boss]')!;
    huntBtn.addEventListener('click', () => actions.start(area.id, 'hunt'));
    bossBtn.addEventListener('click', () => actions.start(area.id, 'boss'));
    cardsEl.appendChild(card);
    return {
      area,
      card,
      icon: card.querySelector<HTMLElement>('[data-icon]')!,
      sub: card.querySelector<HTMLElement>('[data-sub]')!,
      huntBtn,
      bossBtn,
    };
  });

  function renderMap(state: GameState): void {
    runLengthEl.textContent = `Runs last ${runSeconds(levelForXp(state.xp))}s at your level. Level up for longer runs.`;
    for (const c of cards) {
      const unlocked = isAreaUnlocked(state, c.area.id);
      const keys = keysHeld(state, c.area.id);
      const lesser = c.area.creatures.map((id) => CREATURES[id].name + 's').join(', ');
      c.card.classList.toggle('locked', !unlocked);
      c.icon.textContent = unlocked ? CREATURES[c.area.creatures[0]!].icon : '🔒';
      c.sub.textContent = unlocked
        ? `${lesser} · Boss: ${CREATURES[c.area.boss].name}`
        : `Defeat the ${CREATURES[previousArea(c.area.id)?.boss ?? c.area.boss].name} to unlock`;
      c.huntBtn.disabled = !unlocked;
      c.bossBtn.disabled = !canStartRun(state, c.area.id, 'boss');
      c.bossBtn.textContent = `Boss room · 🗝️ ${keys}`;
    }
  }

  // --- Run ---
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const { x, y } = arena.toWorld(e.clientX, e.clientY);
    if (moveMode) {
      moveMode = false;
      actions.move(x, y);
    } else {
      actions.tap(x, y);
    }
  });
  moveBtn.addEventListener('click', () => {
    moveMode = !moveMode;
  });
  endBtn.addEventListener('click', () => {
    // Two taps so a run isn't thrown away by accident.
    if (performance.now() < endConfirmUntil) {
      endConfirmUntil = 0;
      actions.end();
    } else {
      endConfirmUntil = performance.now() + CONFIRM_MS;
    }
  });
  resultsEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-result]');
    if (!btn || btn.disabled || !currentRun) return;
    if (btn.dataset.result === 'again') {
      const { areaId, kind } = currentRun;
      actions.close();
      actions.start(areaId, kind);
    } else {
      actions.close();
    }
  });

  function renderHud(run: RunState): void {
    const area = areaById(run.areaId)!;
    runTitleEl.textContent = run.kind === 'boss' ? `${CREATURES[area.boss].name}'s Lair` : area.name;
    const left = timeLeft(run);
    if (left === null) {
      timerFill.style.width = '100%';
      timerText.textContent = 'No time limit';
    } else {
      timerFill.style.width = `${(left / run.duration!) * 100}%`;
      timerText.textContent = `${Math.ceil(left)}s`;
    }
    const l = run.loot;
    tallyEl.textContent = `⚔️ ${l.kills}   🪙 ${formatNumber(l.gold)}   ✨ ${formatNumber(l.xp)}   🎁 ${l.items.length}   🗝️ ${l.keys}`;
    moveBtn.classList.toggle('armed', moveMode);
    hintEl.textContent = moveMode ? 'Tap where to go' : 'Tap to strike';
    const armed = performance.now() < endConfirmUntil;
    endBtn.textContent = armed ? 'Tap again' : run.kind === 'boss' ? 'Leave' : 'End run';
    endBtn.classList.toggle('armed', armed);
  }

  function resultsHtml(state: GameState, run: RunState): string {
    const l = run.loot;
    const title =
      run.endReason === 'time' ? "Time's up!" : run.endReason === 'cleared' ? 'Boss room cleared!' : 'Run ended';
    const levelNow = levelForXp(state.xp);
    const counts = new Map<ItemId, number>();
    for (const id of l.items) counts.set(id, (counts.get(id) ?? 0) + 1);
    const items = [...counts.entries()]
      .map(
        ([id, n]) => `
        <div class="log-item">
          <div class="log-orb rarity-bg-${ITEMS[id].rarity}">
            <span class="log-item-icon">${ITEMS[id].icon}</span>
            ${n > 1 ? `<span class="log-badge">${n}</span>` : ''}
          </div>
          <span class="log-item-name">${escapeHtml(ITEMS[id].name)}</span>
        </div>`,
      )
      .join('');
    const canAgain = canStartRun(state, run.areaId, run.kind);
    return `
      <div class="results-card">
        <h2 class="results-title">${title}</h2>
        <dl class="statlist">
          <dt>Kills</dt><dd>${l.kills}</dd>
          <dt>Gold</dt><dd>${formatNumber(l.gold)}</dd>
          <dt>XP</dt><dd>${formatNumber(l.xp)}</dd>
          <dt>Level</dt><dd>${levelNow > run.startLevel ? `${run.startLevel} → ${levelNow}` : levelNow}</dd>
          ${run.kind === 'hunt' ? `<dt>Keys found</dt><dd>${l.keys}</dd>` : `<dt>Bosses defeated</dt><dd>${l.bossesDefeated}</dd>`}
        </dl>
        <h3 class="log-area">Loot</h3>
        ${items ? `<div class="log-items">${items}</div>` : '<p class="muted">No items this time.</p>'}
        <div class="results-actions">
          <button type="button" class="btn" data-result="again" ${canAgain ? '' : 'disabled'}>
            ${run.kind === 'boss' ? `Go again · 🗝️ ${keysHeld(state, run.areaId)}` : 'Go again'}
          </button>
          <button type="button" class="btn btn-secondary" data-result="map">Return to map</button>
        </div>
      </div>`;
  }

  return {
    render(state, dt) {
      const run = state.run;
      if (run !== currentRun) {
        // New run (or back to the map): reset transient UI.
        currentRun = run;
        moveMode = false;
        endConfirmUntil = 0;
        resultsShownFor = null;
        arena.clear();
      }
      mapEl.hidden = run !== null;
      runEl.hidden = run === null;
      if (!run) {
        renderMap(state);
        return;
      }
      if (canvas.width === 0) arena.resize();
      renderHud(run);
      arena.draw(run, dt, moveMode);
      resultsEl.hidden = !run.ended;
      if (run.ended && resultsShownFor !== run) {
        resultsShownFor = run;
        resultsEl.innerHTML = resultsHtml(state, run);
      }
    },

    showEvents(events) {
      arena.showEvents(events);
    },
  };
}

import './ui/styles.css';
import { CONFIG } from './config';
import { tap, tick } from './game/combat';
import { loadGame, saveGame } from './save';
import { createHuntView } from './ui/hunt';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app');

const state = loadGame();
const hunt = createHuntView(root, () => hunt.showEvents(tap(state)));

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, CONFIG.tick.maxDeltaSeconds);
  last = now;
  hunt.showEvents(tick(state, dt));
  hunt.render(state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Save every few seconds and whenever the page is hidden or closed.
setInterval(() => saveGame(state), CONFIG.save.intervalMs);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame(state);
});
window.addEventListener('pagehide', () => saveGame(state));

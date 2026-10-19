import './ui/styles.css';
import { CONFIG } from './config';
import { equip, sell, sellAllOf, sellBag, unequip } from './game/items';
import { closeRun, commandMove, endRun, startRun, tapAt, tickRun } from './game/run';
import { buy, refreshShop, updateShop } from './game/shop';
import { loadGame, saveGame } from './save';
import { createCollectionView } from './ui/collection';
import { createGearView } from './ui/gear';
import { createHomeView } from './ui/home';
import { createHuntView } from './ui/hunt';
import { createShell } from './ui/shell';
import { createShopView } from './ui/shop';
import { toastEvents } from './ui/toast';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app');

const state = loadGame();
updateShop(state, Date.now());

const shell = createShell(root, 'home');
const home = createHomeView(shell.screens.home);
const hunt = createHuntView(shell.screens.hunt, {
  start: (areaId, kind) => startRun(state, areaId, kind),
  tap: (x, y) => {
    const events = tapAt(state, x, y);
    hunt.showEvents(events);
    toastEvents(events);
  },
  move: (x, y) => commandMove(state, x, y),
  end: () => endRun(state, 'left'),
  close: () => closeRun(state),
});
const gear = createGearView(shell.screens.gear, {
  equip: (uid, slot) => equip(state, uid, slot),
  unequip: (slot) => unequip(state, slot),
  sell: (uid) => sell(state, uid),
  sellAllOf: (itemId) => sellAllOf(state, itemId),
  sellBag: () => sellBag(state),
});
const shop = createShopView(shell.screens.shop, {
  buy: (index) => buy(state, index),
  refresh: () => refreshShop(state, Date.now()),
});
const collection = createCollectionView(shell.screens.log);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, CONFIG.tick.maxDeltaSeconds);
  last = now;
  const wallClock = Date.now();

  // The game only advances during a run.
  const events = tickRun(state, dt);
  updateShop(state, wallClock);
  toastEvents(events);

  shell.renderTopbar(state);
  switch (shell.active()) {
    case 'home':
      home.render(state);
      break;
    case 'hunt':
      hunt.showEvents(events);
      hunt.render(state, dt);
      break;
    case 'gear':
      gear.render(state);
      break;
    case 'shop':
      shop.render(state, wallClock);
      break;
    case 'log':
      collection.render(state);
      break;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Save every few seconds and whenever the page is hidden or closed.
setInterval(() => saveGame(state), CONFIG.save.intervalMs);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame(state);
});
window.addEventListener('pagehide', () => saveGame(state));

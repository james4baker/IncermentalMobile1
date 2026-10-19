import { playerStats } from '../game/player';
import { areaById } from '../game/progression';
import { EQUIP_SLOTS, type GameState } from '../game/state';
import { AREAS } from '../data/areas';
import { CREATURES } from '../data/creatures';
import { figureSvg } from './figure';
import { formatNumber } from './format';
import { formatPct } from './itemText';

export interface HomeView {
  render(state: GameState): void;
}

/** Player overview: figure wearing current gear, plus stats. */
export function createHomeView(root: HTMLElement): HomeView {
  const rows = [
    ['damage', 'Damage'],
    ['speed', 'Attack speed'],
    ['double', 'Double hit'],
    ['gear', 'Gear bonus'],
    ['kills', 'Kills'],
    ['bosses', 'Bosses defeated'],
    ['activity', 'Currently'],
  ] as const;

  root.innerHTML = `
    <div class="home">
      <div class="figure" data-figure></div>
      <div class="home-name">Adventurer</div>
      <dl class="statlist">
        ${rows.map(([key, label]) => `<dt>${label}</dt><dd data-stat="${key}"></dd>`).join('')}
      </dl>
    </div>
  `;

  const figureEl = root.querySelector<HTMLElement>('[data-figure]')!;
  const statEls = Object.fromEntries(
    rows.map(([key]) => [key, root.querySelector<HTMLElement>(`[data-stat="${key}"]`)!]),
  ) as Record<(typeof rows)[number][0], HTMLElement>;

  let figureKey = '';

  return {
    render(state) {
      const key = EQUIP_SLOTS.map((s) => state.equipment[s]?.itemId ?? '-').join(',');
      if (key !== figureKey) {
        figureKey = key;
        figureEl.innerHTML = figureSvg(state);
      }

      const stats = playerStats(state);
      const run = state.run;
      const area = run ? areaById(run.areaId) : undefined;
      statEls.damage.textContent = formatNumber(stats.damage);
      statEls.speed.textContent = `${stats.attacksPerSecond.toFixed(2)} / s`;
      statEls.double.textContent = formatPct(stats.doubleHitChance * 100);
      statEls.gear.textContent = `+${formatPct(stats.gear.damagePct)} dmg · +${formatPct(stats.gear.speedPct)} speed`;
      statEls.kills.textContent = formatNumber(state.kills);
      statEls.bosses.textContent = `${state.bossesDefeated.length} / ${AREAS.length}`;
      statEls.activity.textContent = !run || !area || run.ended
        ? 'Resting in town'
        : run.kind === 'boss'
          ? `Fighting the ${CREATURES[area.boss].name}`
          : `Hunting in the ${area.name}`;
    },
  };
}

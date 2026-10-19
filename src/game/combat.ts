import Decimal from 'break_infinity.js';
import { CONFIG } from '../config';
import type { GameState } from './state';

export type GameEvent =
  | { type: 'damage'; amount: Decimal; source: 'auto' | 'tap' }
  | { type: 'kill'; gold: Decimal; xp: Decimal };

export function creatureMaxHp(state: GameState): Decimal {
  return new Decimal(CONFIG.creatures[state.creatureId].maxHp);
}

function autoDamage(): Decimal {
  return new Decimal(CONFIG.player.baseDamage);
}

function tapDamage(): Decimal {
  return new Decimal(CONFIG.player.baseDamage * CONFIG.player.tapDamageMultiplier);
}

function dealDamage(state: GameState, amount: Decimal, source: 'auto' | 'tap', events: GameEvent[]): void {
  state.creatureHp = state.creatureHp.sub(amount);
  events.push({ type: 'damage', amount, source });

  if (state.creatureHp.lte(0)) {
    const reward = CONFIG.creatures[state.creatureId];
    const gold = new Decimal(reward.gold);
    const xp = new Decimal(reward.xp);
    state.gold = state.gold.add(gold);
    state.xp = state.xp.add(xp);
    state.kills += 1;
    state.creatureHp = creatureMaxHp(state);
    events.push({ type: 'kill', gold, xp });
  }
}

/** Advance the game by dt seconds. Returns events for the UI to react to. */
export function tick(state: GameState, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  const interval = 1 / CONFIG.player.attacksPerSecond;

  state.attackProgress += dt;
  while (state.attackProgress >= interval) {
    state.attackProgress -= interval;
    dealDamage(state, autoDamage(), 'auto', events);
  }
  return events;
}

/** Player tapped the creature. */
export function tap(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  dealDamage(state, tapDamage(), 'tap', events);
  return events;
}

import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId, type ItemId } from '../config';
import { killCount, recordKill } from './collection';
import { addItem } from './items';
import { levelForXp } from './levels';
import { rollLoot } from './loot';
import { playerStats } from './player';
import { currentArea, enterLair, keysHeld, nextArea, spawn } from './progression';
import type { GameState } from './state';

export type GameEvent =
  | { type: 'damage'; amount: Decimal; source: 'auto' | 'tap'; double: boolean }
  | { type: 'kill'; gold: Decimal; xp: Decimal }
  | { type: 'loot'; itemIds: ItemId[] }
  | { type: 'firstKill'; creatureId: CreatureId }
  | { type: 'collection'; creatureId: CreatureId; itemIds: ItemId[] }
  | { type: 'key'; areaId: string }
  | { type: 'levelUp'; level: number }
  | { type: 'bossDefeated'; areaId: string; unlockedAreaId?: string };

export function creatureMaxHp(state: GameState): Decimal {
  return new Decimal(CONFIG.creatures[state.creatureId].maxHp);
}

function onKill(state: GameState, events: GameEvent[]): void {
  const reward = CONFIG.creatures[state.creatureId];
  const area = currentArea(state);
  const levelBefore = levelForXp(state.xp);

  const gold = new Decimal(reward.gold);
  const xp = new Decimal(reward.xp);
  state.gold = state.gold.add(gold);
  state.xp = state.xp.add(xp);
  state.kills += 1;
  events.push({ type: 'kill', gold, xp });

  const drops = rollLoot(state.creatureId);
  for (const itemId of drops) addItem(state, itemId);
  if (drops.length > 0) events.push({ type: 'loot', itemIds: drops });

  const newEntries = recordKill(state, state.creatureId, drops);
  if (killCount(state, state.creatureId) === 1) events.push({ type: 'firstKill', creatureId: state.creatureId });
  if (newEntries.length > 0) events.push({ type: 'collection', creatureId: state.creatureId, itemIds: newEntries });

  const levelAfter = levelForXp(state.xp);
  if (levelAfter > levelBefore) events.push({ type: 'levelUp', level: levelAfter });

  if (state.inLair) {
    const firstDefeat = !state.bossesDefeated.includes(area.id);
    if (firstDefeat) state.bossesDefeated.push(area.id);
    state.inLair = false;
    events.push({ type: 'bossDefeated', areaId: area.id, unlockedAreaId: firstDefeat ? nextArea(area.id)?.id : undefined });
    // With keys left, stay in the lair and fight the next boss; otherwise go back to lesser creatures.
    if (!enterLair(state)) spawn(state, area.creatures[0]!);
    return;
  }

  if (Math.random() < reward.keyChance) {
    state.keys[area.id] = keysHeld(state, area.id) + 1;
    events.push({ type: 'key', areaId: area.id });
  }
  spawn(state, state.creatureId);
}

function hit(state: GameState, amount: Decimal, source: 'auto' | 'tap', double: boolean, events: GameEvent[]): void {
  state.creatureHp = state.creatureHp.sub(amount);
  events.push({ type: 'damage', amount, source, double });
  if (state.creatureHp.lte(0)) onKill(state, events);
}

/** One attack, which may strike twice. A second strike after a kill lands on the next creature. */
function attack(state: GameState, amount: Decimal, source: 'auto' | 'tap', doubleHitChance: number, events: GameEvent[]): void {
  hit(state, amount, source, false, events);
  if (Math.random() < doubleHitChance) hit(state, amount, source, true, events);
}

/** Advance the game by dt seconds. Returns events for the UI to react to. */
export function tick(state: GameState, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  state.attackProgress += dt;
  for (;;) {
    const stats = playerStats(state);
    const interval = 1 / stats.attacksPerSecond;
    if (state.attackProgress < interval) break;
    state.attackProgress -= interval;
    attack(state, stats.damage, 'auto', stats.doubleHitChance, events);
  }
  return events;
}

/** Player tapped the creature. */
export function tap(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  const stats = playerStats(state);
  attack(state, stats.tapDamage, 'tap', stats.doubleHitChance, events);
  return events;
}

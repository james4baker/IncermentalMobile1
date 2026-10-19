import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId } from '../config';
import { rollAffixes } from './affixes';
import { killCount, recordKill } from './collection';
import type { GameEvent } from './events';
import { addItem } from './items';
import { levelForXp } from './levels';
import { rollLoot } from './loot';
import { playerStats, runDuration } from './player';
import { areaById, isAreaUnlocked, keysHeld, nextArea, spendKey } from './progression';
import type { Enemy, GameState, RunKind, RunState } from './state';

const A = CONFIG.arena;

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** Move (x, y) toward (tx, ty) by at most `step`. */
function stepToward(p: { x: number; y: number }, tx: number, ty: number, step: number): void {
  const d = dist(p.x, p.y, tx, ty);
  if (d <= step) {
    p.x = tx;
    p.y = ty;
  } else {
    p.x += ((tx - p.x) / d) * step;
    p.y += ((ty - p.y) / d) * step;
  }
}

export function canStartRun(state: GameState, areaId: string, kind: RunKind): boolean {
  if (!areaById(areaId) || !isAreaUnlocked(state, areaId)) return false;
  return kind === 'hunt' || keysHeld(state, areaId) > 0;
}

function spawnEnemy(run: RunState, creatureId: CreatureId, isBoss: boolean, rng: () => number): void {
  const r = isBoss ? A.bossRadius : A.enemyRadius;
  let x = 0;
  let y = 0;
  // Try a few spots away from the player; fall back to the last one.
  for (let i = 0; i < 10; i++) {
    x = r + rng() * (A.width - 2 * r);
    y = r + rng() * (A.height - 2 * r);
    if (dist(x, y, run.player.x, run.player.y) >= A.spawnMinDistance) break;
  }
  const maxHp = new Decimal(CONFIG.creatures[creatureId].maxHp);
  run.enemies.push({
    id: run.nextEnemyId++,
    creatureId,
    isBoss,
    hp: maxHp,
    maxHp,
    x,
    y,
    heading: rng() * Math.PI * 2,
    wanderTimer: 1 + rng() * 2,
  });
}

/** Start a run. Boss rooms spend one key. */
export function startRun(state: GameState, areaId: string, kind: RunKind, rng: () => number = Math.random): boolean {
  if (!canStartRun(state, areaId, kind)) return false;
  const area = areaById(areaId)!;
  if (kind === 'boss') spendKey(state, areaId);

  const level = levelForXp(state.xp);
  const run: RunState = {
    kind,
    areaId,
    duration: kind === 'hunt' ? runDuration(state) : null,
    elapsed: 0,
    startLevel: level,
    player: { x: A.width / 2, y: A.height / 2, moveTarget: null, targetId: null, cooldown: 0 },
    enemies: [],
    nextEnemyId: 1,
    spawnTimer: 0,
    loot: { gold: new Decimal(0), xp: new Decimal(0), kills: 0, items: [], keys: 0, bossesDefeated: 0 },
    ended: false,
    endReason: null,
  };
  if (kind === 'boss') {
    spawnEnemy(run, area.boss, true, rng);
  } else {
    for (let i = 0; i < A.maxEnemies; i++) spawnEnemy(run, area.creatures[i % area.creatures.length]!, false, rng);
  }
  state.run = run;
  return true;
}

export function endRun(state: GameState, reason: RunState['endReason'] = 'left'): void {
  if (!state.run || state.run.ended) return;
  state.run.ended = true;
  state.run.endReason = reason;
  state.run.enemies = [];
}

/** Leave the results screen. */
export function closeRun(state: GameState): void {
  state.run = null;
}

export function timeLeft(run: RunState): number | null {
  return run.duration === null ? null : Math.max(0, run.duration - run.elapsed);
}

/** Send the player to a spot; they hunt again once they arrive. */
export function commandMove(state: GameState, x: number, y: number): void {
  const run = state.run;
  if (!run || run.ended) return;
  run.player.moveTarget = {
    x: Math.min(A.width - A.playerRadius, Math.max(A.playerRadius, x)),
    y: Math.min(A.height - A.playerRadius, Math.max(A.playerRadius, y)),
  };
}

/** Apply a % bonus to a whole-number reward, rounding the fraction up by chance so small bonuses still count. */
function scaledReward(base: number, multiplier: number, rng: () => number): Decimal {
  const raw = base * multiplier;
  const whole = Math.floor(raw);
  return new Decimal(whole + (rng() < raw - whole ? 1 : 0));
}

function onKill(state: GameState, run: RunState, enemy: Enemy, events: GameEvent[], rng: () => number): void {
  const reward = CONFIG.creatures[enemy.creatureId];
  const area = areaById(run.areaId)!;
  const levelBefore = levelForXp(state.xp);

  const stats = playerStats(state);
  const gold = scaledReward(reward.gold, stats.goldMultiplier, rng);
  const xp = scaledReward(reward.xp, stats.xpMultiplier, rng);
  state.gold = state.gold.add(gold);
  state.xp = state.xp.add(xp);
  state.kills += 1;
  run.loot.gold = run.loot.gold.add(gold);
  run.loot.xp = run.loot.xp.add(xp);
  run.loot.kills += 1;
  run.enemies = run.enemies.filter((e) => e.id !== enemy.id);
  if (run.player.targetId === enemy.id) run.player.targetId = null;
  events.push({ type: 'kill', creatureId: enemy.creatureId, gold, xp, x: enemy.x, y: enemy.y });

  const drops = rollLoot(enemy.creatureId, rng);
  const dropped = drops.map((itemId) => addItem(state, itemId, rollAffixes(itemId, enemy.creatureId, rng)));
  run.loot.items.push(...dropped.map((i) => ({ ...i })));
  if (dropped.length > 0) events.push({ type: 'loot', items: dropped });

  const newEntries = recordKill(state, enemy.creatureId, drops);
  if (killCount(state, enemy.creatureId) === 1) events.push({ type: 'firstKill', creatureId: enemy.creatureId });
  if (newEntries.length > 0) events.push({ type: 'collection', creatureId: enemy.creatureId, itemIds: newEntries });

  const levelAfter = levelForXp(state.xp);
  if (levelAfter > levelBefore) events.push({ type: 'levelUp', level: levelAfter });

  if (enemy.isBoss) {
    const firstDefeat = !state.bossesDefeated.includes(area.id);
    if (firstDefeat) state.bossesDefeated.push(area.id);
    run.loot.bossesDefeated += 1;
    events.push({ type: 'bossDefeated', areaId: area.id, unlockedAreaId: firstDefeat ? nextArea(area.id)?.id : undefined });
    // With keys left, the next boss steps in; otherwise the room is cleared.
    if (spendKey(state, area.id)) {
      spawnEnemy(run, area.boss, true, rng);
    } else {
      endRun(state, 'cleared');
      events.push({ type: 'runEnded' });
    }
    return;
  }

  if (rng() < reward.keyChance) {
    state.keys[area.id] = keysHeld(state, area.id) + 1;
    run.loot.keys += 1;
    events.push({ type: 'key', areaId: area.id });
  }
}

function hit(
  state: GameState,
  run: RunState,
  enemy: Enemy,
  amount: Decimal,
  source: 'auto' | 'tap',
  double: boolean,
  events: GameEvent[],
  rng: () => number,
): void {
  enemy.hp = enemy.hp.sub(amount);
  events.push({ type: 'damage', amount, source, double, x: enemy.x, y: enemy.y });
  if (enemy.hp.lte(0)) onKill(state, run, enemy, events, rng);
}

/** One attack on one enemy, which may strike twice if the enemy survives the first. */
function attack(state: GameState, run: RunState, enemy: Enemy, amount: Decimal, source: 'auto' | 'tap', events: GameEvent[], rng: () => number): void {
  const doubleChance = playerStats(state).doubleHitChance;
  hit(state, run, enemy, amount, source, false, events, rng);
  if (!run.ended && enemy.hp.gt(0) && rng() < doubleChance) hit(state, run, enemy, amount, source, true, events, rng);
}

/** Tap strike: hits every enemy within tapRadius of (x, y). */
export function tapAt(state: GameState, x: number, y: number, rng: () => number = Math.random): GameEvent[] {
  const run = state.run;
  if (!run || run.ended) return [];
  const stats = playerStats(state);
  const events: GameEvent[] = [{ type: 'tap', x, y, radius: stats.tapRadius }];
  const amount = stats.tapDamage;
  const targets = run.enemies.filter((e) => dist(e.x, e.y, x, y) <= stats.tapRadius + (e.isBoss ? A.bossRadius : A.enemyRadius));
  for (const enemy of targets) {
    if (run.ended) break;
    attack(state, run, enemy, amount, 'tap', events, rng);
  }
  return events;
}

function nearestEnemy(run: RunState): Enemy | undefined {
  let best: Enemy | undefined;
  let bestD = Infinity;
  for (const e of run.enemies) {
    const d = dist(e.x, e.y, run.player.x, run.player.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function reach(enemy: Enemy): number {
  return A.attackRange + (enemy.isBoss ? A.bossRadius - A.enemyRadius : 0);
}

function wander(enemy: Enemy, h: number, rng: () => number): void {
  const r = enemy.isBoss ? A.bossRadius : A.enemyRadius;
  const speed = enemy.isBoss ? A.bossSpeed : A.enemySpeed;
  enemy.wanderTimer -= h;
  if (enemy.wanderTimer <= 0) {
    enemy.heading = rng() * Math.PI * 2;
    enemy.wanderTimer = 1 + rng() * 2;
  }
  enemy.x += Math.cos(enemy.heading) * speed * h;
  enemy.y += Math.sin(enemy.heading) * speed * h;
  // Bounce off the walls.
  if (enemy.x < r || enemy.x > A.width - r) {
    enemy.heading = Math.PI - enemy.heading;
    enemy.x = Math.min(A.width - r, Math.max(r, enemy.x));
  }
  if (enemy.y < r || enemy.y > A.height - r) {
    enemy.heading = -enemy.heading;
    enemy.y = Math.min(A.height - r, Math.max(r, enemy.y));
  }
}

function step(state: GameState, run: RunState, h: number, events: GameEvent[], rng: () => number): void {
  run.elapsed += h;
  if (run.duration !== null && run.elapsed >= run.duration) {
    endRun(state, 'time');
    events.push({ type: 'runEnded' });
    return;
  }

  for (const e of run.enemies) wander(e, h, rng);

  if (run.kind === 'hunt' && run.enemies.length < A.maxEnemies) {
    run.spawnTimer -= h;
    if (run.spawnTimer <= 0) {
      const area = areaById(run.areaId)!;
      const pick = area.creatures[Math.floor(rng() * area.creatures.length)]!;
      spawnEnemy(run, pick, false, rng);
      run.spawnTimer = A.spawnInterval;
    }
  }

  const p = run.player;
  p.cooldown = Math.max(0, p.cooldown - h);

  // Keep a target: the current one if it's still alive, else the nearest.
  let target = run.enemies.find((e) => e.id === p.targetId);
  if (!target) {
    target = nearestEnemy(run);
    p.targetId = target?.id ?? null;
  }

  if (p.moveTarget) {
    stepToward(p, p.moveTarget.x, p.moveTarget.y, A.playerSpeed * h);
    if (p.x === p.moveTarget.x && p.y === p.moveTarget.y) p.moveTarget = null;
  } else if (target && dist(p.x, p.y, target.x, target.y) > reach(target) * 0.8) {
    stepToward(p, target.x, target.y, A.playerSpeed * h);
  }

  // Attack the target if it's in reach, otherwise anything in reach (e.g. while being moved).
  if (p.cooldown <= 0) {
    const inReach =
      target && dist(p.x, p.y, target.x, target.y) <= reach(target)
        ? target
        : run.enemies.find((e) => dist(p.x, p.y, e.x, e.y) <= reach(e));
    if (inReach) {
      const stats = playerStats(state);
      p.cooldown = 1 / stats.attacksPerSecond;
      events.push({ type: 'swing', fromX: p.x, fromY: p.y, toX: inReach.x, toY: inReach.y });
      attack(state, run, inReach, stats.damage, 'auto', events, rng);
    }
  }
}

/** Advance the current run by dt seconds. Does nothing outside a run. */
export function tickRun(state: GameState, dt: number, rng: () => number = Math.random): GameEvent[] {
  const events: GameEvent[] = [];
  const run = state.run;
  if (!run || run.ended) return events;
  let remaining = dt;
  while (remaining > 0 && !run.ended) {
    const h = Math.min(remaining, CONFIG.tick.maxStepSeconds);
    remaining -= h;
    step(state, run, h, events, rng);
  }
  return events;
}

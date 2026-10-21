import { CONFIG, type CreatureId } from '../config';
import { CREATURES } from '../data/creatures';
import type { TileFight, TileWave } from './state';

const A = CONFIG.arena;
const T = CONFIG.tileFight;

export const TILE_COUNT = 4;

export function isTileBoss(creatureId: CreatureId): boolean {
  return CREATURES[creatureId].mechanic === 'tiles';
}

/** The boss stands at the arena centre. */
export function tileBossPosition(): { x: number; y: number } {
  return { x: A.width / 2, y: A.height / 2 };
}

/** Tiles: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right, around the boss. */
export function tileCenter(i: number): { x: number; y: number } {
  const c = tileBossPosition();
  return { x: c.x + (i % 2 === 0 ? -1 : 1) * T.tileOffset, y: c.y + (i < 2 ? -1 : 1) * T.tileOffset };
}

export function tileAt(x: number, y: number): number | null {
  for (let i = 0; i < TILE_COUNT; i++) {
    const c = tileCenter(i);
    if (Math.abs(x - c.x) <= T.tileSize / 2 && Math.abs(y - c.y) <= T.tileSize / 2) return i;
  }
  return null;
}

export function newTileFight(playerTile = 2): TileFight {
  return { lives: T.lives, playerTile, wave: null, nextWave: T.firstWaveSeconds };
}

export function randomWave(rng: () => number): TileWave {
  if (rng() < T.redChance) {
    const safe = Math.floor(rng() * TILE_COUNT);
    return { kind: 'red', tiles: Array.from({ length: TILE_COUNT }, (_, i) => i !== safe), age: 0, struck: false };
  }
  const tiles = Array.from({ length: TILE_COUNT }, () => false);
  for (let placed = 0; placed < Math.min(T.blueTiles, TILE_COUNT); ) {
    const i = Math.floor(rng() * TILE_COUNT);
    if (!tiles[i]) {
      tiles[i] = true;
      placed++;
    }
  }
  return { kind: 'blue', tiles, age: 0, struck: false };
}

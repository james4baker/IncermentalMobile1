import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId } from './config';
import { createInitialState, type GameState } from './game/state';

/** On-disk format. Decimals are stored as strings. Bump CONFIG.save.version and add a migration when this changes. */
interface SaveDataV1 {
  version: 1;
  savedAt: number;
  gold: string;
  xp: string;
  creatureId: string;
  creatureHp: string;
  kills: number;
}

type AnySave = SaveDataV1;

function serialize(state: GameState): SaveDataV1 {
  return {
    version: 1,
    savedAt: Date.now(),
    gold: state.gold.toString(),
    xp: state.xp.toString(),
    creatureId: state.creatureId,
    creatureHp: state.creatureHp.toString(),
    kills: state.kills,
  };
}

/** Upgrade older save formats to the current one. Add cases here as versions are added. */
function migrate(data: AnySave): SaveDataV1 {
  return data;
}

function decimalOr(value: unknown, fallback: Decimal): Decimal {
  if (typeof value !== 'string') return fallback;
  const d = new Decimal(value);
  return Number.isNaN(d.mantissa) ? fallback : d;
}

function deserialize(data: SaveDataV1): GameState {
  const state = createInitialState();
  state.gold = decimalOr(data.gold, state.gold);
  state.xp = decimalOr(data.xp, state.xp);
  if (data.creatureId in CONFIG.creatures) {
    state.creatureId = data.creatureId as CreatureId;
    state.creatureHp = decimalOr(data.creatureHp, state.creatureHp);
  }
  state.kills = typeof data.kills === 'number' ? data.kills : 0;
  return state;
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(CONFIG.save.key, JSON.stringify(serialize(state)));
  } catch (err) {
    console.warn('Save failed', err);
  }
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(CONFIG.save.key);
    if (!raw) return createInitialState();
    const data = JSON.parse(raw) as AnySave;
    if (typeof data?.version !== 'number' || data.version > CONFIG.save.version) {
      console.warn('Unrecognised save version, starting fresh');
      return createInitialState();
    }
    return deserialize(migrate(data));
  } catch (err) {
    console.warn('Load failed, starting fresh', err);
    return createInitialState();
  }
}

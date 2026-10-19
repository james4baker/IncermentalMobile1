import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId, type ItemId } from './config';
import { AREAS } from './data/areas';
import { ITEMS } from './data/items';
import { slotsFor } from './game/items';
import { createInitialState, EQUIP_SLOTS, type GameState, type ItemInstance } from './game/state';

/** On-disk formats. Decimals are stored as strings. Bump CONFIG.save.version and add a migration when this changes. */
interface SaveDataV1 {
  version: 1;
  savedAt: number;
  gold: string;
  xp: string;
  creatureId: string;
  creatureHp: string;
  kills: number;
}

interface SaveDataV2 extends Omit<SaveDataV1, 'version'> {
  version: 2;
  areaId: string;
  inLair: boolean;
  keys: Record<string, number>;
  bossesDefeated: string[];
}

interface SavedItem {
  uid: number;
  itemId: string;
}

interface SaveDataV3 extends Omit<SaveDataV2, 'version'> {
  version: 3;
  inventory: SavedItem[];
  equipment: Record<string, SavedItem | null>;
  nextItemUid: number;
  shop: { offers: { itemId: string; sold: boolean }[]; refreshedAt: number };
}

type AnySave = SaveDataV1 | SaveDataV2 | SaveDataV3;

function serialize(state: GameState): SaveDataV3 {
  return {
    version: 3,
    savedAt: Date.now(),
    gold: state.gold.toString(),
    xp: state.xp.toString(),
    areaId: state.areaId,
    creatureId: state.creatureId,
    creatureHp: state.creatureHp.toString(),
    inLair: state.inLair,
    kills: state.kills,
    keys: { ...state.keys },
    bossesDefeated: [...state.bossesDefeated],
    inventory: state.inventory.map((i) => ({ ...i })),
    equipment: Object.fromEntries(EQUIP_SLOTS.map((s) => [s, state.equipment[s] ? { ...state.equipment[s]! } : null])),
    nextItemUid: state.nextItemUid,
    shop: { offers: state.shop.offers.map((o) => ({ ...o })), refreshedAt: state.shop.refreshedAt },
  };
}

/** Upgrade older save formats to the current one. Add cases here as versions are added. */
function migrate(data: AnySave): SaveDataV3 {
  if (data.version === 1) {
    // v1 only had rats in the Sewers.
    data = { ...data, version: 2, areaId: 'sewers', inLair: false, keys: {}, bossesDefeated: [] };
  }
  if (data.version === 2) {
    data = { ...data, version: 3, inventory: [], equipment: {}, nextItemUid: 1, shop: { offers: [], refreshedAt: 0 } };
  }
  return data;
}

function decimalOr(value: unknown, fallback: Decimal): Decimal {
  if (typeof value !== 'string') return fallback;
  const d = new Decimal(value);
  return Number.isNaN(d.mantissa) ? fallback : d;
}

function isItemId(id: unknown): id is ItemId {
  return typeof id === 'string' && id in ITEMS;
}

function toItem(saved: SavedItem | null | undefined): ItemInstance | null {
  if (!saved || typeof saved.uid !== 'number' || !isItemId(saved.itemId)) return null;
  return { uid: saved.uid, itemId: saved.itemId };
}

function deserialize(data: SaveDataV3): GameState {
  const state = createInitialState();
  state.gold = decimalOr(data.gold, state.gold);
  state.xp = decimalOr(data.xp, state.xp);
  state.kills = typeof data.kills === 'number' ? data.kills : 0;

  if (Array.isArray(data.bossesDefeated)) {
    state.bossesDefeated = data.bossesDefeated.filter((id) => AREAS.some((a) => a.id === id));
  }
  if (data.keys && typeof data.keys === 'object') {
    for (const [areaId, count] of Object.entries(data.keys)) {
      if (typeof count === 'number' && count > 0) state.keys[areaId] = Math.floor(count);
    }
  }

  // Restore position only if it is still valid for the area's data.
  const area = AREAS.find((a) => a.id === data.areaId);
  if (area) {
    state.areaId = area.id;
    const inLair = data.inLair === true && data.creatureId === area.boss;
    const creatureId = inLair || area.creatures.includes(data.creatureId as CreatureId)
      ? (data.creatureId as CreatureId)
      : area.creatures[0]!;
    state.inLair = inLair;
    state.creatureId = creatureId;
    state.creatureHp = decimalOr(data.creatureHp, new Decimal(CONFIG.creatures[creatureId].maxHp));
  }

  // Items: drop any whose definition no longer exists; keep uids unique.
  let maxUid = 0;
  if (Array.isArray(data.inventory)) {
    for (const saved of data.inventory) {
      const item = toItem(saved);
      if (item) state.inventory.push(item);
    }
  }
  for (const slot of EQUIP_SLOTS) {
    const item = toItem(data.equipment?.[slot]);
    if (!item) continue;
    if (slotsFor(ITEMS[item.itemId].slot).includes(slot)) state.equipment[slot] = item;
    else state.inventory.push(item);
  }
  for (const i of state.inventory) maxUid = Math.max(maxUid, i.uid);
  for (const slot of EQUIP_SLOTS) maxUid = Math.max(maxUid, state.equipment[slot]?.uid ?? 0);
  state.nextItemUid = Math.max(maxUid + 1, typeof data.nextItemUid === 'number' ? data.nextItemUid : 1);

  if (data.shop && Array.isArray(data.shop.offers)) {
    state.shop = {
      offers: data.shop.offers.flatMap((o) => (isItemId(o.itemId) ? [{ itemId: o.itemId, sold: o.sold === true }] : [])),
      refreshedAt: typeof data.shop.refreshedAt === 'number' ? data.shop.refreshedAt : 0,
    };
  }
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

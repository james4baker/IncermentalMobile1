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

interface SaveDataV4 extends Omit<SaveDataV3, 'version'> {
  version: 4;
  killCounts: Record<string, number>;
  drops: Record<string, Record<string, number>>;
}

type AnySave = SaveDataV1 | SaveDataV2 | SaveDataV3 | SaveDataV4;

function serialize(state: GameState): SaveDataV4 {
  return {
    version: 4,
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
    killCounts: { ...state.killCounts },
    drops: Object.fromEntries(Object.entries(state.drops).map(([c, items]) => [c, { ...items }])),
  };
}

/** v3 had no collection log; estimate one so existing players don't start with an empty log. */
function estimateCollection(data: SaveDataV3): Pick<SaveDataV4, 'killCounts' | 'drops'> {
  const killCounts: Record<string, number> = {};
  const drops: Record<string, Record<string, number>> = {};
  let bossKills = 0;
  for (const area of AREAS) {
    if (data.bossesDefeated?.includes(area.id)) {
      killCounts[area.boss] = 1;
      bossKills++;
    }
  }
  const restKills = Math.max(0, (data.kills ?? 0) - bossKills);
  if (restKills > 0) killCounts[AREAS[0]!.creatures[0]!] = restKills;

  // Credit each owned item to the first creature that drops it.
  const owned = [...(data.inventory ?? []), ...Object.values(data.equipment ?? {})];
  for (const item of owned) {
    if (!item) continue;
    const source = (Object.keys(CONFIG.loot) as CreatureId[]).find((c) => CONFIG.loot[c].some((e) => e.item === item.itemId));
    if (!source) continue;
    const log = (drops[source] ??= {});
    log[item.itemId] = (log[item.itemId] ?? 0) + 1;
    killCounts[source] = Math.max(killCounts[source] ?? 0, 1);
  }
  return { killCounts, drops };
}

/** Upgrade older save formats to the current one. Add cases here as versions are added. */
function migrate(data: AnySave): SaveDataV4 {
  if (data.version === 1) {
    // v1 only had rats in the Sewers.
    data = { ...data, version: 2, areaId: 'sewers', inLair: false, keys: {}, bossesDefeated: [] };
  }
  if (data.version === 2) {
    data = { ...data, version: 3, inventory: [], equipment: {}, nextItemUid: 1, shop: { offers: [], refreshedAt: 0 } };
  }
  if (data.version === 3) {
    data = { ...data, version: 4, ...estimateCollection(data) };
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

function isCreatureId(id: unknown): id is CreatureId {
  return typeof id === 'string' && id in CONFIG.creatures;
}

function deserialize(data: SaveDataV4): GameState {
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

  for (const [c, n] of Object.entries(data.killCounts ?? {})) {
    if (isCreatureId(c) && typeof n === 'number' && n > 0) state.killCounts[c] = Math.floor(n);
  }
  for (const [c, items] of Object.entries(data.drops ?? {})) {
    if (!isCreatureId(c) || !items || typeof items !== 'object') continue;
    for (const [id, n] of Object.entries(items)) {
      if (isItemId(id) && typeof n === 'number' && n > 0) (state.drops[c] ??= {})[id] = Math.floor(n);
    }
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

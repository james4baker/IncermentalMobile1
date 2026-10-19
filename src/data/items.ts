// Item definitions (data only). Bonuses and values are in config.ts under CONFIG.items.
import type { ItemId } from '../config';

export type ItemSlot = 'head' | 'chest' | 'hands' | 'legs' | 'ring' | 'necklace';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'unique';

export interface ItemDef {
  id: ItemId;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  icon: string;
  /** Tint used on the player figure. */
  color: string;
}

const LEATHER = '#8b5a2b';
const CHAIN = '#9aa3ad';
const SPECTRAL = '#7fd1d9';
const RUNIC = '#b08d57';
const DRAGONSCALE = '#2e8b57';

export const ITEMS: Record<ItemId, ItemDef> = {
  tornLeatherCap: { id: 'tornLeatherCap', name: 'Torn Leather Cap', slot: 'head', rarity: 'common', icon: '🧢', color: LEATHER },
  tornLeatherVest: { id: 'tornLeatherVest', name: 'Torn Leather Vest', slot: 'chest', rarity: 'common', icon: '🦺', color: LEATHER },
  tornLeatherGloves: { id: 'tornLeatherGloves', name: 'Torn Leather Gloves', slot: 'hands', rarity: 'common', icon: '🧤', color: LEATHER },
  tornLeatherTrousers: { id: 'tornLeatherTrousers', name: 'Torn Leather Trousers', slot: 'legs', rarity: 'common', icon: '👖', color: LEATHER },

  chainCoif: { id: 'chainCoif', name: 'Chain Coif', slot: 'head', rarity: 'uncommon', icon: '⛑️', color: CHAIN },
  chainHauberk: { id: 'chainHauberk', name: 'Chain Hauberk', slot: 'chest', rarity: 'uncommon', icon: '🛡️', color: CHAIN },
  chainGauntlets: { id: 'chainGauntlets', name: 'Chain Gauntlets', slot: 'hands', rarity: 'uncommon', icon: '🧤', color: CHAIN },
  chainLeggings: { id: 'chainLeggings', name: 'Chain Leggings', slot: 'legs', rarity: 'uncommon', icon: '👖', color: CHAIN },

  spectralHood: { id: 'spectralHood', name: 'Spectral Hood', slot: 'head', rarity: 'rare', icon: '🎩', color: SPECTRAL },
  spectralRobe: { id: 'spectralRobe', name: 'Spectral Robe', slot: 'chest', rarity: 'rare', icon: '👘', color: SPECTRAL },
  spectralGrips: { id: 'spectralGrips', name: 'Spectral Grips', slot: 'hands', rarity: 'rare', icon: '🧤', color: SPECTRAL },
  spectralLeggings: { id: 'spectralLeggings', name: 'Spectral Leggings', slot: 'legs', rarity: 'rare', icon: '👖', color: SPECTRAL },

  runicHelm: { id: 'runicHelm', name: 'Runic Helm', slot: 'head', rarity: 'epic', icon: '⛑️', color: RUNIC },
  runicCuirass: { id: 'runicCuirass', name: 'Runic Cuirass', slot: 'chest', rarity: 'epic', icon: '🛡️', color: RUNIC },
  runicGauntlets: { id: 'runicGauntlets', name: 'Runic Gauntlets', slot: 'hands', rarity: 'epic', icon: '🧤', color: RUNIC },
  runicGreaves: { id: 'runicGreaves', name: 'Runic Greaves', slot: 'legs', rarity: 'epic', icon: '👖', color: RUNIC },

  dragonscaleHelm: { id: 'dragonscaleHelm', name: 'Dragonscale Helm', slot: 'head', rarity: 'epic', icon: '🐲', color: DRAGONSCALE },
  dragonscaleMail: { id: 'dragonscaleMail', name: 'Dragonscale Mail', slot: 'chest', rarity: 'epic', icon: '🛡️', color: DRAGONSCALE },
  dragonscaleGloves: { id: 'dragonscaleGloves', name: 'Dragonscale Gloves', slot: 'hands', rarity: 'epic', icon: '🧤', color: DRAGONSCALE },
  dragonscaleLegs: { id: 'dragonscaleLegs', name: 'Dragonscale Legs', slot: 'legs', rarity: 'epic', icon: '👖', color: DRAGONSCALE },

  copperRing: { id: 'copperRing', name: 'Copper Ring', slot: 'ring', rarity: 'common', icon: '💍', color: '#c87533' },
  silverRing: { id: 'silverRing', name: 'Silver Ring', slot: 'ring', rarity: 'uncommon', icon: '💍', color: '#d8dde3' },
  goldRing: { id: 'goldRing', name: 'Gold Ring', slot: 'ring', rarity: 'rare', icon: '💍', color: '#f2c14e' },
  platinumRing: { id: 'platinumRing', name: 'Platinum Ring', slot: 'ring', rarity: 'epic', icon: '💍', color: '#e5e4e2' },
  boneCharm: { id: 'boneCharm', name: 'Bone Charm', slot: 'necklace', rarity: 'common', icon: '📿', color: '#e8dcc0' },
  jadeAmulet: { id: 'jadeAmulet', name: 'Jade Amulet', slot: 'necklace', rarity: 'rare', icon: '📿', color: '#3fae7a' },

  ratTeethNecklace: { id: 'ratTeethNecklace', name: 'Rat Teeth Necklace', slot: 'necklace', rarity: 'unique', icon: '🦷', color: '#f4f1e6' },
  lichPhylactery: { id: 'lichPhylactery', name: "Lich's Phylactery", slot: 'necklace', rarity: 'unique', icon: '⚱️', color: '#8e44ad' },
  heartOfTheColossus: { id: 'heartOfTheColossus', name: 'Heart of the Colossus', slot: 'ring', rarity: 'unique', icon: '💠', color: '#3fa7d6' },
  eyeOfDragonia: { id: 'eyeOfDragonia', name: 'Eye of Dragonia', slot: 'ring', rarity: 'unique', icon: '👁️', color: '#c0392b' },
};

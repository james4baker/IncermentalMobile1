// Item definitions (data only). Bonuses and values are in config.ts under CONFIG.items.
import type { ItemId } from '../config';

export type ItemSlot = 'head' | 'chest' | 'hands' | 'legs' | 'ring' | 'necklace';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'unique';

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

export const ITEMS: Record<ItemId, ItemDef> = {
  tornLeatherCap: { id: 'tornLeatherCap', name: 'Torn Leather Cap', slot: 'head', rarity: 'common', icon: '🧢', color: LEATHER },
  tornLeatherVest: { id: 'tornLeatherVest', name: 'Torn Leather Vest', slot: 'chest', rarity: 'common', icon: '🦺', color: LEATHER },
  tornLeatherGloves: { id: 'tornLeatherGloves', name: 'Torn Leather Gloves', slot: 'hands', rarity: 'common', icon: '🧤', color: LEATHER },
  tornLeatherTrousers: { id: 'tornLeatherTrousers', name: 'Torn Leather Trousers', slot: 'legs', rarity: 'common', icon: '👖', color: LEATHER },

  chainCoif: { id: 'chainCoif', name: 'Chain Coif', slot: 'head', rarity: 'uncommon', icon: '⛑️', color: CHAIN },
  chainHauberk: { id: 'chainHauberk', name: 'Chain Hauberk', slot: 'chest', rarity: 'uncommon', icon: '🛡️', color: CHAIN },
  chainGauntlets: { id: 'chainGauntlets', name: 'Chain Gauntlets', slot: 'hands', rarity: 'uncommon', icon: '🧤', color: CHAIN },
  chainLeggings: { id: 'chainLeggings', name: 'Chain Leggings', slot: 'legs', rarity: 'uncommon', icon: '👖', color: CHAIN },

  copperRing: { id: 'copperRing', name: 'Copper Ring', slot: 'ring', rarity: 'common', icon: '💍', color: '#c87533' },
  silverRing: { id: 'silverRing', name: 'Silver Ring', slot: 'ring', rarity: 'uncommon', icon: '💍', color: '#d8dde3' },
  goldRing: { id: 'goldRing', name: 'Gold Ring', slot: 'ring', rarity: 'rare', icon: '💍', color: '#f2c14e' },
  boneCharm: { id: 'boneCharm', name: 'Bone Charm', slot: 'necklace', rarity: 'common', icon: '📿', color: '#e8dcc0' },
  jadeAmulet: { id: 'jadeAmulet', name: 'Jade Amulet', slot: 'necklace', rarity: 'rare', icon: '📿', color: '#3fae7a' },

  ratTeethNecklace: { id: 'ratTeethNecklace', name: 'Rat Teeth Necklace', slot: 'necklace', rarity: 'unique', icon: '🦷', color: '#f4f1e6' },
};

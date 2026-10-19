// Shop stock pools (data only). Prices come from CONFIG.items[id].value.
import type { ItemId } from '../config';

export interface ShopPool {
  /** Area whose boss must be defeated to add this pool; null = always available. */
  unlockedBy: string | null;
  items: ItemId[];
}

export const SHOP_POOLS: ShopPool[] = [
  {
    unlockedBy: null,
    items: ['tornLeatherCap', 'tornLeatherVest', 'tornLeatherGloves', 'tornLeatherTrousers', 'copperRing', 'boneCharm'],
  },
  {
    unlockedBy: 'sewers',
    items: ['chainCoif', 'chainHauberk', 'chainGauntlets', 'chainLeggings', 'silverRing'],
  },
  {
    unlockedBy: 'goblinCamp',
    items: ['goldRing', 'jadeAmulet'],
  },
];

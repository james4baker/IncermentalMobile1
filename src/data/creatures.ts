// Creature definitions (data only). Balance numbers are in config.ts under CONFIG.creatures.
import type { CreatureId } from '../config';

export interface CreatureDef {
  id: CreatureId;
  name: string;
  family: string;
  icon: string;
}

export const CREATURES: Record<CreatureId, CreatureDef> = {
  rat: { id: 'rat', name: 'Rat', family: 'rat', icon: '🐀' },
};

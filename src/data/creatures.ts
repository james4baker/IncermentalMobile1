// Creature definitions (data only). Balance numbers are in config.ts under CONFIG.creatures.
import type { CreatureId } from '../config';

export interface CreatureDef {
  id: CreatureId;
  name: string;
  family: string;
  icon: string;
  /** Optional CSS filter to recolour the icon (e.g. a black dragon from the green dragon emoji). */
  tint?: string;
  /** Boss fight mechanic. 'tiles': the boss stands still between four tiles; dodge red waves, tap blue tiles. */
  mechanic?: 'tiles';
}

export const CREATURES: Record<CreatureId, CreatureDef> = {
  rat: { id: 'rat', name: 'Rat', family: 'rat', icon: '🐀' },
  ratQueen: { id: 'ratQueen', name: 'Rat Queen', family: 'rat', icon: '👑', mechanic: 'tiles' },
  goblin: { id: 'goblin', name: 'Goblin', family: 'goblin', icon: '👺' },
  goblinLord: { id: 'goblinLord', name: 'Goblin Lord', family: 'goblin', icon: '👹' },
  ghost: { id: 'ghost', name: 'Ghost', family: 'undead', icon: '👻' },
  lichKing: { id: 'lichKing', name: 'Lich King', family: 'undead', icon: '💀' },
  construct: { id: 'construct', name: 'Construct', family: 'construct', icon: '🤖' },
  colossusConstruct: { id: 'colossusConstruct', name: 'Colossus Construct', family: 'construct', icon: '🗿' },
  greenDragon: { id: 'greenDragon', name: 'Green Dragon', family: 'dragon', icon: '🐉' },
  dragonia: { id: 'dragonia', name: 'Dragonia', family: 'dragon', icon: '🐉', tint: 'grayscale(1) brightness(0.45) contrast(1.4)' },
};

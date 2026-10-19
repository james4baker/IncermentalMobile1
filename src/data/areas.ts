// Area definitions (data only), in unlock order. Defeating an area's boss unlocks the next area.
import type { CreatureId } from '../config';

export interface AreaDef {
  id: string;
  name: string;
  /** Lesser creatures, farmable; they can drop this area's key. */
  creatures: CreatureId[];
  boss: CreatureId;
  keyName: string;
}

export const AREAS: AreaDef[] = [
  { id: 'sewers', name: 'Sewers', creatures: ['rat'], boss: 'ratQueen', keyName: "Rat Queen's Key" },
  { id: 'goblinCamp', name: 'Goblin Camp', creatures: ['goblin'], boss: 'goblinLord', keyName: "Goblin Lord's Key" },
  { id: 'crypt', name: 'Haunted Crypt', creatures: ['ghost'], boss: 'lichKing', keyName: "Lich King's Key" },
  { id: 'foundry', name: 'Ancient Foundry', creatures: ['construct'], boss: 'colossusConstruct', keyName: 'Colossus Key' },
  { id: 'dragonRoost', name: "Dragon's Roost", creatures: ['greenDragon'], boss: 'dragonia', keyName: "Dragonia's Key" },
];

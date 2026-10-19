// Area definitions (data only), in unlock order. Defeating an area's boss unlocks the next area.
import type { CreatureId } from '../config';

export interface AreaDef {
  id: string;
  name: string;
  /** Lesser creatures, farmable; they can drop this area's key. */
  creatures: CreatureId[];
  boss: CreatureId;
  keyName: string;
  /** Arena floor colour. */
  floor: string;
}

export const AREAS: AreaDef[] = [
  { id: 'sewers', name: 'Sewers', creatures: ['rat'], boss: 'ratQueen', keyName: "Rat Queen's Key", floor: '#4b5e50' },
  { id: 'goblinCamp', name: 'Goblin Camp', creatures: ['goblin'], boss: 'goblinLord', keyName: "Goblin Lord's Key", floor: '#6a5a3f' },
  { id: 'crypt', name: 'Haunted Crypt', creatures: ['ghost'], boss: 'lichKing', keyName: "Lich King's Key", floor: '#45455f' },
  { id: 'foundry', name: 'Ancient Foundry', creatures: ['construct'], boss: 'colossusConstruct', keyName: 'Colossus Key', floor: '#5e4a3a' },
  { id: 'dragonRoost', name: "Dragon's Roost", creatures: ['greenDragon'], boss: 'dragonia', keyName: "Dragonia's Key", floor: '#4f6a52' },
];

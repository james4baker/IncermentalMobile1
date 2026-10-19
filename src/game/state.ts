import Decimal from 'break_infinity.js';
import { CONFIG, type CreatureId } from '../config';

export interface GameState {
  gold: Decimal;
  xp: Decimal;
  creatureId: CreatureId;
  creatureHp: Decimal;
  /** Seconds accumulated toward the next auto-attack. */
  attackProgress: number;
  kills: number;
}

export function createInitialState(): GameState {
  const creatureId: CreatureId = 'rat';
  return {
    gold: new Decimal(0),
    xp: new Decimal(0),
    creatureId,
    creatureHp: new Decimal(CONFIG.creatures[creatureId].maxHp),
    attackProgress: 0,
    kills: 0,
  };
}

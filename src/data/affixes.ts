// Affix definitions (data only). Values per tier are in config.ts under CONFIG.affixValues.
import type { AffixId, CreatureId, ItemId } from '../config';

export type AffixSlot = 'prefix' | 'suffix';

/** Where an affix can roll: on any drop, only on a boss's drops, or only on one specific item. */
export type AffixSource = { kind: 'generic' } | { kind: 'boss'; creatureId: CreatureId } | { kind: 'item'; itemId: ItemId };

export interface AffixDef {
  id: AffixId;
  name: string;
  slot: AffixSlot;
  source: AffixSource;
}

const GENERIC: AffixSource = { kind: 'generic' };

export const AFFIXES: Record<AffixId, AffixDef> = {
  vicious: { id: 'vicious', name: 'Vicious', slot: 'prefix', source: GENERIC },
  hasty: { id: 'hasty', name: 'Hasty', slot: 'prefix', source: GENERIC },
  gilded: { id: 'gilded', name: 'Gilded', slot: 'prefix', source: GENERIC },
  wise: { id: 'wise', name: 'Wise', slot: 'prefix', source: GENERIC },
  crushing: { id: 'crushing', name: 'Crushing', slot: 'prefix', source: GENERIC },

  ofMight: { id: 'ofMight', name: 'of Might', slot: 'suffix', source: GENERIC },
  ofSwiftness: { id: 'ofSwiftness', name: 'of Swiftness', slot: 'suffix', source: GENERIC },
  ofTwinStrikes: { id: 'ofTwinStrikes', name: 'of Twin Strikes', slot: 'suffix', source: GENERIC },
  ofFortune: { id: 'ofFortune', name: 'of Fortune', slot: 'suffix', source: GENERIC },
  ofLearning: { id: 'ofLearning', name: 'of Learning', slot: 'suffix', source: GENERIC },
  ofEndurance: { id: 'ofEndurance', name: 'of Endurance', slot: 'suffix', source: GENERIC },
  ofReach: { id: 'ofReach', name: 'of Reach', slot: 'suffix', source: GENERIC },

  verminous: { id: 'verminous', name: 'Verminous', slot: 'prefix', source: { kind: 'boss', creatureId: 'ratQueen' } },
  ofTheWarband: { id: 'ofTheWarband', name: 'of the Warband', slot: 'suffix', source: { kind: 'boss', creatureId: 'goblinLord' } },
  lichTouched: { id: 'lichTouched', name: 'Lich-touched', slot: 'prefix', source: { kind: 'boss', creatureId: 'lichKing' } },
  ofTheColossus: { id: 'ofTheColossus', name: 'of the Colossus', slot: 'suffix', source: { kind: 'boss', creatureId: 'colossusConstruct' } },
  dragonias: { id: 'dragonias', name: "Dragonia's", slot: 'prefix', source: { kind: 'boss', creatureId: 'dragonia' } },

  gnawing: { id: 'gnawing', name: 'Gnawing', slot: 'prefix', source: { kind: 'item', itemId: 'ratTeethNecklace' } },
  ofUndeath: { id: 'ofUndeath', name: 'of Undeath', slot: 'suffix', source: { kind: 'item', itemId: 'lichPhylactery' } },
  titanic: { id: 'titanic', name: 'Titanic', slot: 'prefix', source: { kind: 'item', itemId: 'heartOfTheColossus' } },
  ofTheBlackFlame: { id: 'ofTheBlackFlame', name: 'of the Black Flame', slot: 'suffix', source: { kind: 'item', itemId: 'eyeOfDragonia' } },
};

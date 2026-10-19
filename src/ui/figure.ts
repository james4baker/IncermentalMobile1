import { ITEMS } from '../data/items';
import type { EquipSlot, GameState } from '../game/state';

const SKIN = '#d8a77f';
const CLOTH = '#4a4f63';
const SHIRT = '#5b6070';

/** Placeholder paper-doll: each body part takes the colour of the gear in that slot. */
export function figureSvg(state: GameState): string {
  const color = (slot: EquipSlot): string | null => {
    const item = state.equipment[slot];
    return item ? ITEMS[item.itemId].color : null;
  };
  const head = color('head');
  const chest = color('chest');
  const hands = color('hands');
  const legs = color('legs');
  const ring1 = color('ring1');
  const ring2 = color('ring2');
  const necklace = color('necklace');

  return `
  <svg class="figure-svg" viewBox="0 0 160 240" role="img" aria-label="Your character">
    <ellipse cx="80" cy="228" rx="46" ry="7" fill="#000" opacity="0.25"/>
    <rect x="62" y="138" width="16" height="78" rx="5" fill="${legs ?? CLOTH}"/>
    <rect x="82" y="138" width="16" height="78" rx="5" fill="${legs ?? CLOTH}"/>
    <rect x="59" y="212" width="20" height="9" rx="3" fill="#2b2d36"/>
    <rect x="81" y="212" width="20" height="9" rx="3" fill="#2b2d36"/>
    <rect x="36" y="76" width="14" height="58" rx="7" fill="${SKIN}"/>
    <rect x="110" y="76" width="14" height="58" rx="7" fill="${SKIN}"/>
    <rect x="52" y="70" width="56" height="74" rx="12" fill="${chest ?? SHIRT}"/>
    <rect x="72" y="58" width="16" height="14" fill="${SKIN}"/>
    <circle cx="43" cy="138" r="9" fill="${hands ?? SKIN}"/>
    <circle cx="117" cy="138" r="9" fill="${hands ?? SKIN}"/>
    ${ring1 ? `<circle cx="43" cy="146" r="3.5" fill="${ring1}" stroke="#000" stroke-width="0.8"/>` : ''}
    ${ring2 ? `<circle cx="117" cy="146" r="3.5" fill="${ring2}" stroke="#000" stroke-width="0.8"/>` : ''}
    <circle cx="80" cy="38" r="22" fill="${SKIN}"/>
    <circle cx="72" cy="40" r="2.5" fill="#222"/>
    <circle cx="88" cy="40" r="2.5" fill="#222"/>
    <path d="M73 49 Q80 53 87 49" stroke="#7a4a35" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${head ? `<path d="M56 36 A24 24 0 0 1 104 36 L104 34 L56 34 Z" fill="${head}"/><rect x="54" y="31" width="52" height="7" rx="3" fill="${head}"/>` : ''}
    ${necklace ? `<path d="M68 70 Q80 90 92 70" stroke="${necklace}" stroke-width="3" fill="none"/><circle cx="80" cy="83" r="4.5" fill="${necklace}" stroke="#000" stroke-width="0.8"/>` : ''}
  </svg>`;
}

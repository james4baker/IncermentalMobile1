# Game Design Document

## Overview
- **Genre:** Incremental / idle RPG with loot and crafting
- **Platform:** Mobile (Android + iOS), portrait, one-handed play
- **Session style:** Short check-ins (1–5 min), fights and progress continue while offline
- **Core fantasy:** Start weak, hunt creatures and bosses, collect loot, craft the perfect weapon

## Core Loop
1. Fight creatures (auto-battle, tap to deal extra damage)
2. Earn gold and XP; level up to unlock new creatures and bosses
3. Defeat bosses for loot: sellables, weapons and armour
4. Dismantle items to extract their **prefix** or **suffix**
5. Pay gold to mount that affix onto another weapon
6. Equip the improved gear, beat tougher bosses, repeat

```
Defeat boss → get weapons → dismantle for prefix/suffix
→ mount affix onto another weapon (costs gold) → equip → fight harder bosses
```

## Player Progression
- **XP and levels:** killing creatures gives XP. Each level unlocks new creatures/bosses.
- **Stats:** damage, attack speed, health, armour (mostly from gear)
- **Gold:** earned from kills and selling items; spent on mounting affixes and other upgrades

## Creatures and Bosses
Each area has regular creatures (farmable, steady gold/XP) and a boss (tougher, has a loot table).

| Area | Unlock level | Creatures | Boss |
|---|---|---|---|
| Sewers | 1 | Rats, Giant Rats | **Rat King** |
| *TBD* | 10 | *TBD* | *TBD* |
| *TBD* | 20 | *TBD* | *TBD* |

Bosses can be re-fought for more loot rolls.

## Loot
Defeating a boss gives a guaranteed reward plus a roll on its loot table.

### Example: Rat King loot table
| Drop | Type | Notes |
|---|---|---|
| Rat Tail, Rat Pelt | Sellable | Sell for gold |
| Rat Weapon (e.g. Rat Fang Dagger) | Weapon | Bonus damage vs rats |
| Rat Armour (e.g. Ratskin Vest) | Armour | Bonus defence vs rats |

Drop chances, rarities and gold values live in `config.ts`.

### Creature-family gear
Gear from a creature family is strong against that family (rat weapons deal extra damage to rats). This pushes players to farm the right gear for each area.

## Items and Affixes
Every weapon or armour piece can have:
- **Base item:** the item type and its base stats
- **Prefix (optional):** one modifier, shown before the name
- **Suffix (optional):** one modifier, shown after the name

Example: **Vicious** Rat Fang Dagger **of Swiftness**

### Example affixes (damage-focused)
| Affix | Slot | Effect |
|---|---|---|
| Sharp | Prefix | +X flat damage |
| Vicious | Prefix | +X% damage |
| Brutal | Prefix | +X% critical damage |
| of Swiftness | Suffix | +X% attack speed |
| of Precision | Suffix | +X% critical chance |
| of the Ratcatcher | Suffix | +X% damage vs rats |

Affixes can roll in tiers (e.g. Sharp I–V) so the same affix can be better or worse.

## Crafting: Dismantle and Mount
1. **Dismantle** an item: choose to extract **either** its prefix **or** its suffix. The item is destroyed and the other affix is lost.
2. Extracted affixes go into an **affix inventory**.
3. **Mount** an affix onto another weapon by paying gold.
   - A prefix fills the prefix slot, a suffix fills the suffix slot.
   - Mounting onto a slot that's already filled replaces the old affix.

### Mounting cost
- **Blank weapon (no affixes):** cheapest
- **Weapon with one affix already:** more expensive
- Cost also scales with affix tier and item level

This makes choosing which affix to keep, and which base to build on, the main decision of the game.

## Prestige (later)
- Optional reset for a permanent bonus once the player reaches a late area
- Possible reward: keep one favourite item, or permanent damage/gold multipliers
- Details TBD

## Offline Progress
- On return, simulate fighting the currently selected creature for the time away
- Award gold and XP; give a limited number of loot rolls
- Cap at 8 hours (raise via upgrades later)
- Show a "Welcome back!" popup with a summary

## Number Formatting
- Under 1,000: show as-is
- Then suffixes: K, M, B, T, then aa, ab, ac...
- Use a big-number library (break_infinity.js) from the start

## Screens
1. **Hunt:** current creature, health bars, tap to attack, gold/XP, area and boss select
2. **Inventory:** items, sellables, sell button
3. **Forge:** dismantle items, affix inventory, mount affixes (shows cost)
4. **Equipment:** equipped weapon and armour, player stats
5. **Settings:** sound, number notation, export/import save, reset

## Monetisation (later, optional)
- Rewarded ad: double gold for 30 minutes
- Rewarded ad: extra boss loot roll
- No forced ads; no pay-to-win

## Roadmap
- [ ] **v0.1:** Fight a rat (auto-attack + tap), gold and XP, saving
- [ ] **v0.2:** Levels, Sewers area, Rat King boss
- [ ] **v0.3:** Loot tables, inventory, sellables, selling
- [ ] **v0.4:** Weapons and armour with prefixes/suffixes; equipping
- [ ] **v0.5:** Forge: dismantle and mount
- [ ] **v0.6:** Creature-family bonuses; 2 more areas and bosses
- [ ] **v0.7:** Offline progress
- [ ] **v0.8:** Polish: animations, sounds, settings
- [ ] **v1.0:** Capacitor build, test on real devices, store release

## Open Questions
- Is combat fully automatic, tap-based, or both?
- When dismantling, does the player choose prefix or suffix, or is it random?
- Can armour have affixes too, and can affixes move between weapons and armour?
- Should a weapon be able to hold more than one prefix/suffix later on?
- Are bosses limited (cooldown, keys) or freely farmable?
- Themes for areas after the Sewers?

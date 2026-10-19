# Game Design Document

## Overview
- **Genre:** Incremental / idle RPG with loot and crafting
- **Platform:** Mobile (Android + iOS), portrait, one-handed play
- **Session style:** Short check-ins (1–5 min), fights and progress continue while offline
- **Core fantasy:** Start weak, hunt creatures and bosses, collect loot, craft the perfect weapon

## Core Loop
1. Fight an area's lesser creatures (auto-battle, tap to deal extra damage)
2. Earn gold and XP; lesser creatures have a small chance to drop the area boss's **key**
3. Use a key to enter the boss's lair for one fight
4. Defeating a boss for the first time unlocks the next area's lesser creatures
5. Bosses drop loot: sellables, weapons and armour
6. Dismantle items to extract their **prefix** or **suffix**, pay gold to mount it onto another weapon
7. Equip the improved gear, beat tougher bosses, repeat

```
Farm lesser creatures → key drops (e.g. 1 in 30) → enter lair → defeat boss
→ next area unlocks → loot → forge better gear → repeat
```

## Player Progression
- **One combat level, 1 to 999.** Killing creatures gives XP.
- **XP curve:** the RuneScape formula. XP to reach level L = floor(¼ × Σ_{n=1}^{L−1} floor(n + 300 × 2^(n/7))).
  Each level costs roughly as much as the previous 7 combined (level 92 ≈ halfway to 99).
  The curve constants live in `config.ts`.
- **Level bonuses:** each level adds flat damage and a % of attack speed (amounts in `config.ts`; attack speed is capped).
- **Stats:** damage, attack speed, health, armour (from level now, mostly from gear later)
- **Gold:** earned from kills and selling items; spent on mounting affixes and other upgrades

## Areas, Creatures and Bosses
Each area has **lesser creatures** (farmable, steady gold/XP, simple drop table) and a **boss** (tougher, better loot).
Areas unlock by defeating the previous area's boss, not by level.

| Area | Unlocked by | Lesser creatures | Key chance | Boss |
|---|---|---|---|---|
| Sewers | Start | Rats | 1 in 30 | **Rat Queen** |
| Goblin Camp | Defeating Rat Queen | Goblins | 1 in 30 | **Goblin Lord** |
| *TBD* | Defeating Goblin Lord | *TBD* | *TBD* | *TBD* |

Level targets: farming rats until the key drops (~30 kills) should put the player at **level 3–4**; defeating the Rat Queen should reach **level 5**.

### Keys and lairs
- Lesser creatures can drop their area boss's key. Keys stack.
- A key lets you into the boss's lair for **one kill**. The key is used when you enter.
- **Boss fights can't be failed.** An under-levelled player just takes a long time to win.
- After a boss dies, if the player holds another key for that area, it is used automatically and the next boss fight starts. With no keys left, the player returns to the lesser creatures.
- Bosses can be re-fought (with another key) for more loot rolls.

## Gear
Equipment slots: **head, chest, hands, legs, ring ×2, necklace**.

- Equipped items give **% damage** and **% attack speed** (e.g. +0.5% dmg, +1.2% speed). Better gear gives more.
- Bonuses from all equipped items add together, then multiply the player's level-based damage and attack speed.
- Uniques can have special effects, e.g. **double hit chance** (an attack strikes twice).
- Gear can be sold for a fraction of its value (`shop.sellFraction` in `config.ts`): one at a time, all copies of an item, or the whole bag (two taps to confirm). Equipped items are never sold.
- The bag can be sorted by damage, attack speed or value. Identical items are grouped.

| Tier | Source | Pieces |
|---|---|---|
| Torn leather (common) | Rats, starter shop | Cap, Vest, Gloves, Trousers |
| Chain (uncommon) | Goblins, shop after Rat Queen | Coif, Hauberk, Gauntlets, Leggings |
| Jewellery | Shop | Copper/Silver/Gold Ring, Bone Charm, Jade Amulet |
| **Rat Teeth Necklace** (unique) | Rat Queen | +dmg, +speed, 10% double hit |

## Loot
Every creature has a loot table: a list of items, each with its own drop chance, rolled independently on every kill.
Lesser creatures drop their area's basic gear; bosses drop better gear and uniques.

Drop chances, item bonuses and values live in `config.ts`.

## Collection Log (achievements)
A tab listing every monster, grouped by area, to give a sense of achievement.
- **Undefeated monsters** are shown as a blacked-out silhouette (outline only) with the name hidden ("???").
- **Defeated monsters** show their icon, name and a **kill tally**.
- Under each monster are its possible drops on rarity-coloured circles:
  common grey, uncommon green, rare blue, epic purple, unique orange.
  - **Collected** items show their icon, name and how many have dropped from that monster.
  - **Uncollected** items are blacked out.
- Summary at the top: monsters defeated and drop slots found (e.g. 2/4 monsters, 5/15 drops).
- Counts are per monster: the same item dropped by two monsters fills two slots. Shop purchases don't count.
- A toast appears for a first kill of a monster and for each new drop slot.

## Shop
- Shows a handful of items (5) picked at random from the shop's pool.
- The pool grows as bosses are defeated (starter → +chain and silver after Rat Queen → +gold ring and jade after Goblin Lord). Pools are in `data/shop.ts`.
- Restocks every hour. A free "Refresh now" button exists for now (to be removed or given a cost later).
- Each offer can be bought once per restock.

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
- Under 1,000: show as-is (up to 2 decimals)
- Then suffixes: K, M, B, T, then aa, ab, ac...
- Use a big-number library (break_infinity.js) from the start

## Screens
Gold and level/XP are shown in a top bar on every screen; screens are switched with a bottom tab bar.
1. **Home:** picture of the player wearing their current gear, player stats, current activity
2. **Hunt:** current creature, health bar, tap to attack, area tabs, keys and "Enter lair"
3. **Gear:** equipped slots (tap to remove) and the bag, with equip and sell buttons
4. **Shop:** current stock, restock timer, refresh button
5. **Collection:** collection log of monsters and their drops (see above)
6. **Forge (later):** dismantle items, affix inventory, mount affixes (shows cost)
7. **Settings (later):** sound, number notation, export/import save, reset

## Monetisation (later, optional)
- Rewarded ad: double gold for 30 minutes
- Rewarded ad: extra boss loot roll
- No forced ads; no pay-to-win

## Roadmap
- [x] **v0.1:** Fight a rat (auto-attack + tap), gold and XP, saving
- [ ] **v0.2:** Levels 1–999 (RuneScape curve) boosting damage and attack speed; Sewers (Rats → Rat Queen); key drops and lairs; boss defeat unlocks Goblin Camp (Goblins → Goblin Lord)
- [ ] **v0.3:** Gear (7 slots, % damage/speed bonuses, Rat Teeth Necklace double hit), loot tables, Home/Gear/Shop screens, selling, shop with boss-unlocked stock and hourly restock
- [ ] **v0.3.1:** Collection log tab (monster silhouettes, kill tallies, per-monster drop counts, rarity colours incl. epic)
- [ ] **v0.4:** Prefixes/suffixes on gear
- [ ] **v0.5:** Forge: dismantle and mount
- [ ] **v0.6:** Creature-family bonuses; more areas and bosses
- [ ] **v0.7:** Offline progress
- [ ] **v0.8:** Polish: animations, sounds, settings
- [ ] **v1.0:** Capacitor build, test on real devices, store release

## Open Questions
- ~~Is combat fully automatic, tap-based, or both?~~ Both.
- ~~Are bosses limited (cooldown, keys) or freely farmable?~~ Key-gated, one kill per key, can't be failed.
- When dismantling, does the player choose prefix or suffix, or is it random?
- Can armour have affixes too, and can affixes move between weapons and armour?
- Should a weapon be able to hold more than one prefix/suffix later on?
- Themes for areas after the Goblin Camp?
- Is there a **weapon slot**? The forge design above is built around weapons, but the current slots are head, chest, hands, legs, 2 rings and necklace.
- Should "Refresh now" in the shop cost gold (or a rewarded ad) once the hourly restock is the norm?

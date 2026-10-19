# Game Design Document

## Overview
- **Genre:** Incremental / idle RPG with loot and crafting
- **Platform:** Mobile (Android + iOS), portrait, one-handed play
- **Session style:** Timed hunting runs (30s at level 1, longer as you level). **Nothing progresses outside a run.**
- **Core fantasy:** Start weak, hunt creatures and bosses, collect loot, craft the perfect weapon

## Core Loop
1. Pick an area on the Hunt map and start a **timed run** in its arena
2. Your character hunts the area's lesser creatures automatically; tap to strike an area, or use Move to reposition
3. Earn gold, XP and loot; lesser creatures have a small chance to drop the area boss's **key**
4. When time's up, review the loot and **Go again** or **Return to map**
5. Spend a key to enter the area's **boss room**
6. Defeating a boss for the first time unlocks the next area
7. Equip better gear, beat tougher bosses, repeat (forging comes later)

```
Hunting run → loot + keys → boss room → next area unlocks → better gear → repeat
```

## Hunting Runs (arena)
- The Hunt tab is a **map of area cards**, each with **Hunt** (start a run) and **Boss room** (needs a key).
- A run takes place in a portrait arena with several lesser creatures wandering around (`arena.maxEnemies`, respawning every `arena.spawnInterval`).
- **The character moves on its own**: it walks to the nearest enemy and auto-attacks when in reach.
- **Tap**: strikes every enemy within a small radius of the tap (`arena.tapRadius`), using tap damage.
- **Move button**: tap Move, then tap a spot; the character walks there, then goes back to hunting (attacking anything in reach on the way).
- **Time limit**: `run.baseSeconds + run.secondsPerLevel × (level − 1)`, capped at `run.maxSeconds`. Set when the run starts. Levelling up is the upgrade path.
- **End run** (two taps) leaves early. Loot, XP and keys are applied to the player the moment they drop, so leaving or closing the app never loses them; the run itself isn't saved.
- **Results screen**: kills, gold, XP, level change, keys found and items, with **Go again** and **Return to map**.
- No player health for now; the timer is the only limit.

### Boss rooms (placeholder)
Boss rooms will get their own design. For now: entering spends a key and the boss appears alone in the arena, with **no time limit** (can't be failed). If another key is held when it dies, the next boss steps in; otherwise the room is cleared and the results screen shows.

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
| Haunted Crypt | Defeating Goblin Lord | Ghosts | 1 in 30 | **Lich King** |
| Ancient Foundry | Defeating Lich King | Constructs | 1 in 30 | **Colossus Construct** |
| Dragon's Roost | Defeating Colossus Construct | Green Dragons | 1 in 30 | **Dragonia** (black dragon) |

Tuning target (set before arena runs; walking time now slows kills): on the expected path (≈30 lesser kills per key + 1 boss), lesser creatures take ~5s of attacking to kill on arrival and bosses ~1.5–2 min. The expected path reaches about level 48 after Dragonia.

Level targets: farming rats until the key drops (~30 kills) should put the player at **level 3–4**; defeating the Rat Queen should reach **level 5**.

### Keys
- Lesser creatures can drop their area boss's key during hunting runs. Keys stack.
- A key lets you into the boss room for **one kill**. The key is used when you enter.
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
| Spectral (rare) | Ghosts, Lich King, shop after Lich King | Hood, Robe, Grips, Leggings |
| Runic (epic) | Constructs, Colossus, shop after Colossus | Helm, Cuirass, Gauntlets, Greaves |
| Dragonscale (epic) | Green Dragons, Dragonia, shop after Dragonia | Helm, Mail, Gloves, Legs |
| Jewellery | Shop | Copper/Silver/Gold/Platinum Ring, Bone Charm, Jade Amulet |
| **Rat Teeth Necklace** (unique) | Rat Queen | +dmg, +speed, 10% double hit |
| **Lich's Phylactery** (unique necklace) | Lich King | +dmg, +speed, 15% double hit |
| **Heart of the Colossus** (unique ring) | Colossus Construct | +dmg, +speed, 5% double hit |
| **Eye of Dragonia** (unique ring) | Dragonia | +dmg, +speed, 20% double hit |

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
Every gear item can have:
- **Base item:** the item type and its base stats
- **Prefix (optional):** one modifier, shown before the name
- **Suffix (optional):** one modifier, shown after the name

An item can have neither, one or both. Example: **Vicious** Torn Leather Cap **of Swiftness**

### Rolling
- Only **monster drops** roll affixes; shop items are always blank (cheap bases for mounting).
- Each drop rolls the prefix and suffix independently (`affixes.prefixChance` / `suffixChance`, 30% each → ~49% blank, ~9% both).
- **Tiers I–V:** base tier = area number (Sewers I … Dragon's Roost V), boss drops +1, then a chance to roll one higher or lower.
- Three kinds of affix, from common to rare:
  - **Generic** (blue): can roll on any drop.
  - **Boss-specific** (purple): can only roll on items dropped by that boss (`affixes.bossAffixChance`).
  - **Item-specific** (orange): can only roll on one particular item, e.g. the Rat Teeth Necklace (`affixes.itemAffixChance`). Needs both the item drop and the affix roll.
- Affix definitions are in `data/affixes.ts`; values per tier in `config.ts` (`affixValues`).

### Stats affixes can boost
Damage %, attack speed %, double hit %, gold find %, XP find %, run time (+seconds), tap damage %, tap radius %.

| Affix | Slot | Source | Boosts |
|---|---|---|---|
| Vicious / of Might | Prefix / Suffix | Generic | Damage |
| Hasty / of Swiftness | Prefix / Suffix | Generic | Attack speed |
| of Twin Strikes | Suffix | Generic | Double hit |
| Gilded / of Fortune | Prefix / Suffix | Generic | Gold find |
| Wise / of Learning | Prefix / Suffix | Generic | XP find |
| of Endurance | Suffix | Generic | Run time |
| Crushing / of Reach | Prefix / Suffix | Generic | Tap damage / tap radius |
| Verminous | Prefix | Rat Queen | Speed + gold |
| of the Warband | Suffix | Goblin Lord | Damage + tap damage |
| Lich-touched | Prefix | Lich King | XP + run time |
| of the Colossus | Suffix | Colossus Construct | Damage + tap radius |
| Dragonia's | Prefix | Dragonia | Damage + speed + double hit |
| Gnawing | Prefix | Rat Teeth Necklace | Damage + double hit |
| of Undeath | Suffix | Lich's Phylactery | XP + run time |
| Titanic | Prefix | Heart of the Colossus | Tap damage + tap radius |
| of the Black Flame | Suffix | Eye of Dragonia | Damage + double hit |

Affixes add to an item's value (`affixes.valuePerTier` per tier), which raises its sell price.

## Crafting: the Forge
1. **Dismantle** a bag item: choose to keep **either** its prefix **or** its suffix (two taps to confirm). The item is destroyed and the other affix is lost.
2. Kept affixes go into the **affix stash** (tracked and saved), grouped by affix and tier.
3. **Mount** a stashed affix onto any item, bag or equipped, by paying gold.
   - Any affix can go on any item; a prefix fills the prefix slot, a suffix the suffix slot.
   - Mounting onto a filled slot replaces (destroys) the old affix (two taps to confirm).

### Mounting cost
`base × tierMultiplier[tier] × (1 + √(item value) / valueDivisor) × (2 if the item's other slot is filled)` — numbers in `config.ts` (`affixes.mount`).
- Blank item: cheapest; item that already has the other affix: double.
- Scales with affix tier and the item's value (better bases cost more).

This makes choosing which affix to keep, and which base to build on, the main decision of the game.

## Prestige (later)
- Optional reset for a permanent bonus once the player reaches a late area
- Possible reward: keep one favourite item, or permanent damage/gold multipliers
- Details TBD

## Offline Progress
- **Dropped:** with arena runs, nothing progresses outside a run (decided by the designer).

## Number Formatting
- Under 1,000: show as-is (up to 2 decimals)
- Then suffixes: K, M, B, T, then aa, ab, ac...
- Use a big-number library (break_infinity.js) from the start

## Screens
Gold and level/XP are shown in a top bar on every screen; screens are switched with a bottom tab bar.
1. **Home:** picture of the player wearing their current gear, player stats, current activity
2. **Hunt:** area map (Hunt / Boss room per area) → arena run (timer, tally, Move, End run) → results
3. **Gear:** equipped slots (tap to remove) and the bag, with equip and sell buttons
4. **Shop:** current stock, restock timer, refresh button
5. **Collection:** collection log of monsters and their drops (see above)
6. **Forge:** Dismantle (keep prefix or suffix) and Mount (stash → item, shows cost)
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
- [ ] **v0.3.2:** Arena hunting runs: area map, auto-moving character, tap-area strikes, Move command, level-based time limit, results screen; placeholder boss rooms
- [ ] **v0.3.3:** Boss room design (to be specified)
- [ ] **v0.4:** Prefixes/suffixes on gear (generic, boss-specific, item-specific; tiers I–V; 8 stats)
- [ ] **v0.5:** Forge: dismantle into the affix stash and mount for gold
- [ ] **v0.6:** Creature-family bonuses; more areas and bosses (Crypt, Foundry and Dragon's Roost added early)
- ~~**v0.7:** Offline progress~~ (dropped: nothing progresses outside a run)
- [ ] **v0.8:** Polish: animations, sounds, settings
- [ ] **v1.0:** Capacitor build, test on real devices, store release

## Open Questions
- ~~Is combat fully automatic, tap-based, or both?~~ Both.
- ~~Are bosses limited (cooldown, keys) or freely farmable?~~ Key-gated, one kill per key, can't be failed.
- ~~When dismantling, does the player choose prefix or suffix, or is it random?~~ The player chooses.
- ~~Can armour have affixes too, and can affixes move between weapons and armour?~~ All gear can; any affix can be mounted on any item.
- Should a weapon be able to hold more than one prefix/suffix later on?
- What comes after Dragon's Roost?
- Is there a **weapon slot**? The forge design above is built around weapons, but the current slots are head, chest, hands, legs, 2 rings and necklace.
- Should "Refresh now" in the shop cost gold (or a rewarded ad) once the hourly restock is the norm?

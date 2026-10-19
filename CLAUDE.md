# CLAUDE.md

Project rules for AI coding assistants. Read this and `GAME_DESIGN.md` before making changes.

## Project
A mobile incremental (idle) game built with web tech and wrapped for Android/iOS with Capacitor.
`GAME_DESIGN.md` is the source of truth for mechanics, numbers, and the roadmap.

## Stack
- Vite + TypeScript (strict mode)
- Plain HTML/CSS for UI. No game engine, no UI framework unless asked
- break_infinity.js for all currency and large numbers
- Capacitor for mobile builds (added at v1.0, not before)

## Structure
```
src/
  main.ts        // entry point, wires everything together
  game/          // pure game logic: state, tick, purchases, prestige
  ui/            // rendering and input only
  config.ts      // ALL balance numbers (costs, rates, multipliers)
  data/          // creatures, bosses, loot tables, items, affixes (data only, no logic)
  save.ts        // save/load/offline progress
```

## Rules
- **Keep game logic separate from UI.** Files in `game/` must not touch the DOM.
- **All balance numbers live in `config.ts`.** Never hardcode costs or rates elsewhere.
- **Content is data-driven.** New creatures, bosses, items and affixes are added in `data/`, not by writing new code for each one.
- **Use Decimal (break_infinity.js) for currency.** Never plain `number` for coins or gems.
- **Game tick uses delta time**, not fixed increments, so it works at any frame rate.
- **Save** to localStorage every 5 seconds and on page hide/close. Include a save version number so old saves can be migrated.
- **Mobile first:** portrait layout, tap targets at least 44px, no hover-only interactions.
- Keep dependencies minimal. Ask before adding a new package.

## Workflow
- Work on **one roadmap item at a time** (see `GAME_DESIGN.md`).
- Make small, focused changes. Don't refactor unrelated code.
- After each change, briefly explain what changed and how to test it.
- If something in the design doc is unclear or seems unbalanced, ask instead of guessing.
- Update the roadmap checkboxes in `GAME_DESIGN.md` when a milestone is done.

## Commands
- `npm run dev`: start dev server
- `npm run build`: production build

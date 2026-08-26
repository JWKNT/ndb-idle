# Architecture

The project separates authored game content, reusable mechanics, React features, and art. Keep dependencies flowing in this direction:

```text
assets <- content <- game <- features <- App
```

`App.tsx` is only the save-slot gate. `Game.tsx` owns cross-feature orchestration: the selected activity, background timers, and transitions between features. Neither file should contain board rendering, content definitions, room generation, or feature-specific presentation.

## Source folders

### `src/assets/sprites`

SVG files only. Art is grouped into `terrain`, `units`, `objects`, and `items`; item art is further grouped by gameplay category. Runtime imports are grouped the same way under `src/content/sprite-registry`. `src/content/sprites.ts` is the stable combined facade used by renderers.

### `src/content`

Authored data and fixed layouts:

- `levels`: one Battle definition per file.
- `boards`: reusable Battle layouts and terrain definitions.
- `enemies`: one enemy definition per file.
- `players`: one party-member definition per file.
- `quests`: one quest definition per file.
- `adventure-rooms`: fixed special-room layouts.
- `sprite-registry`: asset imports split by category.

Content may depend on shared domain types, but should not import React features or application state.

### `src/game`

Framework-free rules and state transitions. `combat.ts` is the Battle engine. `adventure.ts` remains the stable Adventure API while focused concerns live in `game/adventure`:

- `types`: Adventure model types.
- `session`: the multi-explorer runtime session model.
- `economy`: room-generation odds and gold rolls.
- `enemies`: Adventure enemy scaling and drops.
- `lottery`: Lottery room outcomes.

`adventure.ts` is a compatibility facade plus the remaining action engine. New work should begin in the focused module that owns the rule instead of adding another unrelated section to the facade:

- `types`: Adventure state and tile contracts.
- `geometry`: positions, directions, room keys, and exit coordinates.
- `pathfinding`: walkability, routing costs, and room-connectivity repair.
- `tileRules`: movement blocking and traversal costs.
- `state`: safe immutable room/session cloning.
- `roomGeneration`: ordinary and special room selection, terrain, hazards, and enemy placement.
- `exitPlanning`: reciprocal exits, exit-count probabilities, frontier guarantees, and quest-path repair.
- `questRouting`: quest destinations and the Blacksmith/Miner route reservation logic.
- `turnTimeline`: speed-based actor scheduling and turn-order previews.
- `actionTimeline`: post-action cooldown, hazard-clock, and temporary-obstacle aging.
- `autoStrategy`: automatic target selection and cross-room exploration strategy.
- `combatRules`: Adventure line-of-sight, attack ranges, enemy footprints, traps, and facing helpers.
- `creation`: Earth, Water, and Forge expedition construction plus party-member joining.
- `constants`: shared Adventure pacing constants and compatibility actor ids.
- `encounterLocks`: two-sided room gates for Arenas, Lottery, and Dice encounters.
- `objectiveResolution`: reward/chest/cage/door changes after objective enemies are cleared.
- `economy`, `enemies`, and `lottery`: their named isolated rules.
- `session`: the multi-explorer runtime session model.

`progression.ts` is the stable save/progression API and owns persistence/migrations. Focused rules live in `game/progression`:

- `types`: persisted runtime model types.
- `economy`: gold, materials, fish, and Escape Ropes.
- `fishing`: Fishing assignments and unlock checks.
- `potion-effects`: purchasing, consuming, and timing potions.
- `training`: training cost and purchase rules.

The facade files deliberately re-export their established public API so callers and saves are unaffected as internals are split further.

Crafting rules live in `game/crafting.ts`; authored 4×4 patterns remain in `content/forge-recipes.ts`. Level-specific ingredient substitution belongs in the crafting rule, never in the view.

### `src/features`

React code grouped by player-facing feature. A feature owns its view and local render helpers. `features/adventure` is further split into controls, map/tiles, NPC popovers, quest log, and the session controller. Shared presentation primitives live in `features/shared`; app-level save/reward/navigation UI lives in `features/shell`. `features/inventory/InventoryCard.tsx` is the single item-card presentation used by Party and Crafting, so inventory visuals do not drift between pages. `features/index.ts` is the page-level import surface for the app shell.

### `src/styles`

`styles.css` is an ordered import manifest. Rules are split by page or visual layer (`battle`, `adventure`, `party-training`, `mining-crafting`, map, shared controls, and the theme layers). Preserve the import order when moving an existing selector because later theme files intentionally override the structural defaults.

### `electron`

The desktop wrapper only. Game behavior belongs in `src` so browser and Electron builds stay equivalent.

## Adding content

For a new Battle, create its board (or reuse one), create any enemy files, add one level file, and register it in the relevant `index.ts` files. For a new special Adventure room, put the fixed layout in `content/adventure-rooms` and keep the runtime behavior in the Adventure engine. New SVGs go in their matching asset folder and sprite-registry category.

Public imports should use the `@/` alias. Tests may import a facade beside the file they exercise. Avoid importing a facade from its own internal submodules; internal modules should depend on the focused `types` file instead.

## Change routing

Use these starting points so a small change does not require reading the whole game:

| Change | Start here |
| --- | --- |
| New enemy stats or sprite | `content/enemies/<enemy>.ts`, then the sprite registry |
| New Battle layout | `content/boards`, then one `content/levels` file |
| New fixed Adventure room | `content/adventure-rooms`, then `game/adventure/roomGeneration.ts` |
| Dungeon graph/exits bug | `game/adventure/exitPlanning.ts` |
| Unit cannot reach a tile | `game/adventure/pathfinding.ts` and `tileRules.ts` |
| Turn order/speed | `game/adventure/turnTimeline.ts` or `game/combat.ts` |
| Adventure auto target/path choice | `game/adventure/autoStrategy.ts` |
| Adventure attack range/LOS/traps | `game/adventure/combatRules.ts` |
| Starting an expedition/adding a member | `game/adventure/creation.ts` |
| Locked special room | `game/adventure/encounterLocks.ts` |
| Quest marker/path | `game/adventure/questRouting.ts` |
| Inventory appearance | `features/inventory/InventoryCard.tsx` and `styles/party-training.css` |
| Crafting recipe | `content/forge-recipes.ts` and `game/crafting.ts` |

As a working guideline, split a production file once it starts mixing responsibilities or approaches roughly 800–1,000 lines. Tests may be longer when they form one readable behavior suite, but new production behavior should have an obvious single home.

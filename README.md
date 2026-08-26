# NDB Idle

An idle tactics game built with React, TypeScript, Vite, and Electron. The same game runs as a web app during development and packages as a native desktop application.

[Play NDB Idle in your browser](https://jehlp.net/ndb-idle/)

## Current progression

New saves begin with **Party** and **Battle** visible. Menu sections appear only after their unlock condition is met:

- Battle 1 drops the permanent Lowering Rope and unlocks Adventure.
- Party and Battle are available immediately; Party is the initial game screen.
- The first Adventure death unlocks Training.
- Battle 3 awards the marked `Lost Adventurer` quest. Its zone 1 destination contains a guarded cage encounter whose occupant is not revealed in advance; rescuing him unlocks the Shop.
- Battle 4 unlocks the 500-gold `Rescue Me` quest.
- Battle 5 unlocks the 1,000-gold `Retrieve Lost Item` quest.
- Battle 6 awards Shaman's Ring, an accessory that can evade Adventure damage by teleporting its wearer.
- Recovering the Fishing Rod unlocks Fishing.
- Battle 7 awards the Bestiary, adds rare Frogs, Mutant Rats, and Fire Ants to the first two Adventure zones, and unlocks Charles at The Crooked Still in zone 2. Ten of each new creature drop can be exchanged once for three Level 1 Mystery Potions.

Battles never award gold. A first clear unlocks its explicit progression reward and advances directly to the next Battle; cleared Battles cannot be replayed.

## Battles

Every board gives the middle three columns neutral terrain, player-favored terrain to the left, and enemy-favored terrain to the right. Home terrain buffs all combat stats by 25%. Walls block movement, line of sight, and projectiles. Gaps block movement but allow line of sight and projectiles. Battles begin with manual deployment onto unique player-owned tiles and end when the marked boss dies.

Content is modular: every enemy, board, and Battle has its own file.

1. **Undertaker** — a 10×7 mossy graveyard. A fresh Knight can always win and receives the Lowering Rope on first clear.
2. **Restless Skeleton** — the same graveyard with a Skele-Giraffe and Skele-Hippo. A fresh Knight loses on auto; early training makes it winnable.
3. **Skele-Prince** — adds a Skele-Rhino and awards `Lost Adventurer` with a marked zone 1 route.
4. **Skele-King** — protected by an undead force field. The Shopkeeper's 250-gold Undead Gem must be equipped in an accessory slot to damage him.
5. **Goblin Chief** — a 19×11 leafy scaffold with gaps and tree-stump walls. Its first clear unlocks Retrieve Lost Item.
6. **Goblin Shaman** — a 19×11 leafy arena with scattered tree stumps, isolated cardinal-line Goblin Archers, and one range-3 Shaman that can teleport up to half an arena away. Its first clear awards Shaman's Ring.
7. **Beast Tamer** — a 13×9 leafy arena with tree-stump walls and central gaps. The boss keeps its distance, usually drops two temporary beast cages but sometimes only one, and awards the persistent Bestiary.
8. **Abyssal Squid** — a 20×13 wooden route over two tones of water. Four Squid Knights guard a stationary 3×3 boss. The Squid is invulnerable until all four Tentacles are cut by Tidecaller Trident throws; the Squid itself can then be damaged by Trident throws or Worm's Acid Shot.

## Adventure

The earth dungeon uses connected procedural 9×9 rooms. The starting room is peaceful, has four exits, and shows a bright 3×3 sunlight patch where the party descended on the Undertaker's rope. Rings are three rooms thick; danger and enemy types scale from Rats to Ants to Clay Golems. Rooms persist for the duration of a run, including defeated enemies, opened chests, revealed traps, and used hot springs.

The sidebar dungeon map stays in a compact scrolling viewport; Expand opens a larger scrollable map. Special rooms use named sprite markers rather than internal letter codes. After the Fishing Rod quest, the repeat Water Dungeon entrance appears as a dedicated room with a full 3×3 portal instead of an ordinary-room pickup tile.

Lottery rooms can appear with any normal exit count. Entering one seals every exit behind gates until its deliberately gaudy center wheel is spun. The result is either several ring-scaled gold prizes or a group of ring-scaled enemies, which may include non-boss support creatures from completed Battles. Collecting every prize or defeating every summon opens all gates.

Every five actions consume one stamina. Moving, attacking, and getting hit count as actions; passing does not. Gold is carried until the run ends. Escape Ropes bank all carried gold; death or stamina exhaustion banks 75%.

After Battle 3, `Lost Adventurer` is automatically obtained and selected. Its map marker leads to a guaranteed ring 1 dead end containing three Skeletons guarding a captive whose identity is hidden until found. The cage opens when the last Skeleton falls. Interacting with the freed Shopkeeper completes the quest and permanently unlocks the Shop.

Adventure supports manual play, Together/Split/Quest auto strategies, independent party positions, automatic portal preferences, and restart when the selected party is fully recovered.

## Party, Training, Shop, and Fishing

Party and Inventory share one section. Every member has six equipment slots: Helmet, Chestplate, Leggings, Boots, Sword, and Accessory. Equipped items stay out of the unequipped inventory grid. Gear and fish add flat base stats; gold training then compounds the result by 5% per level.

Shaman's Ring grants Sp. Attack and Speed. In Adventure, its wearer has a 20% chance to avoid trap or enemy damage and teleport to a random safe floor tile in the current room.

The Shop begins with Buy/Sell. The rescued Shopkeeper sells the Undead Gem, potions, unlocked quests, and available Escape Rope tiers. Enemy materials and fish can be bulk-sold. Rat Pelts, Ant Chitin, and Ink Sacs are bait with 2%, 3%, and 4% fish chances respectively.

Fishing uses one bait per cast and repeats until the selected bait is depleted. Each stat fish permanently adds three base points. Each member/stat can consume at most half the highest completed Battle number in fish, rounded down.

A member can only be assigned to one active mode at a time. Battle deployment, Adventure, and Fishing reserve that member until the activity ends; other modes automatically exclude or disable them.

## Development

```bash
npm install
npm run dev
npm test
npm run build
npm run package:dir
```

Keyboard controls:

- `WASD` or arrow keys move the acting unit.
- `Space` attacks an adjacent target when possible or passes.
- `Q` toggles auto for the active Battle or Adventure.

## Project layout

```text
src/assets/sprites/           SVG art grouped by terrain, units, objects, and item type
src/content/levels/           One file per Battle
src/content/boards/           Battle boards and shared terrain definitions
src/content/enemies/          One file per enemy definition
src/content/adventure-rooms/  Premade Adventure room layouts
src/content/sprite-registry/  Asset imports grouped by sprite category
src/game/adventure/           Focused Adventure models and rule modules
src/game/progression/         Focused progression, economy, and activity modules
src/features/                 React views grouped by player-facing feature
src/features/shared/          Shared presentation primitives
src/features/shell/           Save selection and application-level overlays
electron/                     Desktop shell
```

Start with [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md) for the project's working rules,
tone, visual direction, file philosophy, testing, and release process. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed dependency boundaries and where
new content belongs.

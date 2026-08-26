# Current Game Design

This document records implemented prototype rules. Content-specific definitions belong in `src/content`; shared mechanics belong in `src/game`.

## Presentation rule

The default interface is visual and terse. Persistent screens should show titles, names, quantities, costs, concise state, and necessary action labels—not instructional paragraphs. Layout, sprites, selection states, disabled states, and immediate feedback should teach the interaction. Longer prose is reserved for brief character flavor, quest context, or a mechanic that genuinely cannot be made legible visually.

## Unlock graph

```text
Battle 1 ──> Adventure + Battle 2
Adventure death ──> Training
Battle 2 ──> Battle 3
Battle 3 ──> marked Lost Adventurer quest + Battle 4
Lost Adventurer ──> Shop ──> Undead Gem
Undead Gem + Battle 4 ──> Rescue Me + Battle 5
Battle 5 ──> Retrieve Lost Item + Battle 6
Battle 6 ──> Shaman's Ring + Battle 7
Battle 7 ──> Bestiary + rare creature ingredients + Crooked Still + Battle 8
Retrieve Lost Item ──> Fishing + Water Dungeon revisits
Water offering trial ──> Tidecaller Trident + Weapon Throw
```

A navigation section is absent—not disabled—until unlocked. Battle and Party are visible on a new save, with Battle as the initial screen. New saves begin with 0 gold.

## Battle rules

- The middle three board columns are neutral. Columns left of them favor players; columns right favor enemies.
- Friendly territory multiplies every allied combat stat by 1.25. Enemy territory does the same for enemies.
- A turn permits one orthogonal step, one valid attack, a learned Weapon Throw, or a pass.
- Walls block movement, projectiles, and line of sight. Gaps block movement only.
- Party members deploy to distinct open player-owned tiles before combat begins.
- A member assigned to Battle, Adventure, or Fishing cannot be assigned to either of the other modes until released.
- Killing the marked Battle boss wins immediately, even when guards remain.
- Battles award no gold. First clears trigger their explicit unlock and advance directly to the next Battle; cleared Battles cannot be replayed.

### Implemented Battles

| Battle | Boss | Board | First-clear effect |
| --- | --- | --- | --- |
| 1 | Undertaker | 10×7 mossy graveyard, six symmetrically placed tombstones | Lowering Rope, Adventure, Battle 2 |
| 2 | Skeleton | Same graveyard; Skele-Giraffe + Skele-Hippo | Battle 3 |
| 3 | Skele-Prince | Same; adds Skele-Rhino | Lost Adventurer quest, Battle 4 |
| 4 | Skele-King | Same; adds Skele-Brachiosaurus | Rescue Me, Battle 5 |
| 5 | Goblin Chief | 19×11 leaf scaffold, gaps, tree-stump walls | Retrieve Lost Item, Battle 6 |
| 6 | Goblin Shaman | 19×11 leafy ranged scaffold with scattered tree stumps, four isolated Archers, and one range-3 Shaman with half-arena teleport | Shaman's Ring, Battle 7 |
| 7 | Beast Tamer | 13×9 leaf arena, tree stumps, central gaps | Bestiary, Frogs/Mutant Rats/Fire Ants and the Crooked Still, Battle 8 |
| 8 | Abyssal Squid | 20×13 wood route over murky and blue water; four Squid Knights and four Tentacles | — |

The Skele-King takes no damage while no deployed party member has the Undead Gem equipped. Defeat without it logs that the King is invulnerable and hints that progress lies outside the Battle. The gem is a 250-gold Shop accessory.

Battle 1 is auto-winnable by a fresh Knight. Battle 2 is not; the balance test requires early HP, Attack, Defense, and Speed training before auto wins.

The Beast Tamer uses a two-tile ranged attack and periodically drops one or two temporary summon cages onto random open tiles, with two cages being more likely. A summoned Fire Ant, Alligator, Dragonfly, or Bee is invulnerable until it walks out; the cage disappears on that first step. Fire Ants shoot in cardinal lines, the two-tile Alligator's Wide Snap hits the center and two diagonal tiles in front of it, Dragonflies attack straight or diagonally at range 2, and Bee attacks can paralyze. Mobile ranged enemies retreat when engaged at melee distance.

The Battle 7 Bestiary is opened from Adventure. It persists enemy species defeated in Battles and Adventure and shows their sprites and base stats.

After Battle 7, rare Frogs appear across the first two Adventure zones, alongside Mutant Rats in zone 1 and Fire Ants in zone 2. Their Eye of Frog, Mutated Rat Tail, and Fire Ant Chitin drops feed a one-time exchange with Charles at The Crooked Still in zone 2: 10 of each yields three Level 1 Mystery Potions. Each bottle rolls three distinct Level 1 potion effects, grants two at full strength, applies the third in reverse at half strength, and gives a non-stacking 5% chance to dodge direct enemy attacks for 30 minutes.

The Battle 8 Squid is stationary, fills a 3×3 blue-water area, and fires anywhere with clear line of sight. It remains invulnerable while any of its four Tentacles lives. Tentacles only take damage from Tidecaller Trident throws; the Squid can be hit by either Trident throws or Worm's Acid Shot once the shield is down. The Squid's footprint blocks a Trident line to a Tentacle behind it, so auto repositions around the wooden routes. An equipped Trident uses Attack for its one-tile thrust and Sp. Attack for throws.

## Adventure rules

Earth Adventure is a persistent procedural graph for one run. Rooms are 9×9, their exits are reciprocal, all non-wall tiles are connected, and the generated room graph always retains an unexplored frontier. Exit-count weights are 15% dead end, 50% two-way, 25% three-way, and 10% four-way. Continuing straight from the entrance is the least likely optional exit.

The in-page dungeon map has a bounded, scrollable viewport so exploring broadly does not expand the Adventure sidebar. Its expanded overlay provides the larger browsing surface. Special rooms are labeled with readable keywords and representative sprites rather than development letter codes.

The starting room is unringed, peaceful, and has four exits. Its center 3×3 uses a bright sunlight floor where the Undertaker's rope lowered the party. Rings begin outside the start and are three rooms thick:

- Ring 1: Rats and sewer/deep-floor art.
- Ring 2: Ants and varied wooden floors.
- Ring 3+: slow Clay Golems and sewer floors.

Traps remain hidden until a unit steps on them. Gold pickup count is unaffected by Luck; each Luck point adds 12% to the value of a pickup before ring scaling and also reduces hazard odds. A hot spring restores one third maximum stamina once per member per run.

Every five actions cost one stamina. Moving, attacking, and getting hit are actions. Passing changes turn order without moving or spending stamina progress. At zero stamina the member is ejected; at zero HP the member respawns at 10% HP and is ejected. If nobody remains, 75% of carried gold is banked. A matching Escape Rope tier evacuates the full expedition and banks 100%.

Lottery rooms use the ordinary one-to-four-exit distribution. Every exit is replaced by a sealed gate when the room is discovered. Stepping onto the intentionally gaudy 3×3 game-show wheel produces either two or more ring-scaled gold piles or one or more ring-scaled enemies. The enemy pool includes the room's normal ring enemy plus non-boss support enemies from completed Battles. The gates become exits again only after every prize pile is collected or every summoned enemy is defeated.

The first Adventure death permanently unlocks Training. Party is available from the start. Exhaustion alone is not a death.

### Shopkeeper room

Battle 3 automatically awards and activates `Lost Adventurer`. The quest reserves a marked route to one legal ring 1 dead-end room. Three weaker Adventure Skeletons guard a captive whose identity is not disclosed in the quest copy. The last Skeleton opens the cage. Interacting with the freed Shopkeeper completes the quest and unlocks the Shop. Like other marked objectives, it is recreated on a later run if it was not completed.

### Quests and Water Dungeon

`Rescue Me` unlocks after Battle 4 and costs 500 gold. It creates the marked ring 2 Spider/cage room; killing the Spider recruits Worm and ejects the expedition.

`Retrieve Lost Item` unlocks after Battle 5 and costs 1,000 gold. Its marked ring 2 portal requires all dispatched members on the center 3×3. The first Water Dungeon visit has sandy floors, dense water walls, Octopi, and a guaranteed Fishing Rod room between rooms 7 and 10. Taking the rod completes the quest and ejects the expedition.

After the Fishing Rod quest, an earth ring 2 revisit entrance is generated as its own full portal room with a 3×3 Water Dungeon platform. Only one such room appears in a run.

Later Water Dungeon runs can contain the offering chamber plus its reserved Merman throne room. Auto turns off only when entering the sealed offering chamber from the ordinary dungeon. Four randomly selected fish tiles form a diamond, with selection strongly weighted toward fish already in the inventory. Correctly placing those four fish opens the five-tile door. The throne door seals during the three-Merman fight. The final Merman reveals a Tidecaller Trident chest; taking it reopens the door and learns Weapon Throw.

## Character progression

Each member stores current HP, stamina, action progress, eight gold-training levels, eight fish base bonuses, and six equipment slots. Outside Adventure, all members regenerate 8% maximum HP and 20% maximum stamina per second.

Battle 6 awards the unique Shaman's Ring accessory. It adds flat Sp. Attack and Speed. In Adventure, each incoming trap or enemy damage event has a 20% chance to deal no damage and instead teleport the wearer to a random unoccupied safe floor tile in the current room.

Gold training starts at 3 gold. Its per-level cost growth is 1.1× for levels 1–10, 1.2× for 11–20, and increases by another 0.1× each ten-level band. Training prices are whole numbers, and any fractional remainder in the balance is rounded down after purchase. Training instantly adds one multiplicative level. Gear and fish modify base stats before the `1.05^training` multiplier. Each fish adds three base-stat points, and each member/stat accepts at most `floor(highest completed Battle ÷ 2)` fish.

Knight uses short-range physical attacks. Worm uses special Acid Shot in a straight cardinal line up to exactly four tiles. Learned Weapon Throw travels along an unobstructed cardinal line and forces the next turn to pass. An equipped Tidecaller Trident replaces melee with a one-tile physical thrust using Attack; Tidecaller Throw uses 3× Sp. Attack and has a four-turn cooldown, with the forced retrieval pass counting as its first cooldown turn.

## Economy and saves

Gold has no passive source. Current sources are carried Adventure pickups, Shop sales, and future explicit content. Battles never pay gold.

The game has three local save slots. Saves retain unlock flags, party state, training, inventory/equipment, Battle clears, Adventure records, quest state, fishing, potion timers, and Water Dungeon trial state. Older prototype saves migrate forward conservatively so previously reached content remains visible.

# Chapter One audit

This audit covers the implemented chapter from Battle 1 through opening the Great Tower. The original pass reviewed 237 SVG assets, the 10 authored Battles, all 18 fixed Adventure-room layouts, procedural Earth/Water/Forge rooms, Mining, and the one-time progression rewards that connect them. The art follow-through added 52 scenery SVGs, three Zone 2 dirt textures, and 12 depth-band Mining assets, bringing the current library to 304.

## SVG audit

### Technical inventory

- The original 237/237 SVGs rendered successfully and were referenced by the TypeScript sprite registries.
- The baseline contained 55 units, 49 objects, 43 terrain sprites, and 90 items. The implementation pass added 52 registered objects.
- All files have a `viewBox`; 225 use the standard 16×16 pixel-art canvas and 12 are intentional multi-tile composites.
- There are no byte-identical duplicates. The sprite facade and category registries cover every asset.
- The art direction is coherent: hard-edged pixel geometry, dark outlines, small controlled palettes, and readable silhouettes. The weak spots are character/detail, not broken assets or a conflicting style.

### Art implementation follow-through

- Added 52 visual-only scenery sprites. They are typed and registered but deliberately have no collision, targeting, balance, reward, or save-version effects.
- Replaced Zone 2's wooden Adventure floor with three compacted-dirt ant-nest variants, then recolored the Zone 2 nest props and Zone 3 archaeological props to sit within their surrounding ground palettes instead of reading as freestanding display pieces.
- Rebuilt the Mining environment as five geology bands shared by Rooms 1–2, 3–4, 5–6, 7–8, and 9–10. Each band has its own natural cave floor, craggy wall, and deliberately unremarkable mineable boulder; visible gems no longer imply that every hidden rock contains ore.
- Dressed the later Battle boards with camp construction for Battles 5–7, wreckage/sea life/ooze machinery for Battles 8–9, and a reusable pipe/grate/valve/lamp language for Battle 10. Battles 1–4 were intentionally returned to a sparse, symmetrical four-tombstone graveyard so the opening fights remain visually quiet.
- Added seeded zone-specific scenery to ordinary Earth rooms and underwater wreck scenery to ordinary Water rooms. The starting room now visually establishes the lowering rope.
- Expanded the Angler, Cartographer, Potionmaster, Miner, and Tower Exterior rooms with dedicated props instead of repurposed generic rugs or empty floor.
- Redrew 36 existing assets: the weakest tower fixtures, gates/rocks/worktable/map/net, Rat/Ant/Soldier Ant/Octopus/Ooze Guardian/Gloom Wisp, all four Forgelings, Angler/Cartographer/Potionmaster, five basic materials, and high-repetition Forge/Mining/Tower/Rustmire floors.
- Recommendations below are preserved as the design record. Unimplemented suggestions are a future art backlog, especially gear silhouette evolution, the potion-family pass, and P2/P3 room dressing.

### Keep as the quality bar

These already carry a strong identity at in-game size:

- Units: Knight, Miner, Merman, Squid Knight, Fire Alligator, Rustmire Engine, Brine Dynamo, Barnacle Drone, Goblin Shaman, Goblin Archer, Skeleton King, Skeleton Prince, Mimic, and Glow Scorpion.
- Objects: the Lottery wheel set, Hot Spring, Teleport, Water Throne, Blacksmith workshop set, Tower Door, Chest/Open Chest, and Summon Cage.
- Terrain: both raid-water tiles, pressure vat, abyssal metal, raid leaves/planks, tombstone, tree stump, volcanic wall, and the fire-beam pair.
- Items: the eight fish, Shaman's Ring, Suction Cups, Undead Gem, Rusty Gear, Magic Bait, Fishing Rod, Pickaxe, and Tower Key.

### Highest-priority character pass

These are readable but look more like symbols/placeholders than inhabitants or landmarks:

- Tower garden set: `tree.svg`, `statue.svg`, `fountain.svg`, `bench.svg`, `wall.svg`, and `water.svg`. Most use only three to five primitives, so the 31×31 finale has a strong layout but comparatively flat fixtures. Give the tree an asymmetric crown and roots, the statue a recognizable hero/monster silhouette, the fountain a basin and water arc, the bench ironwork, and the masonry crest/ivy variants.
- Small common enemies: `rat.svg`, `ant.svg`, `soldier-ant.svg`, `octopus.svg`, `ooze-guardian.svg`, and `gloom-wisp.svg`. Add one species-defining feature apiece: ragged tail/ear, mandibles and abdomen bands, a shield-like thorax, uneven curling tentacles, a contained core, and drifting flame wisps.
- Forgeling quartet: the four furnace bodies read, but the variants differ mainly by the attachment. Push the silhouettes: chain spool/dragging chain, bellows lungs and nozzle, oversized hammer arm, and a visibly molten base form.
- Optional NPCs: Angler, Cartographer, and Potionmaster are clean but share the same upright, front-facing doll construction. Give each a stronger pose and carried story prop: leaning rod/hat hooks, rolled maps and an ink-stained satchel, and an uneven bottle bandolier with vapor.
- Basic props: `clay-gate.svg`, `forge-gate.svg`, `cave-rock.svg`, `clay-boulder.svg`, `map-table.svg`, `angler-net.svg`, and the Potionmaster `table.svg`. Add damage, fasteners, contents, or a secondary material so repeated placement does not expose the primitive geometry. Mining boulders are the exception: their restraint is intentional because contents remain hidden until excavated.
- Basic materials: Clay, Driftwood, Seaweed, Rotten Tentacle, and Rusty Metal. Their silhouettes are distinct, but each needs a memorable internal mark—fingerprint, nail/barnacle, torn fronds, suckers/slime, or rivets/corrosion holes.

### Medium-priority family pass

- Weapon tiers are mostly palette swaps. Heavy Sword, Burst Staff, and Rapid Staff should gain geometry by level (larger guard, extra crystal/prongs, bands/runes), so a Level 4 drop reads as stronger before the tooltip appears.
- Armor tiers distinguish material mainly through color. Add one silhouette step per tier: helmet plume/horns, chest shoulder plates, boot cuffs/spurs, and plated leggings.
- Level 1 and Level 2 potion families are readable, but the repeated bottle templates make the stat identity depend heavily on color. Give each effect a tiny stable glyph and use the Level 2 silhouette as an evolved version of the same bottle.
- Floor variants are useful texture rather than hero art, but Forge A/B, Deep A/B/C, and Tower Path need more contrast or additional alternates before they are tiled across larger future rooms.
- The skeleton animal family is charming and should stay; a small shared accent such as grave moss, cracked royal magic, or dirt shadow would keep the pale bones from visually floating.

## Bland locations and proposed SVGs

Priority is based on how often the player sees the location and how much repeated tiling is currently exposed.

| Priority | Location | Why it feels thin | Suggested SVG set |
| --- | --- | --- | --- |
| P0 | Battles 1–4, Graveyard | Four consecutive Battles reuse the same board and one tombstone landmark. Enemy escalation is not reflected in the arena. | cracked-grave, bone-pile, funeral-candles, iron-fence, dead-tree, mausoleum-slab; add royal-crypt-banner and grave-throne for Battles 3–4 |
| P0 | Battle 10, Flooded Foundry | The large 27×15 finale repeats abyssal-metal floor and pressure-vat walls; the machinery route is good but visually anonymous. | pipe-straight/corner/junction, valve-wheel, floor-grate, steam-vent, dynamo-cable, rust-puddle, warning-lamp |
| P0 | Ordinary Earth rooms | Procedural walls create different geometry, but each zone has few story decals, so long auto runs blur together. | Start: rope-hole and rope-anchor. Zone 1: sewer-grate, leaking-pipe, rat-nest. Zone 2: ant-mound, egg-cluster, resin-patch, root-arch. Zone 3: burial-urn, wall-niche, fossil, pottery-shards. Zone 4: lava-vent, basalt-spire, hanging-chain, ember-pile |
| P1 | Mining Rooms 1–10 | Five two-room geology bands now make depth readable without overstating rewards, but the excavation still lacks sparse signs of an active dig. | timber-support, occasional lantern, rubble, abandoned tool, and—only at appropriate later depths—rare exposed ore-vein props |
| P1 | Battles 5–7, Goblin canopy | Leaves, gaps, and tree stumps repeat across three arenas; roles differ more than the stage dressing. | rope-bridge-edge, patched-planks, goblin-banner, watch-platform, archery-target, hanging-cage, canopy-vine |
| P1 | Battles 8–9, drowned works | Both boards lean on planks plus two water colors, so the Ooze arena does not fully become its own place. | kelp, coral, broken-mast, ink-slick, barnacle-cluster, ooze-slick, guardian-pylon, drain-conduit |
| P1 | Water Dungeon ordinary rooms | Dense water-wall geometry is strong, but the sand/water palette lacks underwater life and wreck history. | coral-small/large, kelp, anemone, shell-pile, bubble-vent, wrecked-crate, anchor, waterlogged-planks |
| P1 | Lost Item / Treasure rooms | The Lost Item room is a bare cross around one chest; Treasure rooms are a chest and four wall blocks. | fishing-crate, snapped-rod, hook-sign, chest-pedestal, coin-scatter, gem-glint, wall-torch, discarded-pack |
| P1 | Cartographer / Angler rooms | The Cartographer has one table and four reused rugs; the Angler has one net and two reeds. | scroll-stack, map-pins, compass-rose floor, survey-tripod, telescope; bait-barrel, fish-rack, tackle-hooks, boat-bow, dock-lantern |
| P1 | Tower exterior | The 31×31 composition is one of the best layouts, but the simplest object family is saved for the chapter-ending reveal. | Redraw the tower garden set; add hedge-corner, fallen-leaves, garden-lantern, tower-banner, ivy-wall, gate-statue variants |
| P2 | Rescue / Shopkeeper rooms | The core story is readable, but open floor around the cage/guards is quiet. | spider-egg-sac, webbed-floor, shed-carapace; broken-crate, fallen-bottle, shop-sign, ledger |
| P2 | Offering / Throne rooms | The doors and throne communicate function, but the ritual lacks a culture-specific visual language. | shell-brazier, coral-pillar, fish-mosaic, offering-bowl, tide-banner, pearl-lamp |
| P2 | Lottery / Dice rooms | The centerpieces work; the rest of each sealed room is intentionally empty but looks unfinished rather than theatrical. | bulb-string, prize-banner, ticket-scrap, brass-pipe, velvet-rope; dice-rubble, tally-board, curse-rune |
| P2 | Potionmaster / Miner / Hammer Vault | Layouts are distinct, yet repeated tables/rocks and bare floors leave room for environmental storytelling. | potion-spill, herb-bundle, bottle-crate, vapor-cloud; minecart/rails, support-beam; clay-sarcophagus, chain-anchor, funerary-sigil |
| P3 | Forge | This is already the strongest room family, but future repetition will expose reuse of Blacksmith props. | conveyor, gear-stack, ingot-mold, cooling-vat, slag-pile, crane-hook, furnace-pipe |

The best first art batch is the P0 group: it improves four early Battles, the final Battle, the most repeated procedural rooms, and the Mining loop with reusable tiles rather than one-off set pieces.

## Deferred optional systems for later chapters

These ideas are intentionally not part of the opening-chapter implementation; the current early game already teaches enough systems. They remain a future-facing backlog for later chapters, where each could accelerate or specialize a build without becoming required for the Tower Key.

1. **Epitaph Keeper — after Battle 2.** A rare Graveyard annex lets the player restore epitaph sets with gold and skeletal drops. Completed family sets grant small global bonuses; duplicate inscriptions become Soul Dust. Later, exhibit ranks and cemetery wings multiply one another and can be auto-restored.
2. **Camp Cook — after the first Hot Spring.** Fish and ordinary materials become meals chosen before an expedition. Meals change run behavior rather than permanently replacing Potions: stamina cadence, target preference, gold retention, or trap resistance. Kitchen mastery raises batch size, duration, and eventually auto-cooks saved menus.
3. **Trapwright — after Rescue Me.** Spider silk/carapaces and zone drops craft reusable trap plans placed at room entrances. Traps weaken or mark enemies and create a material sink. A later Trap Network produces charges offline and scales through plan rarity, room coverage, and resettable workshop reputation.
4. **Relic Curator — after Battle 4.** Boss and species relics fill museum collections. Each display gives a modest additive bonus; complete themed halls multiply those bonuses. Repeated relics are donated for Curator Renown, providing a long-term collection prestige layer without blocking combat.
5. **Goblin Tinkerer — after Battle 5.** Builds opt-in automation modules: sell filters, potion thresholds, preferred loot, target priorities, and crafting queues. Modules consume scrap and power, forcing choices early; later generators, buses, and logic slots scale into huge automation multipliers.
6. **Rune Scribe — after Battle 6.** Unwanted gear is dissolved into rune ink and socketed into equipment. Runes begin as narrow stat converters or ability modifiers; matching glyph words create multiplicative Resonance. Auto-salvage rules and rune fusion give duplicate gear a permanent late-game purpose.
7. **Beast Keeper — after Battle 7.** Bestiary kills can rarely yield non-combat specimens for habitats. Habitat groups generate materials or tactical auras; breeding combines traits without adding party units to every fight. Generations, mutations, and sanctuary resets provide an exponential side ladder.
8. **Pearl Diver — after Battle 8.** Assign one idle member to descend through pressure bands for pearls, wreckage, and rare currents. The player chooses when to surface and bank the haul. Depth, oxygen rigs, and Dive Renown resets naturally support extremely large production values.
9. **Surveyor's Guild — after the Cartographer and Battle 9.** Dispatch survey teams along already discovered room graphs. Routes trade time and risk for targeted zone materials; completing atlas pages grants global navigation and offline-efficiency bonuses. New chapters add atlas layers instead of replacing the system.
10. **Foundry Engineer — after Battle 10.** Rusty parts feed a small factory of pumps, presses, dynamos, and assemblers. Early machines automate Chapter One consumables; later machine tiers feed one another, with heat/pressure as production multipliers and Foundry Rebuilds as a scalable prestige reset.

## Bugs found and patched

1. **One-time rewards could be destroyed by inventory capacity.** A full backpack could complete the Trident trial without granting the Trident, or clear Battle 10 without granting the Rusty Gear needed for the Tower Key. Battle milestones, the Trident, and the Cartographer's one-time Chalk now expand minimum capacity and are never discarded. Ordinary random loot still obeys normal capacity.
2. **Non-repeatable gear could be sold.** The Shop offered the Trident, Shaman's Ring, Suction Cups, and Undead Gem as ordinary sellable gear. Milestone gear is now hidden from the sell list and rejected by the rules layer.
3. **Already affected saves stayed blocked.** Save version 45 repairs a missing Trident after a completed trial and a missing Rusty Gear after Battle 10, while not recreating Rusty Gear after the Tower Key legitimately consumed it.
4. **Crafted gear IDs could collide.** IDs used `inventory.length + 1`; selling an early copy and crafting again could duplicate an existing ID, after which selling one item could remove both. Crafting now finds an unused ordinal, and the sell rule removes only one entry even if a legacy save already contains duplicate IDs.

Verification is recorded after the implementation pass in the handoff summary.

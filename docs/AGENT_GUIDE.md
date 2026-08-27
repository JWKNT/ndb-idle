# Working on NDB Idle

This is the practical handbook for coding agents and contributors. It explains not only
where code lives, but what the game is trying to be and which seemingly harmless changes
have repeatedly pushed it in the wrong direction.

Read this file before making broad UI, content, progression, save, art, or combat changes.
For a detailed directory map, also see [`ARCHITECTURE.md`](ARCHITECTURE.md). For implemented
rules, see [`GAME_DESIGN.md`](GAME_DESIGN.md). For the complete branching unlock map, see
[`PROGRESSION_TREE.md`](PROGRESSION_TREE.md).

## Authority and source of truth

Use this order when information conflicts:

1. The user's current explicit request.
2. Current code and passing tests.
3. This guide.
4. `ARCHITECTURE.md` and `GAME_DESIGN.md`.
5. Older audits, screenshots, and prototype notes.

The game changes quickly. Descriptive docs can lag behind behavior. Do not change correct
code merely to match an older paragraph; update the paragraph instead.

Before editing:

- Run `git status` and preserve unrelated local work.
- Find the focused module and its tests before reading a giant facade end to end.
- Check unlock and save-migration implications, not only the visible happy path.
- Update `PROGRESSION_TREE.md` in the same change whenever progression branching changes.
- Inspect an existing neighboring implementation before inventing a new convention.

## Product identity

The game is **NDB Idle**. It is an idle tactics game with manual grid combat, procedural
adventures, escalating numbers, equipment, mining, fishing, crafting, and automation.
`break_eternity.js` is present because the progression is expected to grow far beyond the
opening content.

The current complete opening contains Battles 1–10 and the associated activities leading
to the Great Tower. Entering the Tower with the Tower Key is its structural endpoint.
Battle 11 is also visible as a deliberately unbeatable preview: its disconnected islands
require a future water-crossing party ability and its placeholder numbers assume additional
Tower-side progression. That structure is for development planning only.

Never expose development vocabulary such as **chapter**, **zone**, or **depth** in
player-facing prose. Use actual place names, visible landmarks, rooms, routes, floors, or
plain natural language. Battle numbers are player-facing and may be used.

## The NDB voice

The anchor line is:

> NDB MEGASOFTWARE PRESENTS...

The comedic voice is an absurdly self-important software company presenting tiny, broken,
or dangerous events as historic product launches. It is corporate confidence applied to
graves, bad bridges, hostile puddles, wet machinery, and integers. It should feel crass,
overconfident, meta-ironic, and specific—not regal, literary, wistful, or generically
quirky. That voice is deliberately restricted to pre-battle stories, actual character or
NPC dialogue, bestiary prose, and item descriptions. The title's requested anchor line is
product identity, not a template for informational UI.

Good tonal ingredients:

- Divisions, initiatives, quarterly triumphs, liability, premium systems, launch events.
- Monumental language for extremely minor achievements.
- Confident statements whose underlying facts are obviously terrible.
- Short all-caps phrases used as declarations, not constant shouting.
- Concrete visual jokes rather than interchangeable one-liners.

Avoid:

- Earnest fantasy grandeur or lore-heavy solemnity.
- Parchment-era narration, royal elegance, or faux-medieval interface copy.
- Repeating the same joke template across items or log entries.
- Explaining the joke after it lands.
- Quoting or copying another game's text. NDB's voice should stand on its own.

### Copy has different jobs

Humor must not leak into text whose job is to explain state or mechanics. Logs, Help,
toasts, errors, controls, quest objectives, Battle objectives, reward summaries, prices,
status messages, and labels are standard, brief, and informative.

| Surface | Rule |
| --- | --- |
| Pre-battle stories | Corporate spectacle. Name only the headline boss, never supporting mobs. No tactics or solution hints. |
| NPC conversations | Character-driven absurdity in clickable beats with speaker name and sprite. |
| Bestiary | A short creature descriptor only. No stats, mechanics, loot, drops, turns, range, or strategy. |
| Item descriptions | May use the NDB voice while still stating the item's effect accurately. |
| Logs and toasts | Factual and compact: damage, gold, material obtained, movement, failure, unlock, or status. No jokes. |
| First-clear popup | `Defeated <boss>` plus only a concise actual reward or quest. No generic next-Battle sentence. |
| Help | Plain mechanics and controls, grouped into a small index. Unlock-aware, concise, and not a wiki. |
| Quest and Battle objectives | Directly state the objective without jokes, lore, or unnecessary commentary. |
| Persistent UI | Titles, numbers, costs, status, and action labels. Let layout and sprites explain the rest. |

All story, dialogue, NPC copy, and bestiary prose lives in
[`src/content/story-dialogue.ts`](../src/content/story-dialogue.ts). Keep it centralized and
source-readable. The story tests enforce compact lengths, line width, forbidden tactics,
and supporting-mob exclusions.

Do not put room lore, individual equipment entries, exact quest solutions, named-room
walkthroughs, or jokes in Help. Help explains what controls and systems do in the shortest
clear language available. It should not reveal undiscovered activities through generic
pages on a fresh save.

## Visual direction

The interface should resemble blunt software made by a company with unreasonable
self-esteem:

- Arial-like sans-serif typography.
- Flat gray and off-white surfaces.
- Hard dark outlines, square geometry, restrained shadows.
- Color used sparingly for selection, danger, rewards, and strong state changes.
- Compact, legible boxes without decorative side stripes unless the stripe communicates
  real state.

Avoid:

- Paper textures, parchment, tape, seals, ornamental dividers, or renaissance styling.
- Regal polish, fantasy-book elegance, or overly curated boutique UI.
- A card inside a card inside another card when a bounded box is enough.
- Decorative vertical or horizontal accent bars on every element.
- Disabled actions for nonexistent operations. If an empty equipment slot cannot be
  unequipped, render no Unequip button at all.
- Redundant labels such as “Pattern grid” or “Result” when the layout is self-evident.
- Long explanatory paragraphs where visuals and immediate feedback can teach the action.

Important established layouts:

- A new save opens on **Battle**, and Battle appears above Party in navigation.
- Locked navigation sections are absent rather than visible-but-disabled.
- The pre-battle story stays pinned at the top of the right column during combat.
- Battle HP and the factual attack log appear below the story after combat starts.
- There is no Turn Order card in Battle or Adventure.
- Crafting is a centered 4×4 grid leading to a vertically centered output square. An
  unknown pattern is an empty square, not an explanation.
- Adventure headings do not need descriptive subtitles.

When changing visible UI, inspect it at the widths represented by the user's screenshots.
Do not judge a full-page layout only from a narrow component test.

## SVG and animation philosophy

Game art is repository-native SVG with a deliberately crisp, pixel-like vocabulary.
Keep it editable, deterministic, and registered through the sprite registries. Do not
replace established SVGs with generated raster art unless explicitly requested.

The current sprite set is considered good. Prefer targeted additions or corrections over
wholesale redraws.

Board art rules:

- Early battle boards are clean, sparse, readable, and often symmetrical.
- Environmental props should reinforce the place without covering every spare tile.
- The first mine floors look like an excavated natural cave: mostly plain rock, natural
  floors, and few visible gems. Mine visuals advance in two-floor bands.
- Adventure environments should visually distinguish their actual places, but those
  implementation groupings are not named in prose.

Combat effects represent an action, not a collection of cells. A 3×3 sweep should render
as one 3×3 effect centered on the attacker, not eight identical effects playing separately
in neighboring cells. Different party members and weapon families should have distinct
basic and secondary attack motion.

## Architecture boundaries

Imports conceptually flow from the app shell toward stable lower layers:

```text
App / Game orchestration
        ↓
React features and views
        ↓
Framework-free game rules
        ↓
Authored content and sprite registries
        ↓
SVG assets
```

Shared domain types are the narrow exception: content definitions may import types from
`src/game/types.ts`, but content must never depend on React views or application state.

### Shell

- `src/App.tsx` owns the title/save-slot gate.
- `src/Game.tsx` coordinates features, timers, unlock transitions, and active activities.
- Do not add board rendering, content definitions, room generation, or feature-specific
  presentation to either file.

### Authored content

`src/content` contains fixed definitions and layouts:

- One Battle per `levels` file.
- One distinct enemy or player definition per file.
- Reusable boards in `boards`.
- Fixed special rooms in `adventure-rooms`.
- Quests in `quests`.
- Centralized story/dialogue/bestiary text in `story-dialogue.ts`.
- Asset imports split across `sprite-registry` categories.

Definitions should be data. Runtime decisions belong in `src/game`.

### Game rules

`src/game` is framework-free state and behavior. Views call it; it never renders UI.

`combat.ts`, `adventure.ts`, and `progression.ts` are stable public facades. Focused modules
under `game/adventure` and `game/progression` own new behavior. Do not keep adding unrelated
sections to a facade because it is already imported everywhere.

Route work by responsibility:

| Change | Primary home |
| --- | --- |
| Enemy stats or authored behavior flags | `content/enemies` |
| Battle terrain and props | `content/boards` |
| Battle scheduling, attacks, enemy AI | `game/combat.ts` or a focused combat module |
| Adventure generation and room selection | `game/adventure/roomGeneration.ts` |
| Adventure route repair and exits | `game/adventure/exitPlanning.ts` |
| Quest destinations and markers | `game/adventure/questRouting.ts` |
| Adventure auto decisions | `game/adventure/autoStrategy.ts` |
| Adventure LOS, ranges, traps | `game/adventure/combatRules.ts` |
| Gold, materials, training, unlock state | `game/progression` focused modules |
| Save migrations and facade API | `game/progression.ts` |
| Crafting recognition | `game/crafting.ts` |
| Authored crafting shapes | `content/forge-recipes.ts` |

### React features

`src/features` owns rendering and user interaction. A view may derive presentation state,
but game outcomes, prices, unlock checks, drops, AI, and persistence rules belong in
`src/game`.

Use shared primitives instead of allowing pages to drift:

- `features/inventory/InventoryCard.tsx` for inventory items.
- `features/shared/Sprite.tsx` for sprites.
- `features/shared/AttackEffectOverlay.tsx` for attack visuals.
- `features/shell` for title, navigation, save, help, reward, and conversation UI.

### Styles

`src/styles.css` is an ordered manifest. Structural page styles load before later theme
overrides. Put a selector in the narrowest relevant stylesheet and preserve import order.
Do not solve a local component problem with a global element selector unless every page
should change.

### Desktop wrapper

`electron` only wraps the web build. Browser and desktop gameplay must remain equivalent.
Do not hide game rules in Electron-specific code.

## File philosophy

- Give every rule one obvious owner.
- Prefer several focused files over one omniscient file.
- Keep a stable facade when splitting internals so existing callers and saves survive.
- Register new content through the existing indexes rather than creating parallel lookup
  systems.
- Use the `@/` alias for public source imports.
- Split a production file when it mixes responsibilities or approaches roughly 800–1,000
  lines. Long cohesive behavior tests are acceptable.
- Avoid speculative abstractions for content that does not exist yet, but do not encode a
  one-off in a view when it is clearly the first instance of a scaling mechanic.
- Never edit `dist`, `release`, `node_modules`, build-info files, or other generated output.

### Extensibility contracts

Any system that can gain “another one” is a closed registry until deliberately extended.
Do not add an enemy, party member, Battle, board, quest, material, potion, milestone item,
weapon ability, attack visual, or activity-specific enemy by changing only the first file
that makes it appear on screen.

- Use the identity-preserving `defineUnit`, `defineBoard`, and `defineLevel` helpers for
  authored definitions. They keep literal IDs available to exhaustive registries while
  exposing stable broad interfaces to runtime code.
- Register authored content in its existing index. The filesystem-discovery checks in
  `src/content/extension-contracts.test.ts` fail when a definition file is authored but
  omitted from its registry.
- Model every downstream decision with a typed exhaustive `Record` or discriminated
  contract. An intentional lack of behavior must be represented explicitly by `none`,
  `null`, or an empty effect list; never rely on a default fallthrough.
- Unique content still needs a contract. Milestone gear declares effect traits, Battles
  declare first-clear effects and notices, quests declare completion effects, Adventure
  enemies declare drops (including no drop), potions declare an effect family, and attack
  visuals declare area/projectile presentation.
- Derive unions from canonical `as const` ID arrays or identity-preserving registries.
  Avoid `Record<string, ...>` and fallback sprites for a closed content set; those hide
  omissions from TypeScript.
- When introducing a genuinely new effect family, extend its discriminated union, add the
  owning runtime handler, and add a focused behavioral test. The registry-wide contract
  test is a completeness gate, not a substitute for verifying the unique behavior.

If a future scalable system does not fit an existing contract, add a new exhaustive
contract and include it in `extension-contracts.test.ts` in the same change.

## Numbers and persistence

Use `break_eternity.js` `Decimal` values for scalable stats, prices, gold, damage, and other
quantities that can eventually exceed JavaScript's safe numeric range. Convert to ordinary
numbers only for bounded UI geometry, counts, probabilities, or array indexes.

Player-visible gold is whole. Purchases must not leave fractional gold; round the remaining
balance down where required by the existing economy rules.

Save data is a public compatibility surface. When adding persisted state:

- Add a safe default for old saves.
- Sanitize loaded values.
- Add or extend a migration rather than assuming a fresh file.
- Preserve previously earned unique items and unlocks.
- Test both a new save and a representative older save.

The game stores three local save slots and time played. Web and Electron storage are local
to their respective app origins; publishing a new build must not assume cloud saves.

## Gameplay conventions worth preserving

- New saves begin with 0 gold and open on Battle.
- Party members regenerate HP and stamina whenever they are outside every active activity.
- Battle, Adventure, Mining, and Fishing assignments are mutually exclusive where the
  activity owns that member.
- Manual left click performs a normal attack; right click performs a weapon secondary.
- WASD/arrow movement and auto must not become permanently stuck behind an NPC.
- NPC rescues and milestone handoffs use clickable conversations before ejection.
- First Battle clears show a persistent defeated popup with Continue.
- Optional systems should enter gradually. Do not flood the opening with ten simultaneous
  side mechanics merely because later scaling will be enormous.

These are conventions, not permission to hardcode behavior in the UI. Implement them in
the relevant game-rule layer.

## Tests and verification

Every behavior change should have a focused regression test near the owning layer. Favor
observable rules over implementation details.

Minimum checks:

```bash
npm test
npm run build
```

For GitHub Pages asset-path verification:

```bash
GITHUB_ACTIONS=true GITHUB_REPOSITORY=JWKNT/ndb-idle npm run build
```

The generated `dist/index.html` should reference `/ndb-idle/` assets in Pages mode and
relative assets in normal desktop builds.

For a requested desktop rebuild:

```bash
npx electron-builder
```

The packaged app is written to `release/mac-arm64/NDB Idle.app` and the DMG to `release`.
Verify the new hashed Vite bundle exists inside `Contents/Resources/app.asar`; do not infer
success merely from an old app already being present. A running Electron process keeps its
old code until fully quit and reopened.

For visual changes, supplement tests with actual browser or app inspection. Verify the
relevant screen, interaction state, and at least one representative smaller viewport.

## GitHub and deployment

The public repository is:

- Source: <https://github.com/JWKNT/ndb-idle>
- Live game: <https://jehlp.net/ndb-idle/>

`.github/workflows/deploy-pages.yml` tests and builds every push to `main`, then deploys the
`dist` artifact to GitHub Pages. HTTPS is enforced. Do not commit generated `dist` or
desktop packages.

Do not push, publish, create releases, or mutate repository settings unless the user has
authorized that external action. When authorized, verify the workflow and live URL rather
than stopping after `git push`.

## Definition of done

A change is complete when:

- It lives in the correct architectural layer.
- It follows the appropriate copy and visual rules.
- It preserves old saves or includes a migration.
- Relevant focused tests and the full suite pass.
- The production build succeeds.
- Visible work has been visually checked in proportion to its risk.
- Requested desktop or web deliverables are rebuilt and verified, not assumed.
- Documentation is updated when an architectural convention or major mechanic changes.

import type Decimal from "break_eternity.js";

export const HOME_ZONE_BONUS = 1.25;

export type Team = "player" | "enemy";
export type Terrain = "player" | "neutral" | "enemy";
export type BattleStatus = "deploying" | "fighting" | "won" | "lost";
export type PlayerId = "knight" | "worm" | "miner";
export type AdventureStrategy = "quest" | "together" | "split" | "ring";
export type AdventureDungeonId = "starting" | "great-tower";
export type PortalType = "water" | "forge";
export type AdventureAutoPauseRoom = "blacksmith" | "potionmaster" | "oddityBrewer" | "cartographer" | "angler" | "towerExterior";
export type AttackType = "physical" | "special";
export type AttackPattern = "orthogonal" | "eight-way" | "any";
export type AttackArea = "single" | "front-three";
export type WeaponAbilityId = "sweep" | "heavy-slam" | "burst-staff" | "rapid-staff" | "trident-throw";
export type AttackVisualId =
  | "knight-slash"
  | "worm-acid"
  | "miner-pick"
  | "sword-sweep"
  | "heavy-slam"
  | "burst-orb"
  | "rapid-bolt"
  | "trident-throw"
  | "fire"
  | "abyssal"
  | "magic"
  | "physical";
export type HorizontalFacing = "left" | "right";
export type StatKey =
  | "hp"
  | "stamina"
  | "attack"
  | "defense"
  | "spAttack"
  | "spDefense"
  | "speed"
  | "luck";

export interface Position {
  x: number;
  y: number;
}

/** Visual-only scenery. These never affect collision, targeting, or rewards. */
export type SceneryKind =
  | "graveCracked"
  | "graveBonePile"
  | "graveCandles"
  | "graveFence"
  | "graveRoyalBanner"
  | "goblinPatchedPlanks"
  | "goblinBanner"
  | "goblinTarget"
  | "goblinRopeCoil"
  | "drownedKelp"
  | "drownedCoral"
  | "drownedMast"
  | "drownedBarnacles"
  | "drownedOozeSlick"
  | "drownedPylon"
  | "rustmirePipeStraight"
  | "rustmirePipeCorner"
  | "rustmirePipeJunction"
  | "rustmireValve"
  | "rustmireGrate"
  | "rustmirePuddle"
  | "rustmireLamp"
  | "beachPalm"
  | "beachShells"
  | "beachDriftwood"
  | "earthRopeAnchor"
  | "earthSewerGrate"
  | "earthLeakingPipe"
  | "earthRatNest"
  | "earthAntMound"
  | "earthEggCluster"
  | "earthResinPatch"
  | "earthBurialUrn"
  | "earthFossil"
  | "earthPotteryShards"
  | "earthLavaVent"
  | "earthBasaltSpire"
  | "earthEmberPile"
  | "cartographerScrolls"
  | "cartographerCompass"
  | "cartographerTripod"
  | "anglerBaitBarrel"
  | "anglerFishRack"
  | "potionHerbs"
  | "potionBottleCrate"
  | "gardenHedge"
  | "gardenLeaves"
  | "gardenLantern"
  | "towerBanner"
  | "miningRails"
  | "miningMinecart"
  | "miningTimber"
  | "miningLantern"
  | "miningOreVein"
  | "miningRubble";

export interface SceneryPlacement {
  position: Position;
  kind: SceneryKind;
}

export interface Stats {
  hp: Decimal;
  stamina: Decimal;
  attack: Decimal;
  defense: Decimal;
  spAttack: Decimal;
  spDefense: Decimal;
  speed: Decimal;
  luck: Decimal;
}

export interface OozeBelchDefinition {
  cooldownTurns: number;
  minTiles: number;
  maxTiles: number;
  radius: number;
  poolDurationActions: number;
  corrosionTurns: number;
  damagePerTurn: Decimal;
}

export interface BattleHazard {
  id: string;
  kind: "acid-ooze";
  position: Position;
  sourceTeam: Team;
  remainingActions: number;
  corrosionTurns: number;
  damagePerTurn: Decimal;
}

export type TrainingLevels = Record<StatKey, number>;

export interface Unit {
  id: string;
  definitionId: string;
  name: string;
  team: Team;
  attackRange: number;
  attackType: AttackType;
  attackName: string;
  attackPattern: AttackPattern;
  isRaidBoss: boolean;
  footprint: number;
  footprintWidth: number;
  footprintHeight: number;
  canMove: boolean;
  weaponThrowUnlocked: boolean;
  hasTrident: boolean;
  weaponAbilityId?: WeaponAbilityId;
  weaponCooldownRemaining: number;
  hasUndeadGem: boolean;
  retaliatoryParalysisChance?: number;
  forcedPasses: number;
  paralyzedTurns: number;
  corrosionTurns: number;
  corrosionDamage: Decimal;
  paralysisChance?: number;
  attackArea?: AttackArea;
  summonPool?: readonly string[];
  summonCooldown?: number;
  teleportRangeFraction?: number;
  teleportCooldown?: number;
  oozeBelch?: OozeBelchDefinition;
  oozeBelchCooldown?: number;
  summonCaged?: boolean;
  summonedById?: string;
  requiresTridentThrow: boolean;
  invulnerableWhileEnemyId?: string;
  invulnerableWhileSummons?: boolean;
  concealsBossIdentity?: boolean;
  blocksWeaponThrows: boolean;
  weakeningGuardDefinitionId?: string;
  weakeningPerGuardDefeat?: number;
  weakeningGuardCount?: number;
  weakeningStacks?: number;
  facing?: HorizontalFacing;
  position: Position;
  stats: Stats;
  hp: Decimal;
}

export interface UnitDefinition {
  id: string;
  name: string;
  hideFromBestiary?: boolean;
  attackRange?: number;
  attackType?: AttackType;
  attackName?: string;
  attackPattern?: AttackPattern;
  isRaidBoss?: boolean;
  footprint?: number;
  footprintWidth?: number;
  footprintHeight?: number;
  canMove?: boolean;
  attackArea?: AttackArea;
  summonPool?: readonly string[];
  teleportRangeFraction?: number;
  oozeBelch?: OozeBelchDefinition;
  requiresTridentThrow?: boolean;
  invulnerableWhileEnemyId?: string;
  invulnerableWhileSummons?: boolean;
  concealsBossIdentity?: boolean;
  paralysisChance?: number;
  blocksWeaponThrows?: boolean;
  weakeningGuardDefinitionId?: string;
  weakeningPerGuardDefeat?: number;
  weakeningGuardCount?: number;
  stats: Stats;
}

export interface UnitSpawn {
  instanceId: string;
  unit: UnitDefinition;
  position: Position;
}

export interface BoardDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  terrain: Terrain[][];
  walls: Position[];
  gaps?: Position[];
  deploymentExclusions?: Position[];
  deploymentTiles?: Position[];
  blueGaps?: Position[];
  gapTheme?: "deep" | "murky-water" | "ocean";
  floorTheme?: "grass" | "planks" | "leaves" | "abyssal-metal" | "sand";
  wallTheme?: "tombstone" | "stone" | "tree-stump" | "pressure-vat";
  decorations?: SceneryPlacement[];
}

export type CombatAction =
  | { type: "move"; destination: Position }
  | { type: "attack"; targetId: string }
  | { type: "weaponThrow"; targetId: string }
  | { type: "weaponSkill"; targetId: string }
  | { type: "summonBeast" }
  | { type: "oozeBelch" }
  | { type: "teleport"; destination: Position }
  | { type: "wait" };

export interface LevelDefinition {
  number: number;
  name: string;
  description: string;
  reward: string;
  board: BoardDefinition;
  playerPositions: Partial<Record<PlayerId, Position>>;
  enemies: UnitSpawn[];
  randomSpawnPositions?: Position[];
  randomSpawnInstanceIds?: string[];
}

export interface BattleState {
  level: LevelDefinition;
  units: Unit[];
  status: BattleStatus;
  activeUnitId: string | null;
  deploymentUnitId: string | null;
  actionCount: number;
  log: string[];
  attackLog: string[];
  readyAt: Record<string, Decimal>;
  lastAttack: {
    attackName: string;
    attackType: AttackType;
    actionKind: "basic" | "weapon" | "skill";
    visual: AttackVisualId;
    from: Position;
    to: Position;
  } | null;
  hazards: BattleHazard[];
}

export const STAT_KEYS: StatKey[] = [
  "hp",
  "stamina",
  "attack",
  "defense",
  "spAttack",
  "spDefense",
  "speed",
  "luck",
];

export const STAT_META: Record<
  StatKey,
  { label: string; shortLabel: string; description: string }
> = {
  hp: {
    label: "HP",
    shortLabel: "HP",
    description: "The amount of horrible stuff your body can contain before it becomes floor decoration.",
  },
  stamina: {
    label: "Stamina",
    shortLabel: "STA",
    description: "How long you can walk, stab, and touch cursed furniture before your legs submit a formal resignation.",
  },
  attack: {
    label: "Attack",
    shortLabel: "ATK",
    description: "Makes swords, fists, and approved non-sparkly violence produce larger red numbers. Civilization!",
  },
  defense: {
    label: "Defense",
    shortLabel: "DEF",
    description: "Convince clubs and teeth to remove slightly less of you per visit. Does not prevent the visit.",
  },
  spAttack: {
    label: "Sp. Attack",
    shortLabel: "SPA",
    description: "Makes Acid Shot, magic, and weaponized disgustingness violate the enemy more efficiently.",
  },
  spDefense: {
    label: "Sp. Defense",
    shortLabel: "SPD",
    description: "Protects the parts of your body that lasers, acid, curses, and REALLY weird purple stuff prefer.",
  },
  speed: {
    label: "Speed",
    shortLabel: "SPE",
    description: "Act sooner. This advanced tactic lets you hurt enemies before they hurt you. Historians call it 'being faster.'",
  },
  luck: {
    label: "Luck",
    shortLabel: "LCK",
    description: "Find more Gold, find more treasure, and place your feet on fewer of the dungeon's upward-facing opinions.",
  },
};

export const EMPTY_TRAINING: TrainingLevels = {
  hp: 0,
  stamina: 0,
  attack: 0,
  defense: 0,
  spAttack: 0,
  spDefense: 0,
  speed: 0,
  luck: 0,
};

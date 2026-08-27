import type Decimal from "break_eternity.js";

export const HOME_ZONE_BONUS = 1.25;

export type Team = "player" | "enemy";
export type Terrain = "player" | "neutral" | "enemy";
export type BattleStatus = "deploying" | "fighting" | "won" | "lost";
export const PLAYER_IDS = ["knight", "worm", "miner"] as const;
export type PlayerId = (typeof PLAYER_IDS)[number];
export const ADVENTURE_STRATEGIES = ["none", "quest", "together", "split", "ring"] as const;
export type AdventureStrategy = (typeof ADVENTURE_STRATEGIES)[number];
export const ADVENTURE_DUNGEON_IDS = ["starting", "great-tower"] as const;
export type AdventureDungeonId = (typeof ADVENTURE_DUNGEON_IDS)[number];
export const PORTAL_TYPES = ["water", "forge"] as const;
export type PortalType = (typeof PORTAL_TYPES)[number];
export const ADVENTURE_AUTO_PAUSE_ROOMS = [
  "blacksmith",
  "potionmaster",
  "oddityBrewer",
  "cartographer",
  "angler",
  "towerExterior",
] as const;
export type AdventureAutoPauseRoom = (typeof ADVENTURE_AUTO_PAUSE_ROOMS)[number];
export type AttackType = "physical" | "special";
export type AttackPattern = "orthogonal" | "eight-way" | "any";
export type AttackArea = "single" | "front-three";
export const WEAPON_ABILITY_IDS = [
  "sweep",
  "heavy-slam",
  "burst-staff",
  "rapid-staff",
  "trident-throw",
] as const;
export type WeaponAbilityId = (typeof WEAPON_ABILITY_IDS)[number];
export const ATTACK_VISUAL_IDS = [
  "knight-slash",
  "worm-acid",
  "miner-pick",
  "sword-sweep",
  "heavy-slam",
  "burst-orb",
  "rapid-bolt",
  "trident-throw",
  "fire",
  "abyssal",
  "magic",
  "physical",
] as const;
export type AttackVisualId = (typeof ATTACK_VISUAL_IDS)[number];
export type HorizontalFacing = "left" | "right";
export const STAT_KEYS = [
  "hp",
  "stamina",
  "attack",
  "defense",
  "spAttack",
  "spDefense",
  "speed",
  "luck",
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export interface Position {
  x: number;
  y: number;
}

/** Visual-only scenery. These never affect collision, targeting, or rewards. */
export const SCENERY_KINDS = [
  "graveCracked",
  "graveBonePile",
  "graveCandles",
  "graveFence",
  "graveRoyalBanner",
  "goblinPatchedPlanks",
  "goblinBanner",
  "goblinTarget",
  "goblinRopeCoil",
  "drownedKelp",
  "drownedCoral",
  "drownedMast",
  "drownedBarnacles",
  "drownedOozeSlick",
  "drownedPylon",
  "rustmirePipeStraight",
  "rustmirePipeCorner",
  "rustmirePipeJunction",
  "rustmireValve",
  "rustmireGrate",
  "rustmirePuddle",
  "rustmireLamp",
  "beachPalm",
  "beachShells",
  "beachDriftwood",
  "earthRopeAnchor",
  "earthSewerGrate",
  "earthLeakingPipe",
  "earthRatNest",
  "earthAntMound",
  "earthEggCluster",
  "earthResinPatch",
  "earthBurialUrn",
  "earthFossil",
  "earthPotteryShards",
  "earthLavaVent",
  "earthBasaltSpire",
  "earthEmberPile",
  "cartographerScrolls",
  "cartographerCompass",
  "cartographerTripod",
  "anglerBaitBarrel",
  "anglerFishRack",
  "potionHerbs",
  "potionBottleCrate",
  "gardenHedge",
  "gardenLeaves",
  "gardenLantern",
  "towerBanner",
  "miningRails",
  "miningMinecart",
  "miningTimber",
  "miningLantern",
  "miningOreVein",
  "miningRubble",
] as const;
export type SceneryKind = (typeof SCENERY_KINDS)[number];

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

/** Preserve a definition's literal identity while exposing its broad shape. */
export function defineUnit<const Id extends string>(
  definition: UnitDefinition & { id: Id },
): UnitDefinition & { readonly id: Id } {
  return definition;
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

export function defineBoard<const Id extends string>(
  definition: BoardDefinition & { id: Id },
): BoardDefinition & { readonly id: Id } {
  return definition;
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

export function defineLevel<const Number extends number>(
  definition: LevelDefinition & { number: Number },
): LevelDefinition & { readonly number: Number } {
  return definition;
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

export const STAT_META: Record<
  StatKey,
  { label: string; shortLabel: string; description: string }
> = {
  hp: {
    label: "HP",
    shortLabel: "HP",
    description: "How much damage a unit can take before being defeated.",
  },
  stamina: {
    label: "Stamina",
    shortLabel: "STA",
    description: "Spent by Adventure and Mining actions. The member leaves the activity at 0.",
  },
  attack: {
    label: "Attack",
    shortLabel: "ATK",
    description: "Increases damage dealt by physical attacks.",
  },
  defense: {
    label: "Defense",
    shortLabel: "DEF",
    description: "Reduces damage received from physical attacks.",
  },
  spAttack: {
    label: "Sp. Attack",
    shortLabel: "SPA",
    description: "Increases damage dealt by special attacks.",
  },
  spDefense: {
    label: "Sp. Defense",
    shortLabel: "SPD",
    description: "Reduces damage received from special attacks.",
  },
  speed: {
    label: "Speed",
    shortLabel: "SPE",
    description: "Reduces the time until the unit's next turn.",
  },
  luck: {
    label: "Luck",
    shortLabel: "LCK",
    description: "Improves applicable random rewards and outcomes.",
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

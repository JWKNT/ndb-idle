import Decimal from "break_eternity.js";
import type { QuestId } from "@/content/quests";
import type { ForgeRecipeId } from "@/content/forge-recipes";
import type { GearItem, GearSlot } from "@/game/gear";
import type { FishCounts, MaterialId } from "@/game/items";
import type { PotionId } from "@/game/potions";
import type {
  AdventureStrategy,
  AttackVisualId,
  HorizontalFacing,
  PlayerId,
  PortalType,
  Position,
  SceneryKind,
  StatKey,
  WeaponAbilityId,
} from "@/game/types";

export type RandomSource = () => number;

export type AdventureTileKind =
  | "floor"
  | "wall"
  | "gold"
  | "treasureChest"
  | "lostItemChest"
  | "rodKeeper"
  | "tridentChest"
  | "openedChest"
  | "cage"
  | "trap"
  | "regen"
  | "portal"
  | "waterPortal"
  | "forgePortal"
  | "forgeGate"
  | "forgeBlueprintChest"
  | "offering"
  | "woodenDoor"
  | "shopkeeperCage"
  | "shopkeeper"
  | "blacksmith"
  | "blacksmithForge"
  | "blacksmithAnvil"
  | "blacksmithWorkbench"
  | "blacksmithToolRack"
  | "blacksmithSupplies"
  | "miner"
  | "caveRock"
  | "caveGem"
  | "hammerChest"
  | "clayGate"
  | "clayBoulder"
  | "lotteryWheel"
  | "lotteryGate"
  | "dicePedestal"
  | "diceDisplay"
  | "diceGate"
  | "potionmaster"
  | "oddityBrewer"
  | "potionCauldron"
  | "potionShelf"
  | "potionTable"
  | "cartographer"
  | "mapTable"
  | "angler"
  | "anglerNet"
  | "gardenTree"
  | "gardenFountain"
  | "gardenStatue"
  | "gardenWater"
  | "gardenFlowers"
  | "gardenBench"
  | "towerWall"
  | "towerDoor"
  | "enemy"
  | "exit";

export type ExitDirection = "north" | "east" | "south" | "west";

export type AdventureEnemyKind =
  | "rat"
  | "ant"
  | "clay-golem"
  | "goblin"
  | "goblin-archer"
  | "spider"
  | "octopus"
  | "merman"
  | "skeleton"
  | "skeleton-giraffe"
  | "skeleton-hippo"
  | "skeleton-rhino"
  | "skeleton-brachiosaurus"
  | "squid-knight"
  | "fire-ant"
  | "alligator"
  | "dragonfly"
  | "bee"
  | "mummy"
  | "fire-alligator"
  | "mimic"
  | "forgeling"
  | "chain-forgeling"
  | "bellows-forgeling"
  | "hammer-forgeling"
  | "dire-rat"
  | "soldier-ant"
  | "sewer-toad";

export type DungeonTheme = "earth" | "water" | "forge";

export interface AdventureTile {
  kind: AdventureTileKind;
  revealed?: boolean;
  exitDirection?: ExitDirection;
  /** Identifies the room whose encounter owns a reciprocal doorway gate. */
  gateRoomKey?: string;
  gearSlot?: GearSlot;
  potionId?: PotionId;
  mimicDisguise?: boolean;
  enemyId?: string;
  enemyKind?: AdventureEnemyKind;
  enemyHp?: Decimal;
  underlyingKind?: "floor" | "trap" | "regen";
  underlyingTrapRevealed?: boolean;
  underlyingTrapStyle?: "spikes" | "fire-beam";
  underlyingTrapGroupId?: string;
  underlyingTrapGroupIds?: string[];
  underlyingTrapBeamDirection?: "horizontal" | "vertical" | "cross";
  underlyingRegenPartX?: number;
  underlyingRegenPartY?: number;
  regenPartX?: number;
  regenPartY?: number;
  portalPartX?: number;
  portalPartY?: number;
  offeringStat?: StatKey;
  doorOpen?: boolean;
  bossBarrier?: boolean;
  doorDirection?: ExitDirection;
  doorPart?: number;
  enemyMustPass?: boolean;
  enemyParalyzedTurns?: number;
  decoration?: "waterThrone" | "cobweb" | "portalRune" | "shopRug" | "shopShelf" | "springReeds" | SceneryKind;
  floorVariant?: "sunlight" | "tower-grass" | "tower-path" | "tower-magma";
  goldAmount?: Decimal;
  lotteryPrize?: boolean;
  lotteryPartX?: number;
  lotteryPartY?: number;
  trapStyle?: "spikes" | "fire-beam";
  trapGroupId?: string;
  trapGroupIds?: string[];
  trapBeamDirection?: "horizontal" | "vertical" | "cross";
  wallVariant?: "clay-brick" | "volcanic" | "forge";
  enemyPart?: 0 | 1 | 2 | 3;
  enemyFacing?: ExitDirection;
  spriteFacing?: HorizontalFacing;
  boulderTurnsRemaining?: number;
  dicePartX?: number;
  dicePartY?: number;
  diceIndex?: 0 | 1;
  towerPartX?: number;
  towerPartY?: number;
}

export interface AdventureExit {
  direction: ExitDirection;
  position: Position;
}

export interface DungeonRoom {
  key: string;
  number: number;
  position: Position;
  width: number;
  height: number;
  tiles: AdventureTile[][];
  exits: AdventureExit[];
  ring: number;
  kind:
    | "normal"
    | "treasure"
    | "regen"
    | "rescue"
    | "portal"
    | "waterPortal"
    | "lostItem"
    | "offering"
    | "mermanThrone"
    | "shopkeeper"
    | "blacksmith"
    | "miner"
    | "hammerVault"
    | "lottery"
    | "dice"
    | "potionmaster"
    | "oddityBrewer"
    | "cartographer"
    | "angler"
    | "towerExterior"
    | "forgePortal"
    | "forgeNormal"
    | "forgeArena"
    | "forgeTreasure"
    | "forgeBlueprint";
  mapHidden?: boolean;
  regenUsedBy: string[];
  offeringDoorOpened?: boolean;
  offeringBossDirection?: ExitDirection;
  lotterySpun?: boolean;
  lotteryResolved?: boolean;
  lotteryOutcome?: "gold" | "enemies";
  lotteryColor?: LotteryColor;
  diceRolled?: boolean;
  diceRolling?: boolean;
  diceValue?: number;
  diceValues?: [number, number];
  hammerChestPosition?: Position;
  hazardTurn?: number;
  forgeArenaStarted?: boolean;
  forgeArenaResolved?: boolean;
  forgeArenaOrdinal?: number;
  /** The only doorway left open while an unstarted arena gathers the party. */
  forgeArenaEntranceDirection?: ExitDirection;
  forgeBlueprintDirection?: ExitDirection;
  forgeRecipeId?: ForgeRecipeId;
}

export type LotteryColor = "red" | "cyan" | "orange" | "purple" | "green" | "pink" | "blue" | "yellow";

export interface AdventureState {
  /** Stable identity used to pre-seed the expedition's effectively unbounded room graph. */
  dungeonSeed?: number;
  playerId: PlayerId;
  playerName: string;
  currentRoomKey: string;
  previousRoomKey: string | null;
  rooms: Record<string, DungeonRoom>;
  playerPosition: Position;
  playerFacing?: HorizontalFacing;
  steps: number;
  staminaActionProgress: number;
  log: string[];
  activeActorId: string | null;
  readyAt: Record<string, Decimal>;
  questTarget: AdventureQuestTarget | null;
  dungeonTheme?: DungeonTheme;
  lostItemRoomNumber?: number | null;
  offeringRoomNumber?: number | null;
  waterPortalEnabled?: boolean;
  forgePortalEnabled?: boolean;
  shopkeeperRoomNumber?: number | null;
  blacksmithRoomNumber?: number | null;
  potionmasterRoomNumber?: number | null;
  oddityBrewerRoomNumber?: number | null;
  cartographerRoomNumber?: number | null;
  anglerRoomNumber?: number | null;
  cartographerSurveyTargets?: Position[];
  cartographerSurveyVisited?: Position[];
  cartographerSurveyPaths?: Position[][];
  cartographerQuestActive?: boolean;
  chalkRevealedPositions?: Position[];
  /** Persisted, real room topology revealed by Mapmaker's Chalk. */
  chalkMappedExits?: Record<string, ExitDirection[]>;
  hammerQuestPurchased?: boolean;
  hammerRecovered?: boolean;
  shrineSolved?: boolean;
  offeringStats?: StatKey[];
  playerMustPass?: boolean;
  weaponCooldownRemaining?: number;
  lastProjectile?: {
    from: Position;
    to: Position;
    kind?: "laser" | "trident" | "mummy" | "fire" | "magic" | "acid" | "burst" | "rapid";
  } | null;
  lastImpact?: Position[];
  lastAttackVisual?: AttackVisualId | null;
  lastAttackOrigin?: Position | null;
  completedBattleNumbers?: number[];
  forgeArenasCleared?: number;
  forgeBlueprintTarget?: Position | null;
  /** The first Forge expedition culminates in the Blueprint reliquary. */
  forgeBlueprintObjectiveEnabled?: boolean;
  towerReturnRoomKey?: string | null;
  towerReturnExitDirection?: ExitDirection | null;
}

export interface AdventureQuestTarget {
  questId: QuestId | "retrieve-hammer";
  position: Position;
  path: Position[];
}

export interface AdventureMoveResult {
  state: AdventureState;
  hp: Decimal;
  stamina: Decimal;
  goldGained: Decimal;
  gearFound: GearItem | null;
  potionFound?: PotionId | null;
  materialGained?: MaterialId | null;
  defeatedEnemyId?: string;
  died: boolean;
  exhausted: boolean;
  completedQuestId?: QuestId;
  enteredPortalType?: PortalType;
  returnedPortalType?: PortalType;
  completedTridentTrial?: boolean;
  unlockedShopkeeper?: boolean;
  unlockedBlacksmith?: boolean;
  recoveredHammer?: boolean;
  returnedHammer?: boolean;
  exploredNewRoom?: boolean;
  diceCurseRoll?: number;
  discoveredTowerDoor?: boolean;
  completedCartographerSurvey?: boolean;
  unlockedGreatTower?: boolean;
  recoveredForgeBlueprints?: boolean;
  forgeArenaStarted?: boolean;
  forgeArenaCleared?: boolean;
  error?: string;
}

export interface AdventureEnemyTurnResult {
  state: AdventureState;
  hp: Decimal;
  stamina: Decimal;
  died: boolean;
  exhausted: boolean;
}

export interface AdventureExplorerPosition {
  roomKey: string;
  position: Position;
}

export interface WaterAdventureOptions {
  visitNumber?: number;
  fishingRodRecovered?: boolean;
  shrineSolved?: boolean;
  tridentTrialCompleted?: boolean;
  fishInventory?: Partial<FishCounts>;
  anglerRoomEnabled?: boolean;
}

export interface EarthAdventureOptions {
  blacksmithRoomEnabled?: boolean;
  hammerQuestPurchased?: boolean;
  hammerRecovered?: boolean;
  potionmasterRoomEnabled?: boolean;
  oddityBrewerRoomEnabled?: boolean;
  forgePortalEnabled?: boolean;
  cartographerRoomEnabled?: boolean;
}

export interface AdventureStrategyContext {
  prioritizeQuest?: boolean;
  routeRoomKey?: string | null;
  followRoomKey?: string | null;
  avoidRoomKeys?: string[];
  occupiedPositions?: Position[];
  preferredDirection?: ExitDirection | null;
  enterPortalTypes?: PortalType[];
  weaponThrowUnlocked?: boolean;
  hasTrident?: boolean;
  weaponAbilityId?: WeaponAbilityId;
  avoidManualInteractions?: boolean;
  targetRing?: number;
  ignoreGold?: boolean;
  requireFullPartyForForgePortal?: boolean;
  /** The current special-dungeon objective is complete; route home. */
  returnToDungeonPortal?: boolean;
}

export type { AdventureStrategy, PlayerId, PortalType, Position, StatKey };

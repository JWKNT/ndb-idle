import Decimal from "break_eternity.js";
import { getLevel, hasLevel, levels } from "../content/levels";
import { getEnemy } from "../content/enemies";
import { getPlayer } from "../content/players";
import { getQuest, quests, type QuestId } from "../content/quests";
import { playerStatsWithTraining } from "./combat";
import {
  EMPTY_EQUIPMENT,
  GEAR_SLOTS,
  createTridentGear,
  createUndeadGemGear,
  createShamanRingGear,
  createSuctionCupsGear,
  createRingGear,
  isMilestoneGear,
  isGearSlot,
  isWeaponAbilityId,
  type Equipment,
  type GearItem,
  type GearSlot,
} from "./gear";
import { formatAmount, formatWholeAmount } from "./numbers";
import { MAX_MINING_ROOM } from "./mining/generation";
import {
  FISH_META,
  FISH_STATS,
  MATERIAL_IDS,
  MATERIAL_META,
  emptyFishCounts,
  emptyMaterialCounts,
  type FishCounts,
  type MaterialCounts,
  type MaterialId,
} from "./items";
import {
  POTION_IDS,
  POTION_META,
  STANDARD_LEVEL_ONE_POTION_IDS,
  emptyPotionCounts,
  type ActiveMysteryPotionEffect,
  type ActivePotionEffects,
  type PotionCounts,
} from "./potions";
import {
  EMPTY_TRAINING,
  type AdventureAutoPauseRoom,
  type AdventureStrategy,
  type PlayerId,
  type PortalType,
  type Stats,
  type StatKey,
  type TrainingLevels,
} from "./types";
import {
  ESCAPE_ROPE_LEVELS,
  emptyEscapeRopeCounts,
  type EscapeRopeCounts,
} from "./escape-ropes";
import {
  addInventoryStack,
  canAddUniqueInventoryItem,
  ensureInventoryCapacity,
  fishStackId,
  inventorySlotCapacity,
  inventorySlotUpgradeCost,
  inventoryStackCapacity,
  inventoryStackUpgradeCost,
  inventoryUsedSlots,
  grantInventoryStack,
  materialStackId,
  purchaseInventorySlots,
  purchaseInventoryStackSize,
  sanitizeInventoryStackUpgrades,
  type InventoryStackId,
} from "./inventory-capacity";
import {
  addPotion,
  activePotionRemainingMs,
  adventureSpeedMultiplier,
  consumePotion,
  mysteryPotionDodgeChance,
  purchasePotion,
} from "./progression/potion-effects";
import {
  addGold,
  addMaterial,
  consumeEscapeRope,
  feedFish,
  fishBonusCap,
  purchaseEscapeRope,
  sellFish,
  sellMaterial,
  settleAdventureGold,
} from "./progression/economy";
import { fishingTabUnlocked, startFishing, stopFishing } from "./progression/fishing";
import { startTraining, trainingCost } from "./progression/training";
import {
  SAVE_SLOTS,
  type FishingAssignment,
  type PartyMemberProgress,
  type ProgressionState,
  type SaveSlot,
  type SaveSlotSummary,
} from "./progression/types";

export const UNDEAD_GEM_COST = 250;

export { SAVE_SLOTS } from "./progression/types";
export type {
  FishingAssignment,
  PartyMemberProgress,
  ProgressionState,
  SaveSlot,
  SaveSlotSummary,
} from "./progression/types";
export {
  addGold,
  addMaterial,
  consumeEscapeRope,
  feedFish,
  fishBonusCap,
  purchaseEscapeRope,
  sellFish,
  sellMaterial,
  settleAdventureGold,
} from "./progression/economy";
export { fishingTabUnlocked, startFishing, stopFishing } from "./progression/fishing";
export {
  addPotion,
  activePotionRemainingMs,
  adventureSpeedMultiplier,
  consumePotion,
  MYSTERY_POTION_DODGE_CHANCE,
  mysteryPotionDodgeChance,
  purchasePotion,
} from "./progression/potion-effects";
export { startTraining, trainingCost } from "./progression/training";
export {
  BASE_INVENTORY_SLOTS,
  BASE_STACK_SIZE,
  INVENTORY_SLOTS_PER_UPGRADE,
  STACK_SIZE_PER_UPGRADE,
  escapeRopeStackId,
  fishStackId,
  inventorySlotCapacity,
  inventorySlotUpgradeCost,
  inventoryStackCapacity,
  inventoryStackUpgradeCost,
  inventoryUsedSlots,
  materialStackId,
  potionStackId,
  purchaseInventorySlots,
  purchaseInventoryStackSize,
  type InventoryStackId,
} from "./inventory-capacity";
export {
  recordMiningRoomReached,
  setMiningAutoMode,
  setMiningMember,
  setRestartMiningOnFullHp,
} from "./progression/mining";
export {
  CRAFTING_TABLE_COST,
  PICKAXE_COST,
  beginHammerQuestAttempt,
  discoverBlacksmith,
  failHammerQuestAttempt,
  purchaseBlacksmithHealingPotion,
  purchasePickaxe,
  purchaseCraftingTable,
  purchaseHammerQuest,
  recoverForgeBlueprints,
  recoverBlacksmithHammer,
  returnBlacksmithHammer,
  deliverForgeBlueprints,
} from "./progression/blacksmith";
export {
  POTIONMASTER_MAGIC_BAIT_REWARD,
  POTIONMASTER_MATERIAL_COST,
  POTIONMASTER_POTION_REWARD_COUNT,
  completePotionmasterQuest,
  potionmasterMaterialCost,
  potionmasterRequiredMaterials,
  potionmasterRequirementsMet,
} from "./progression/potionmaster";
export {
  ODDITY_BREWER_MATERIAL_COST,
  ODDITY_BREWER_POTION_REWARD,
  completeOddityBrewerExchange,
  oddityBrewerRequiredMaterials,
  oddityBrewerRequirementsMet,
} from "./progression/oddity-brewer";
export {
  ANGLER_MATERIAL_COST,
  anglerMaterialsReady,
  completeAnglerRequest,
  deliverAnglerMaterials,
  setFavoredFishStat,
} from "./progression/angler";
import { rollFishFamily } from "./progression/angler";
export {
  CARTOGRAPHER_CHALK_REWARD,
  completeCartographerQuest,
  consumeMapmakerChalk,
} from "./progression/cartographer";

const LEGACY_SAVE_KEY = "idle-game-prototype-save-v2";
const SAVE_SLOT_KEY_PREFIX = "idle-game-prototype-save-v2-slot-";
const SAVE_SLOT_MIGRATION_KEY = "idle-game-prototype-save-slots-migrated-v1";
const SAVE_VERSION = 48;
const HEALING_RATE_PER_SECOND = 0.08;
const STAMINA_RECOVERY_RATE_PER_SECOND = 0.2;
const PLAYER_ORDER: PlayerId[] = ["knight", "worm", "miner"];

interface StoredMemberProgress {
  hp: string;
  stamina: string;
  staminaActions: number;
  training: TrainingLevels;
  fishBonuses: TrainingLevels;
}

interface StoredProgression {
  version: number;
  savedAt?: number;
  timePlayedMs?: number;
  gold: string;
  party: Partial<Record<PlayerId, StoredMemberProgress>>;
  inventory: GearItem[];
  equipment: Partial<Record<PlayerId, Equipment>> | Equipment;
  inventorySlotUpgrades?: number;
  inventoryStackUpgrades?: number | Partial<Record<InventoryStackId, number>>;
  highestUnlockedLevel: number;
  selectedLevel: number;
  completedRaids: number[];
  victories: number;
  purchasedQuestIds: QuestId[];
  activeQuestId: QuestId | null;
  completedQuestIds: QuestId[];
  battleAutoMode: boolean;
  adventureAutoMode: boolean;
  adventureStrategy: AdventureStrategy;
  targetAdventureRing: number;
  adventureIgnoreGold?: boolean;
  selectedAdventureMembers: PlayerId[];
  restartAdventureOnFullHp: boolean;
  materials: MaterialCounts;
  fish: FishCounts;
  potions: PotionCounts;
  activePotions: ActivePotionEffects;
  activeMysteryPotions?: ActiveMysteryPotionEffect[];
  fishingRod: boolean;
  fishingAssignment: FishingAssignment | null;
  fishingLog?: string[];
  cartographerQuestCompleted?: boolean;
  cartographerDiscovered?: boolean;
  anglerMaterialsDelivered?: boolean;
  anglerDiscovered?: boolean;
  anglerRequestedFish?: StatKey | null;
  tackleBoxOwned?: boolean;
  favoredFishStat?: StatKey | null;
  autoEnterPortalTypes: PortalType[];
  autoPauseAdventureRooms?: AdventureAutoPauseRoom[];
  waterDungeonVisits: number;
  waterShrineOfferings: Partial<Record<StatKey, StatKey>>;
  waterShrineSolved: boolean;
  tridentTrialCompleted: boolean;
  weaponThrowUnlocked: boolean;
  highestAdventureRingVisited: number;
  escapeRopes: EscapeRopeCounts;
  adventureUnlocked?: boolean;
  partyTrainingUnlocked?: boolean;
  shopUnlocked?: boolean;
  defeatedEnemyIds?: string[];
  blacksmithUnlocked?: boolean;
  blacksmithDiscovered?: boolean;
  hammerQuestPurchased?: boolean;
  hammerQuestAttemptActive?: boolean;
  hammerQuestFailed?: boolean;
  hammerRecovered?: boolean;
  hammerReturned?: boolean;
  healingPotions?: number;
  craftingUnlocked?: boolean;
  pickaxeOwned?: boolean;
  miningUnlocked?: boolean;
  miningAutoMode?: boolean;
  selectedMiningMemberId?: PlayerId;
  restartMiningOnFullHp?: boolean;
  highestMiningRoomReached?: number;
  potionmasterQuestCompleted?: boolean;
  potionmasterDiscovered?: boolean;
  oddityBrewerCompleted?: boolean;
  oddityBrewerDiscovered?: boolean;
  towerDoorDiscovered?: boolean;
  towerQuestAvailable?: boolean;
  forgeDungeonVisited?: boolean;
  forgeBlueprintsRecovered?: boolean;
  forgeBlueprintsDelivered?: boolean;
  towerKeyOwned?: boolean;
  greatTowerUnlocked?: boolean;
  seenShopUnlocks?: string[];
}

interface LegacyStoredProgression extends Partial<StoredProgression> {
  knightHp?: string;
  knightStamina?: string;
  knightStaminaActions?: number;
  training?: TrainingLevels;
}

export function defaultProgression(): ProgressionState {
  return {
    gold: new Decimal(0),
    timePlayedMs: 0,
    party: { knight: createMemberProgress("knight") },
    inventory: [],
    equipment: { knight: { ...EMPTY_EQUIPMENT } },
    inventorySlotUpgrades: 0,
    inventoryStackUpgrades: 0,
    highestUnlockedLevel: 1,
    selectedLevel: 1,
    completedRaids: [],
    victories: 0,
    purchasedQuestIds: [],
    activeQuestId: null,
    completedQuestIds: [],
    battleAutoMode: false,
    adventureAutoMode: false,
    adventureStrategy: "none",
    targetAdventureRing: 3,
    adventureIgnoreGold: false,
    selectedAdventureMembers: ["knight"],
    restartAdventureOnFullHp: false,
    materials: emptyMaterialCounts(),
    fish: emptyFishCounts(),
    potions: emptyPotionCounts(),
    activePotions: {},
    activeMysteryPotions: [],
    fishingRod: false,
    fishingAssignment: null,
    fishingLog: [],
    cartographerQuestCompleted: false,
    cartographerDiscovered: false,
    anglerMaterialsDelivered: false,
    anglerDiscovered: false,
    anglerRequestedFish: null,
    tackleBoxOwned: false,
    favoredFishStat: null,
    autoEnterPortalTypes: [],
    autoPauseAdventureRooms: ["blacksmith", "potionmaster", "oddityBrewer", "cartographer", "angler", "towerExterior"],
    waterDungeonVisits: 0,
    waterShrineOfferings: {},
    waterShrineSolved: false,
    tridentTrialCompleted: false,
    weaponThrowUnlocked: false,
    highestAdventureRingVisited: 0,
    escapeRopes: emptyEscapeRopeCounts(),
    adventureUnlocked: false,
    partyTrainingUnlocked: false,
    shopUnlocked: false,
    defeatedEnemyIds: [],
    blacksmithUnlocked: false,
    blacksmithDiscovered: false,
    hammerQuestPurchased: false,
    hammerQuestAttemptActive: false,
    hammerQuestFailed: false,
    hammerRecovered: false,
    hammerReturned: false,
    healingPotions: 0,
    pickaxeOwned: false,
    miningUnlocked: false,
    miningAutoMode: true,
    selectedMiningMemberId: "miner",
    restartMiningOnFullHp: false,
    highestMiningRoomReached: 0,
    potionmasterQuestCompleted: false,
    potionmasterDiscovered: false,
    oddityBrewerCompleted: false,
    oddityBrewerDiscovered: false,
    towerDoorDiscovered: false,
    towerQuestAvailable: false,
    forgeDungeonVisited: false,
    forgeBlueprintsRecovered: false,
    forgeBlueprintsDelivered: false,
    towerKeyOwned: false,
    greatTowerUnlocked: false,
    craftingUnlocked: false,
    seenShopUnlocks: [],
  };
}

export function loadProgression(slot: SaveSlot = 1): ProgressionState {
  try {
    migrateLegacySave();
    const raw = localStorage.getItem(saveSlotKey(slot));
    if (!raw) return defaultProgression();
    const parsed = JSON.parse(raw) as LegacyStoredProgression;
    const stored = migrateStoredProgression(parsed);
    if (stored !== parsed) localStorage.setItem(saveSlotKey(slot), JSON.stringify(stored));
    const highest = Math.min(levels.length, Math.max(1, Math.floor(stored.highestUnlockedLevel ?? 1)));
    const inventory = sanitizeInventory(stored.inventory);
    const completedQuestIds = sanitizeQuestIds(stored.completedQuestIds);
    const equipment = sanitizePartyEquipment(stored.equipment, inventory, completedQuestIds);
    const now = Date.now();
    const activePotions = sanitizeActivePotions(stored.activePotions, now);
    const activeMysteryPotions = sanitizeActiveMysteryPotions(stored.activeMysteryPotions, now);
    const party = sanitizeParty(
      stored,
      inventory,
      equipment,
      completedQuestIds,
      activePotions,
      activeMysteryPotions,
      now,
    );
    const completedRaids = sanitizeCompletedRaids(stored.completedRaids, highest);
    const materials = sanitizeMaterialCounts(stored.materials);
    const defeatedEnemyIds = sanitizeDefeatedEnemyIds(
      stored.defeatedEnemyIds,
      completedRaids,
      completedQuestIds,
      materials,
      Boolean(stored.tridentTrialCompleted),
    );
    const pickaxeOwned = Boolean(stored.pickaxeOwned) || Boolean(stored.craftingUnlocked);
    const legacySave = validLevel(stored.version) < SAVE_VERSION;
    const shopUnlocked = (
      typeof stored.shopUnlocked === "boolean"
        ? stored.shopUnlocked
        : legacySave && (
            completedRaids.includes(3)
            || completedQuestIds.length > 0
            || Boolean(stored.activeQuestId)
          )
    ) || completedQuestIds.includes("rescue-shopkeeper");
    const pendingShopkeeperQuest = completedRaids.includes(3)
      && !shopUnlocked
      && !completedQuestIds.includes("rescue-shopkeeper");
    const savedActiveQuestId = sanitizeActiveQuest(stored.activeQuestId, completedQuestIds, completedRaids);
    const activeQuestId = savedActiveQuestId ?? (pendingShopkeeperQuest ? "rescue-shopkeeper" : null);
    const sanitizedPurchasedQuestIds = sanitizePurchasedQuestIds(
      stored.purchasedQuestIds,
      completedQuestIds,
      activeQuestId,
    );
    const purchasedWithShopkeeperQuest = pendingShopkeeperQuest
      && !sanitizedPurchasedQuestIds.includes("rescue-shopkeeper")
        ? [...sanitizedPurchasedQuestIds, "rescue-shopkeeper" as const]
        : sanitizedPurchasedQuestIds;
    const purchasedQuestIds = pickaxeOwned
      && !completedQuestIds.includes("find-miner")
      && !purchasedWithShopkeeperQuest.includes("find-miner")
        ? [...purchasedWithShopkeeperQuest, "find-miner" as const]
        : purchasedWithShopkeeperQuest;
    const savedAdventureStrategy = sanitizeAdventureStrategy(stored.adventureStrategy);
    const selectedAdventureMembers = sanitizeAdventureMembers(stored.selectedAdventureMembers, party);
    const partyStrategiesUnlocked = selectedAdventureMembers.length > 1;
    const adventureStrategy = (
      savedAdventureStrategy === "none"
      ||
      (savedAdventureStrategy === "quest" && activeQuestId)
      || ((savedAdventureStrategy === "together" || savedAdventureStrategy === "split") && partyStrategiesUnlocked)
      || (savedAdventureStrategy === "ring" && completedRaids.includes(8))
    )
      ? savedAdventureStrategy
      : "none";
    const adventureUnlocked = typeof stored.adventureUnlocked === "boolean"
      ? stored.adventureUnlocked
      : completedRaids.includes(1);
    const partyTrainingUnlocked = typeof stored.partyTrainingUnlocked === "boolean"
      ? stored.partyTrainingUnlocked
      : legacySave && (
          completedQuestIds.length > 0
          || Boolean(party.worm)
          || validLevel(stored.highestAdventureRingVisited) > 0
          || Object.values(party).some((member) => member && Object.values(member.training).some((level) => level > 0))
        );
    const hammerReturned = Boolean(stored.hammerReturned);
    const interruptedHammerAttempt = Boolean(stored.hammerQuestAttemptActive) && !hammerReturned;
    const blacksmithDiscovered = typeof stored.blacksmithDiscovered === "boolean"
      ? stored.blacksmithDiscovered
      : Boolean(stored.blacksmithUnlocked);
    const potionmasterDiscovered = typeof stored.potionmasterDiscovered === "boolean"
      ? stored.potionmasterDiscovered
      : Boolean(stored.potionmasterQuestCompleted);
    const towerDoorDiscovered = Boolean(stored.towerDoorDiscovered);
    const forgeDungeonVisited = Boolean(
      stored.forgeDungeonVisited
      || stored.forgeBlueprintsRecovered
      || stored.forgeBlueprintsDelivered
      || stored.craftingUnlocked
    );
    return ensureInventoryCapacity({
      gold: new Decimal(stored.gold ?? 0).floor(),
      timePlayedMs: sanitizeTimePlayed(stored.timePlayedMs),
      party,
      inventory,
      equipment,
      inventorySlotUpgrades: validLevel(stored.inventorySlotUpgrades),
      inventoryStackUpgrades: sanitizeInventoryStackUpgrades(stored.inventoryStackUpgrades),
      highestUnlockedLevel: highest,
      selectedLevel: Math.max(1, Math.min(highest, Math.floor(stored.selectedLevel ?? 1))),
      completedRaids,
      victories: Math.max(0, Math.floor(stored.victories ?? 0)),
      purchasedQuestIds,
      activeQuestId,
      completedQuestIds,
      battleAutoMode: Boolean(stored.battleAutoMode),
      adventureAutoMode: Boolean(stored.adventureAutoMode),
      adventureStrategy,
      targetAdventureRing: Math.max(1, validLevel(stored.targetAdventureRing) || 3),
      adventureIgnoreGold: completedRaids.includes(8) && Boolean(stored.adventureIgnoreGold),
      selectedAdventureMembers,
      restartAdventureOnFullHp: Boolean(stored.restartAdventureOnFullHp),
      materials,
      fish: sanitizeFishCounts(stored.fish),
      potions: sanitizePotionCounts(stored.potions),
      activePotions,
      activeMysteryPotions,
      fishingRod: Boolean(stored.fishingRod) || completedQuestIds.includes("retrieve-lost-item"),
      fishingAssignment: sanitizeFishingAssignment(stored.fishingAssignment, party),
      fishingLog: sanitizeFishingLog(stored.fishingLog),
      cartographerQuestCompleted: Boolean(stored.cartographerQuestCompleted),
      cartographerDiscovered: Boolean(stored.cartographerDiscovered) || Boolean(stored.cartographerQuestCompleted),
      anglerMaterialsDelivered: Boolean(stored.anglerMaterialsDelivered),
      anglerDiscovered: Boolean(stored.anglerDiscovered) || Boolean(stored.anglerMaterialsDelivered) || Boolean(stored.tackleBoxOwned),
      anglerRequestedFish: FISH_STATS.includes(stored.anglerRequestedFish as StatKey)
        ? stored.anglerRequestedFish as StatKey
        : null,
      tackleBoxOwned: Boolean(stored.tackleBoxOwned),
      favoredFishStat: FISH_STATS.includes(stored.favoredFishStat as StatKey)
        ? stored.favoredFishStat as StatKey
        : null,
      autoEnterPortalTypes: sanitizePortalTypes(stored.autoEnterPortalTypes)
        .filter((type) => type !== "forge" || forgeDungeonVisited),
      autoPauseAdventureRooms: sanitizeAutoPauseAdventureRooms(stored.autoPauseAdventureRooms),
      waterDungeonVisits: Math.max(
        completedQuestIds.includes("retrieve-lost-item") ? 1 : 0,
        validLevel(stored.waterDungeonVisits),
      ),
      waterShrineOfferings: sanitizeWaterShrineOfferings(stored.waterShrineOfferings),
      waterShrineSolved: Boolean(stored.waterShrineSolved),
      tridentTrialCompleted: Boolean(stored.tridentTrialCompleted),
      weaponThrowUnlocked: Boolean(stored.weaponThrowUnlocked) || Boolean(stored.tridentTrialCompleted),
      highestAdventureRingVisited: Math.max(
        completedQuestIds.length > 0 || Boolean(stored.fishingRod) ? 2 : 0,
        ...inventory.map((item) => item.ring),
        validLevel(stored.highestAdventureRingVisited),
      ),
      escapeRopes: sanitizeEscapeRopeCounts(stored.escapeRopes),
      adventureUnlocked,
      partyTrainingUnlocked,
      shopUnlocked,
      defeatedEnemyIds,
      blacksmithUnlocked: Boolean(stored.blacksmithUnlocked),
      blacksmithDiscovered,
      hammerQuestPurchased: Boolean(stored.hammerQuestPurchased),
      // Adventure sessions are deliberately not persisted. Reloading during an
      // expedition therefore fails its Hammer attempt instead of banking it.
      hammerQuestAttemptActive: false,
      hammerQuestFailed: !hammerReturned && (
        Boolean(stored.hammerQuestFailed) || interruptedHammerAttempt
      ),
      hammerRecovered: false,
      hammerReturned,
      healingPotions: validLevel(stored.healingPotions),
      pickaxeOwned,
      miningUnlocked: Boolean(stored.miningUnlocked) || completedQuestIds.includes("find-miner"),
      miningAutoMode: stored.miningAutoMode !== false,
      selectedMiningMemberId: sanitizeMiningMember(stored.selectedMiningMemberId, party),
      restartMiningOnFullHp: Boolean(stored.restartMiningOnFullHp),
      highestMiningRoomReached: Math.min(MAX_MINING_ROOM, validLevel(stored.highestMiningRoomReached)),
      potionmasterQuestCompleted: Boolean(stored.potionmasterQuestCompleted),
      potionmasterDiscovered,
      oddityBrewerCompleted: Boolean(stored.oddityBrewerCompleted),
      oddityBrewerDiscovered: Boolean(stored.oddityBrewerDiscovered) || Boolean(stored.oddityBrewerCompleted),
      towerDoorDiscovered,
      towerQuestAvailable: typeof stored.towerQuestAvailable === "boolean"
        ? stored.towerQuestAvailable
        : towerDoorDiscovered,
      forgeDungeonVisited,
      forgeBlueprintsRecovered: Boolean(stored.forgeBlueprintsRecovered),
      forgeBlueprintsDelivered: Boolean(stored.forgeBlueprintsDelivered),
      towerKeyOwned: Boolean(stored.towerKeyOwned),
      greatTowerUnlocked: Boolean(stored.greatTowerUnlocked),
      craftingUnlocked: Boolean(stored.craftingUnlocked),
      seenShopUnlocks: Array.isArray(stored.seenShopUnlocks)
        ? stored.seenShopUnlocks.filter((key): key is string => typeof key === "string")
        : [],
    });
  } catch {
    return defaultProgression();
  }
}

export function saveProgression(state: ProgressionState, slot: SaveSlot = 1): void {
  const party: StoredProgression["party"] = {};
  for (const id of partyMemberIds(state)) {
    const member = getPartyMember(state, id);
    party[id] = {
      hp: member.hp.toString(),
      stamina: member.stamina.toString(),
      staminaActions: member.staminaActions,
      training: member.training,
      fishBonuses: member.fishBonuses,
    };
  }
  const stored: StoredProgression = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    timePlayedMs: sanitizeTimePlayed(state.timePlayedMs),
    gold: state.gold.toString(),
    party,
    inventory: state.inventory,
    equipment: state.equipment,
    inventorySlotUpgrades: state.inventorySlotUpgrades,
    inventoryStackUpgrades: state.inventoryStackUpgrades,
    highestUnlockedLevel: state.highestUnlockedLevel,
    selectedLevel: state.selectedLevel,
    completedRaids: state.completedRaids,
    victories: state.victories,
    purchasedQuestIds: state.purchasedQuestIds,
    activeQuestId: state.activeQuestId,
    completedQuestIds: state.completedQuestIds,
    battleAutoMode: state.battleAutoMode,
    adventureAutoMode: state.adventureAutoMode,
    adventureStrategy: state.adventureStrategy,
    targetAdventureRing: state.targetAdventureRing,
    adventureIgnoreGold: state.adventureIgnoreGold,
    selectedAdventureMembers: state.selectedAdventureMembers,
    restartAdventureOnFullHp: state.restartAdventureOnFullHp,
    materials: state.materials,
    fish: state.fish,
    potions: state.potions ?? emptyPotionCounts(),
    activePotions: state.activePotions ?? {},
    activeMysteryPotions: state.activeMysteryPotions ?? [],
    fishingRod: state.fishingRod,
    fishingAssignment: state.fishingAssignment,
    fishingLog: state.fishingLog,
    cartographerQuestCompleted: state.cartographerQuestCompleted,
    cartographerDiscovered: state.cartographerDiscovered,
    anglerMaterialsDelivered: state.anglerMaterialsDelivered,
    anglerDiscovered: state.anglerDiscovered,
    anglerRequestedFish: state.anglerRequestedFish,
    tackleBoxOwned: state.tackleBoxOwned,
    favoredFishStat: state.favoredFishStat,
    autoEnterPortalTypes: state.autoEnterPortalTypes,
    autoPauseAdventureRooms: state.autoPauseAdventureRooms,
    waterDungeonVisits: state.waterDungeonVisits,
    waterShrineOfferings: state.waterShrineOfferings,
    waterShrineSolved: state.waterShrineSolved,
    tridentTrialCompleted: state.tridentTrialCompleted,
    weaponThrowUnlocked: state.weaponThrowUnlocked,
    highestAdventureRingVisited: state.highestAdventureRingVisited,
    escapeRopes: state.escapeRopes,
    adventureUnlocked: state.adventureUnlocked,
    partyTrainingUnlocked: state.partyTrainingUnlocked,
    shopUnlocked: state.shopUnlocked,
    defeatedEnemyIds: state.defeatedEnemyIds,
    blacksmithUnlocked: state.blacksmithUnlocked,
    blacksmithDiscovered: state.blacksmithDiscovered,
    hammerQuestPurchased: state.hammerQuestPurchased,
    hammerQuestAttemptActive: state.hammerQuestAttemptActive,
    hammerQuestFailed: state.hammerQuestFailed,
    // The stolen Hammer is expedition-bound until returned; closing the app
    // abandons that run rather than banking the quest item.
    hammerRecovered: false,
    hammerReturned: state.hammerReturned,
    healingPotions: state.healingPotions,
    pickaxeOwned: state.pickaxeOwned,
    miningUnlocked: state.miningUnlocked,
    miningAutoMode: state.miningAutoMode,
    selectedMiningMemberId: state.selectedMiningMemberId,
    restartMiningOnFullHp: state.restartMiningOnFullHp,
    highestMiningRoomReached: state.highestMiningRoomReached,
    potionmasterQuestCompleted: state.potionmasterQuestCompleted,
    potionmasterDiscovered: state.potionmasterDiscovered,
    oddityBrewerCompleted: state.oddityBrewerCompleted,
    oddityBrewerDiscovered: state.oddityBrewerDiscovered,
    towerDoorDiscovered: state.towerDoorDiscovered,
    // Adventure sessions are not persisted. If the app closes mid-run, the
    // next load is the end of that expedition and may reveal the Shop quest.
    towerQuestAvailable: state.towerQuestAvailable || state.towerDoorDiscovered,
    forgeDungeonVisited: state.forgeDungeonVisited,
    forgeBlueprintsRecovered: state.forgeBlueprintsRecovered,
    forgeBlueprintsDelivered: state.forgeBlueprintsDelivered,
    towerKeyOwned: state.towerKeyOwned,
    greatTowerUnlocked: state.greatTowerUnlocked,
    craftingUnlocked: state.craftingUnlocked,
    seenShopUnlocks: state.seenShopUnlocks,
  };
  localStorage.setItem(saveSlotKey(slot), JSON.stringify(stored));
}

export function saveSlotSummaries(): SaveSlotSummary[] {
  migrateLegacySave();
  return SAVE_SLOTS.map((slot) => {
    const raw = localStorage.getItem(saveSlotKey(slot));
    if (!raw) return emptySaveSlotSummary(slot);
    try {
      const parsed = JSON.parse(raw) as LegacyStoredProgression;
      const stored = migrateStoredProgression(parsed);
      if (stored !== parsed) localStorage.setItem(saveSlotKey(slot), JSON.stringify(stored));
      const completedBattles = new Set(
        Array.isArray(stored.completedRaids)
          ? stored.completedRaids.filter((battle) => Number.isInteger(battle) && battle > 0)
          : [],
      );
      const partyMembers = stored.party && typeof stored.party === "object"
        ? Math.max(1, Object.keys(stored.party).length)
        : stored.completedQuestIds?.includes("rescue-me") ? 2 : 1;
      return {
        slot,
        occupied: true,
        battle: levels.find((level) => !completedBattles.has(level.number))?.number ?? null,
        timePlayedMs: sanitizeTimePlayed(stored.timePlayedMs),
        gold: formatWholeAmount(new Decimal(stored.gold ?? 0)),
        partyMembers,
        raidsCleared: Array.isArray(stored.completedRaids)
          ? new Set(stored.completedRaids.filter((raid) => Number.isInteger(raid) && raid > 0)).size
          : 0,
        savedAt: typeof stored.savedAt === "number" && Number.isFinite(stored.savedAt)
          ? stored.savedAt
          : null,
      };
    } catch {
      return emptySaveSlotSummary(slot);
    }
  });
}

export function deleteSaveSlot(slot: SaveSlot): void {
  migrateLegacySave();
  localStorage.removeItem(saveSlotKey(slot));
}

function saveSlotKey(slot: SaveSlot): string {
  return `${SAVE_SLOT_KEY_PREFIX}${slot}`;
}

function migrateStoredProgression(
  stored: LegacyStoredProgression,
): LegacyStoredProgression {
  const storedVersion = validLevel(stored.version);
  if (storedVersion >= SAVE_VERSION) return stored;
  let migrated = stored;
  if (
    storedVersion < 33
    && Array.isArray(migrated.completedRaids)
    && migrated.completedRaids.includes(8)
    && !migrated.completedRaids.includes(9)
  ) {
    migrated = {
      ...migrated,
      highestUnlockedLevel: Math.max(9, validLevel(migrated.highestUnlockedLevel)),
      selectedLevel: 9,
    };
  }
  // Version 38 introduced explicit special-room discovery flags. Saves that
  // had already reached the Tower had necessarily progressed through the old
  // Potionmaster-era content, but could have been persisted with a false flag
  // before the room visit itself was tracked.
  if (storedVersion < 39 && Boolean(migrated.towerDoorDiscovered)) {
    migrated = { ...migrated, potionmasterDiscovered: true };
  }
  // Rusty Gear briefly existed as a key-item flag during version 41. Restore
  // that earned Battle 10 reward to the material inventory so it can be placed
  // in the 4x4 crafting grid. Do not recreate a gear that was legitimately
  // consumed when the Tower Key was crafted.
  if (storedVersion < 42) {
    const legacyWithRustyGearFlag = migrated as LegacyStoredProgression & {
      rustyGearOwned?: unknown;
    };
    const hadTemporaryRustyGearKeyItem = Boolean(legacyWithRustyGearFlag.rustyGearOwned);
    const completedBattleTen = Array.isArray(migrated.completedRaids)
      && migrated.completedRaids.includes(10);
    const materials = sanitizeMaterialCounts(migrated.materials);
    const shouldRestoreRustyGear = !Boolean(migrated.towerKeyOwned)
      && (hadTemporaryRustyGearKeyItem || completedBattleTen);
    const { rustyGearOwned: _obsoleteRustyGearOwned, ...withoutObsoleteFlag } =
      legacyWithRustyGearFlag;
    migrated = {
      ...withoutObsoleteFlag,
      materials: {
        ...materials,
        "rusty-gear": shouldRestoreRustyGear
          ? Math.max(1, materials["rusty-gear"])
          : materials["rusty-gear"],
      },
    };
  }
  if (
    storedVersion < 47
    && Array.isArray(migrated.completedRaids)
    && migrated.completedRaids.includes(10)
    && !migrated.completedRaids.includes(11)
  ) {
    migrated = {
      ...migrated,
      highestUnlockedLevel: Math.max(11, validLevel(migrated.highestUnlockedLevel)),
      selectedLevel: 11,
    };
  }
  const completedRaids = Array.isArray(migrated.completedRaids) ? migrated.completedRaids : [];
  const materials = sanitizeMaterialCounts(migrated.materials);
  const shouldRestoreRustyGear = completedRaids.includes(10)
    && !Boolean(migrated.towerKeyOwned)
    && materials["rusty-gear"] <= 0;
  const inventory = Array.isArray(migrated.inventory) ? migrated.inventory : [];
  const trident = createTridentGear();
  const needsTrident = Boolean(migrated.tridentTrialCompleted)
    && !inventory.some((item) => item?.id === trident.id || item?.definitionId === "trident");
  const inventoryWithTrident = needsTrident ? [...inventory, trident] : inventory;
  const shamanRing = createShamanRingGear();
  const needsShamanRing = completedRaids.includes(6)
    && !inventoryWithTrident.some((item) => item?.id === shamanRing.id || item?.definitionId === "shaman-ring");
  const inventoryWithShamanRing = needsShamanRing ? [...inventoryWithTrident, shamanRing] : inventoryWithTrident;
  const suctionCups = createSuctionCupsGear();
  const needsSuctionCups = completedRaids.includes(9)
    && !inventoryWithShamanRing.some((item) =>
      item?.id === suctionCups.id || item?.definitionId === "suction-cups"
    );
  return {
    ...migrated,
    version: SAVE_VERSION,
    savedAt: Date.now(),
    autoPauseAdventureRooms: storedVersion < 46 && Array.isArray(migrated.autoPauseAdventureRooms)
      ? [...new Set([...migrated.autoPauseAdventureRooms, "oddityBrewer" as const])]
      : migrated.autoPauseAdventureRooms,
    materials: shouldRestoreRustyGear ? { ...materials, "rusty-gear": 1 } : materials,
    inventory: needsSuctionCups ? [...inventoryWithShamanRing, suctionCups] : inventoryWithShamanRing,
  };
}

function migrateLegacySave(): void {
  if (!localStorage.getItem(SAVE_SLOT_MIGRATION_KEY)) {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacy && !localStorage.getItem(saveSlotKey(1))) {
      localStorage.setItem(saveSlotKey(1), legacy);
    }
    localStorage.setItem(SAVE_SLOT_MIGRATION_KEY, "1");
  }
}

function emptySaveSlotSummary(slot: SaveSlot): SaveSlotSummary {
  return {
    slot,
    occupied: false,
    battle: 1,
    timePlayedMs: 0,
    gold: "0",
    partyMembers: 0,
    raidsCleared: 0,
    savedAt: null,
  };
}

function sanitizeTimePlayed(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

export function advanceProgression(
  state: ProgressionState,
  deltaSeconds = 0.2,
  random: () => number = Math.random,
): {
  state: ProgressionState;
  completed: StatKey | null;
  materialCompleted: MaterialId | null;
  inventoryFull?: boolean;
} {
  const assignment = state.fishingAssignment;
  if (!assignment) return { state, completed: null, materialCompleted: null };
  let progressSeconds = assignment.progressSeconds + Math.max(0, deltaSeconds);
  let activeBait = true;
  let materials = state.materials;
  let fish = state.fish;
  let caught: StatKey | null = null;
  let materialCompleted: MaterialId | null = null;
  let inventoryFull = false;
  const fishingLogEntries: string[] = [];
  while (progressSeconds >= 3 && activeBait) {
    progressSeconds -= 3;
    const bait = MATERIAL_META[assignment.baitId];
    const materialCatchChances = bait.materialCatchChances;
    if (materialCatchChances) {
      const catchRoll = random();
      let threshold = 0;
      for (const materialId of MATERIAL_IDS) {
        threshold += materialCatchChances[materialId] ?? 0;
        if (catchRoll < threshold) {
          const addition = addInventoryStack(
            { ...state, materials, fish },
            materialStackId(materialId),
          );
          materials = addition.state.materials;
          if (addition.added > 0) {
            materialCompleted = materialId;
            fishingLogEntries.push(`Fished up ${MATERIAL_META[materialId].name}.`);
          } else {
            inventoryFull = true;
            fishingLogEntries.push("A catch was discarded because the inventory is full.");
          }
          break;
        }
      }
    } else if (random() < bait.catchChance) {
      const rolledFish = rollFishFamily(state, random);
      const addition = addInventoryStack(
        { ...state, materials, fish },
        fishStackId(rolledFish),
      );
      fish = addition.state.fish;
      if (addition.added > 0) {
        caught = rolledFish;
        fishingLogEntries.push(`Caught a ${FISH_META[rolledFish].name}.`);
      } else {
        inventoryFull = true;
        fishingLogEntries.push("A catch was discarded because the inventory is full.");
      }
    }
    if (bait.reusableBait) {
      activeBait = true;
    } else if (assignment.mode === "auto" && materials[assignment.baitId] > 0) {
      const conserveBait = memberHasTrident(state, assignment.memberId) && random() < 0.2;
      if (!conserveBait) {
        materials = {
          ...materials,
          [assignment.baitId]: materials[assignment.baitId] - 1,
        };
      }
    } else {
      activeBait = false;
      if (materials[assignment.baitId] <= 0) {
        fishingLogEntries.push(`Out of ${bait.name}.`);
      }
    }
  }
  return {
    completed: caught,
    materialCompleted,
    inventoryFull,
    state: {
      ...state,
      fish,
      materials,
      fishingLog: [
        ...fishingLogEntries.reverse(),
        ...state.fishingLog,
      ].slice(0, 12),
      fishingAssignment: activeBait
        ? { ...assignment, progressSeconds }
        : null,
    },
  };
}

function memberHasTrident(state: ProgressionState, memberId: PlayerId): boolean {
  const weaponId = state.equipment[memberId]?.sword;
  return Boolean(weaponId && state.inventory.some(
    (item) => item.id === weaponId && item.definitionId === "trident",
  ));
}

export function partyMemberIds(state: ProgressionState): PlayerId[] {
  return PLAYER_ORDER.filter((id) => Boolean(state.party[id]));
}

export function hasPartyMember(state: ProgressionState, id: PlayerId): boolean {
  return Boolean(state.party[id]);
}

export function availableAdventureStrategies(
  state: ProgressionState,
  runQuestActive = false,
): AdventureStrategy[] {
  const strategies: AdventureStrategy[] = ["none"];
  if (state.activeQuestId || state.hammerQuestAttemptActive || runQuestActive) strategies.push("quest");
  if (state.selectedAdventureMembers.filter((id) => Boolean(state.party[id])).length > 1) {
    strategies.push("together", "split");
  }
  if (state.completedRaids.includes(8)) strategies.push("ring");
  return strategies;
}

export function effectiveAdventureStrategy(
  state: ProgressionState,
  runQuestActive = false,
): AdventureStrategy {
  const available = availableAdventureStrategies(state, runQuestActive);
  return available.includes(state.adventureStrategy)
    ? state.adventureStrategy
    : "none";
}

export function setAdventureStrategy(
  state: ProgressionState,
  strategy: AdventureStrategy,
  runQuestActive = false,
): ProgressionState {
  if (!availableAdventureStrategies(state, runQuestActive).includes(strategy)) return state;
  return { ...state, adventureStrategy: strategy };
}

export function availableAdventureTargetRings(state: ProgressionState): number[] {
  const highestReached = Math.min(
    4,
    Math.max(1, Math.floor(state.highestAdventureRingVisited)),
  );
  return Array.from({ length: highestReached }, (_, index) => index + 1);
}

export function setAdventureTargetRing(
  state: ProgressionState,
  ring: number,
): ProgressionState {
  if (!state.completedRaids.includes(8)) return state;
  const target = Math.floor(ring);
  if (!availableAdventureTargetRings(state).includes(target)) return state;
  return { ...state, targetAdventureRing: target };
}

export function setAutoEnterPortalType(
  state: ProgressionState,
  portalType: PortalType,
  enabled: boolean,
): ProgressionState {
  if (portalType === "water" && !fishingTabUnlocked(state)) return state;
  if (portalType === "forge" && !state.forgeDungeonVisited) return state;
  return {
    ...state,
    autoEnterPortalTypes: enabled
      ? [...new Set([...state.autoEnterPortalTypes, portalType])]
      : state.autoEnterPortalTypes.filter((type) => type !== portalType),
  };
}

export function recordWaterDungeonVisit(state: ProgressionState): ProgressionState {
  return {
    ...state,
    waterDungeonVisits: state.waterDungeonVisits + 1,
    waterShrineOfferings: {},
    waterShrineSolved: false,
  };
}

export function recordForgeDungeonVisit(state: ProgressionState): ProgressionState {
  return state.forgeDungeonVisited
    ? state
    : { ...state, forgeDungeonVisited: true };
}

export function offerFishAtWaterShrine(
  state: ProgressionState,
  tileStat: StatKey,
  fishStat: StatKey,
  requiredStats: StatKey[] = FISH_STATS,
): { state: ProgressionState; solved: boolean; error?: string } {
  if (!state.fishingRod) return { state, solved: state.waterShrineSolved, error: "Recover the Fishing Rod first." };
  const previousFish = state.waterShrineOfferings[tileStat];
  if (previousFish === fishStat) {
    return { state, solved: state.waterShrineSolved, error: `${FISH_META[fishStat].name} is already on that tile.` };
  }
  if (state.fish[fishStat] <= 0) {
    return { state, solved: state.waterShrineSolved, error: `No ${FISH_META[fishStat].name} is available.` };
  }
  let nextState: ProgressionState = {
    ...state,
    fish: { ...state.fish, [fishStat]: state.fish[fishStat] - 1 },
  };
  if (previousFish) {
    nextState = addInventoryStack(nextState, fishStackId(previousFish)).state;
  }
  const waterShrineOfferings = { ...state.waterShrineOfferings, [tileStat]: fishStat };
  const solved = [...new Set(requiredStats)].every((stat) => waterShrineOfferings[stat] === stat);
  return {
    solved,
    state: {
      ...nextState,
      waterShrineOfferings,
      waterShrineSolved: state.waterShrineSolved || solved,
    },
  };
}

export function completeTridentTrial(state: ProgressionState): ProgressionState {
  const trident = createTridentGear();
  const withTrident = grantMilestoneGear(state, trident);
  return {
    ...withTrident,
    tridentTrialCompleted: true,
    weaponThrowUnlocked: true,
  };
}

export function setAdventureMemberSelected(
  state: ProgressionState,
  id: PlayerId,
  selected: boolean,
): ProgressionState {
  if (!hasPartyMember(state, id)) return state;
  const members = selected
    ? [...new Set([...state.selectedAdventureMembers, id])]
    : state.selectedAdventureMembers.filter((memberId) => memberId !== id);
  return { ...state, selectedAdventureMembers: members };
}

export function setRestartAdventureOnFullHp(
  state: ProgressionState,
  enabled: boolean,
): ProgressionState {
  return { ...state, restartAdventureOnFullHp: enabled };
}

export function setAdventureIgnoreGold(
  state: ProgressionState,
  enabled: boolean,
): ProgressionState {
  if (enabled && !state.completedRaids.includes(8)) return state;
  return { ...state, adventureIgnoreGold: enabled };
}

export function getPartyMember(state: ProgressionState, id: PlayerId): PartyMemberProgress {
  const member = state.party[id];
  if (!member) throw new Error(`${getPlayer(id).name} is not in the party.`);
  return member;
}

export function memberStats(state: ProgressionState, id: PlayerId) {
  const member = getPartyMember(state, id);
  return applyActiveStatPotions(playerStatsWithTraining(
    id,
    member.training,
    state.inventory,
    memberEquipment(state, id),
    member.fishBonuses,
  ), state.activePotions ?? {}, state.activeMysteryPotions ?? []);
}

export function memberEquipment(state: ProgressionState, id: PlayerId): Equipment {
  return state.equipment[id] ?? EMPTY_EQUIPMENT;
}

export function memberMaxHp(state: ProgressionState, id: PlayerId): Decimal {
  return memberStats(state, id).hp;
}

export function memberMaxStamina(state: ProgressionState, id: PlayerId): Decimal {
  return memberStats(state, id).stamina;
}

export function respawnMemberHp(state: ProgressionState, id: PlayerId): Decimal {
  return memberMaxHp(state, id).mul(0.1).max(1);
}

export function setMemberHp(state: ProgressionState, id: PlayerId, hp: Decimal): ProgressionState {
  const member = getPartyMember(state, id);
  return updateMember(state, id, {
    ...member,
    hp: hp.lte(0) ? respawnMemberHp(state, id) : Decimal.min(memberMaxHp(state, id), hp),
  });
}

export function useBlacksmithHealingPotion(
  state: ProgressionState,
  id: PlayerId,
): { state: ProgressionState; error?: string } {
  if ((state.healingPotions ?? 0) <= 0) return { state, error: "No Blacksmith Healing Potions remain." };
  if (!state.party[id]) return { state, error: "That party member is unavailable." };
  return {
    state: setMemberHp(
      { ...state, healingPotions: state.healingPotions - 1 },
      id,
      getPartyMember(state, id).hp.add(200),
    ),
  };
}

export function setMemberStamina(
  state: ProgressionState,
  id: PlayerId,
  stamina: Decimal,
): ProgressionState {
  const member = getPartyMember(state, id);
  return updateMember(state, id, {
    ...member,
    stamina: Decimal.max(0, Decimal.min(memberMaxStamina(state, id), stamina)),
  });
}

export function setMemberStaminaActions(
  state: ProgressionState,
  id: PlayerId,
  actions: number,
): ProgressionState {
  const member = getPartyMember(state, id);
  return updateMember(state, id, { ...member, staminaActions: validActionProgress(actions) });
}

export function healParty(
  state: ProgressionState,
  deltaSeconds: number,
  excludedMemberIds: PlayerId[] = [],
): ProgressionState {
  const seconds = Math.max(0, deltaSeconds);
  const excluded = new Set(excludedMemberIds);
  let next = state;
  for (const id of partyMemberIds(state)) {
    if (excluded.has(id)) continue;
    const member = getPartyMember(next, id);
    const maximumHp = memberMaxHp(next, id);
    const maximumStamina = memberMaxStamina(next, id);
    next = updateMember(next, id, {
      ...member,
      hp: Decimal.min(maximumHp, member.hp.add(maximumHp.mul(HEALING_RATE_PER_SECOND * seconds))),
      stamina: Decimal.min(
        maximumStamina,
        member.stamina.add(maximumStamina.mul(STAMINA_RECOVERY_RATE_PER_SECOND * seconds)),
      ),
    });
  }
  return next;
}

export function recordEnemyDefeats(
  state: ProgressionState,
  enemyIds: string[],
): ProgressionState {
  const defeated = new Set(state.defeatedEnemyIds);
  for (const id of enemyIds) {
    const enemy = getEnemy(id);
    if (enemy && !enemy.hideFromBestiary) defeated.add(id);
  }
  if (defeated.size === state.defeatedEnemyIds.length) return state;
  return { ...state, defeatedEnemyIds: [...defeated] };
}

export function recordAdventureRingVisit(
  state: ProgressionState,
  ring: number,
): ProgressionState {
  const visitedRing = Math.max(0, Math.floor(ring));
  if (visitedRing <= state.highestAdventureRingVisited) return state;
  return { ...state, highestAdventureRingVisited: visitedRing };
}

export function advanceTimedEffects(state: ProgressionState, now = Date.now()): ProgressionState {
  const previousActivePotions = state.activePotions ?? {};
  const activePotions = Object.fromEntries(
    Object.entries(previousActivePotions).filter(([, expiry]) =>
      typeof expiry === "number" && Number.isFinite(expiry) && expiry > now
    ),
  ) as ActivePotionEffects;
  const activeMysteryPotions = (state.activeMysteryPotions ?? [])
    .filter((effect) => effect.expiresAt > now);
  if (
    Object.keys(activePotions).length === Object.keys(previousActivePotions).length
    && activeMysteryPotions.length === (state.activeMysteryPotions ?? []).length
  ) return state;
  return clampPartyVitals({ ...state, activePotions, activeMysteryPotions });
}

export function adventureTabUnlocked(state: ProgressionState): boolean {
  return state.adventureUnlocked;
}

export function trainingTabUnlocked(state: ProgressionState): boolean {
  return state.partyTrainingUnlocked;
}

export function shopTabUnlocked(state: ProgressionState): boolean {
  return state.shopUnlocked;
}

export type ShopUnlockCategory = "quests" | "potions";

export function discoverTowerDoor(state: ProgressionState): ProgressionState {
  return state.towerDoorDiscovered
    ? state
    : { ...state, towerDoorDiscovered: true, towerQuestAvailable: false };
}

export function unlockGreatTower(state: ProgressionState): ProgressionState {
  if (!state.towerKeyOwned || state.greatTowerUnlocked) return state;
  return {
    ...state,
    greatTowerUnlocked: true,
    restartAdventureOnFullHp: false,
    adventureAutoMode: false,
  };
}

export function discoverAdventureSpecialRoom(
  state: ProgressionState,
  room: AdventureAutoPauseRoom,
): ProgressionState {
  if (room === "blacksmith") {
    return state.blacksmithDiscovered ? state : { ...state, blacksmithDiscovered: true };
  }
  if (room === "potionmaster") {
    return state.potionmasterDiscovered ? state : { ...state, potionmasterDiscovered: true };
  }
  if (room === "oddityBrewer") {
    return state.oddityBrewerDiscovered ? state : { ...state, oddityBrewerDiscovered: true };
  }
  if (room === "cartographer") {
    return state.cartographerDiscovered ? state : { ...state, cartographerDiscovered: true };
  }
  if (room === "angler") {
    return state.anglerDiscovered ? state : { ...state, anglerDiscovered: true };
  }
  return discoverTowerDoor(state);
}

export function setAdventureAutoPauseRoom(
  state: ProgressionState,
  room: AdventureAutoPauseRoom,
  enabled: boolean,
): ProgressionState {
  const current = new Set(state.autoPauseAdventureRooms);
  if (enabled) current.add(room);
  else current.delete(room);
  return { ...state, autoPauseAdventureRooms: [...current] };
}

export function completeAdventureRun(state: ProgressionState): ProgressionState {
  return state.towerDoorDiscovered && !state.towerQuestAvailable
    ? { ...state, towerQuestAvailable: true }
    : state;
}

export function availableShopUnlockKeys(
  state: ProgressionState,
  category?: ShopUnlockCategory,
): string[] {
  const keys: string[] = [];
  if (!category || category === "quests") {
    for (const quest of quests) {
      if (!quest.shopAvailable || !state.completedRaids.includes(quest.unlockBattle)) continue;
      if (quest.id === "enter-tower" && !state.towerQuestAvailable) continue;
      keys.push(`quest:${quest.id}`);
    }
  }
  if ((!category || category === "potions") && state.completedRaids.includes(9)) {
    keys.push("potions:level-2");
  }
  return keys;
}

export function hasNewShopContent(
  state: ProgressionState,
  category?: ShopUnlockCategory,
): boolean {
  const seen = new Set(state.seenShopUnlocks);
  return availableShopUnlockKeys(state, category).some((key) => !seen.has(key));
}

export function markShopUnlocksSeen(
  state: ProgressionState,
  category: ShopUnlockCategory,
): ProgressionState {
  const seen = new Set(state.seenShopUnlocks);
  availableShopUnlockKeys(state, category).forEach((key) => seen.add(key));
  return { ...state, seenShopUnlocks: [...seen] };
}

export function recordAdventureDeath(state: ProgressionState): ProgressionState {
  return state.partyTrainingUnlocked ? state : { ...state, partyTrainingUnlocked: true };
}

export function unlockShopkeeper(state: ProgressionState): ProgressionState {
  return state.shopUnlocked ? state : { ...state, shopUnlocked: true };
}

export function addGear(state: ProgressionState, item: GearItem): ProgressionState {
  return tryAddGear(state, item).state;
}

export function tryAddGear(
  state: ProgressionState,
  item: GearItem,
): { state: ProgressionState; added: boolean } {
  if (state.inventory.some((candidate) => candidate.id === item.id)) {
    return { state, added: false };
  }
  if (!canAddUniqueInventoryItem(state)) return { state, added: false };
  return { state: { ...state, inventory: [...state.inventory, item] }, added: true };
}

export function equipGear(
  state: ProgressionState,
  memberId: PlayerId,
  itemId: string,
): { state: ProgressionState; error?: string } {
  if (!hasPartyMember(state, memberId)) return { state, error: "That member is not in the party." };
  const item = state.inventory.find((candidate) => candidate.id === itemId);
  if (!item) return { state, error: "That item is not in the inventory." };
  const equippedIds = new Set(
    partyMemberIds(state).flatMap((id) =>
      Object.values(memberEquipment(state, id)).filter((candidate): candidate is string => Boolean(candidate))
    ),
  );
  const displacedItemId = memberEquipment(state, memberId)[item.slot];
  const slotsAfterEquip = inventoryUsedSlots(state)
    - (equippedIds.has(item.id) ? 0 : 1)
    + (displacedItemId && displacedItemId !== item.id ? 1 : 0);
  if (slotsAfterEquip > inventorySlotCapacity(state)) {
    return { state, error: "The inventory is full. Free a slot before swapping that equipment." };
  }
  const equipment = Object.fromEntries(
    partyMemberIds(state).map((id) => {
      const slots = { ...memberEquipment(state, id) };
      for (const slot of GEAR_SLOTS) {
        if (slots[slot] === item.id) slots[slot] = null;
      }
      return [id, slots];
    }),
  ) as Partial<Record<PlayerId, Equipment>>;
  equipment[memberId] = {
    ...memberEquipment(state, memberId),
    ...equipment[memberId],
    [item.slot]: item.id,
  };
  return {
    state: clampPartyVitals({
      ...state,
      equipment,
    }),
  };
}

export function unequipGear(
  state: ProgressionState,
  memberId: PlayerId,
  slot: GearSlot,
): { state: ProgressionState; error?: string } {
  if (!hasPartyMember(state, memberId)) return { state, error: "That member is not in the party." };
  if (!memberEquipment(state, memberId)[slot]) return { state };
  if (inventoryUsedSlots(state) >= inventorySlotCapacity(state)) {
    return { state, error: "The inventory is full. Free a slot before unequipping that item." };
  }
  return {
    state: clampPartyVitals({
      ...state,
      equipment: {
        ...state.equipment,
        [memberId]: { ...memberEquipment(state, memberId), [slot]: null },
      },
    }),
  };
}

export function gearSellPrice(item: GearItem): number {
  return Math.max(1, item.power * 25);
}

export function sellGear(
  state: ProgressionState,
  itemId: string,
): { state: ProgressionState; error?: string } {
  const itemIndex = state.inventory.findIndex((candidate) => candidate.id === itemId);
  if (itemIndex < 0) return { state, error: "That item is not in the inventory." };
  const item = state.inventory[itemIndex];
  if (isMilestoneGear(item)) return { state, error: "Milestone gear cannot be sold." };
  const equippedBy = partyMemberIds(state).find((id) =>
    GEAR_SLOTS.some((slot) => memberEquipment(state, id)[slot] === itemId)
  );
  if (equippedBy) return { state, error: "Unequip that item before selling it." };
  return {
    state: {
      ...state,
      gold: state.gold.add(gearSellPrice(item)),
      inventory: state.inventory.filter((_, index) => index !== itemIndex),
    },
  };
}

export function recordVictory(
  state: ProgressionState,
  level: number,
  _reward = "0",
): { state: ProgressionState; unlocked: boolean; firstClear: boolean; rewardDiscarded?: boolean } {
  if (state.completedRaids.includes(level)) return { state, unlocked: false, firstClear: false };
  const unlocked = level >= state.highestUnlockedLevel && hasLevel(level + 1);
  let rewardState = level === 6 ? grantMilestoneGear(state, createShamanRingGear()) : state;
  if (
    level === 3
    && !rewardState.shopUnlocked
    && !rewardState.completedQuestIds.includes("rescue-shopkeeper")
    && !rewardState.purchasedQuestIds.includes("rescue-shopkeeper")
  ) {
    rewardState = {
      ...rewardState,
      purchasedQuestIds: [...rewardState.purchasedQuestIds, "rescue-shopkeeper"],
      activeQuestId: rewardState.activeQuestId ?? "rescue-shopkeeper",
      adventureStrategy: rewardState.adventureStrategy,
    };
  }
  const rewardDiscarded = false;
  if (level === 8 && rewardState.materials["rotten-tentacle"] <= 0) {
    rewardState = grantInventoryStack(rewardState, materialStackId("rotten-tentacle"));
  }
  if (level === 9) {
    rewardState = grantMilestoneGear(rewardState, createSuctionCupsGear());
  }
  if (level === 10) {
    rewardState = grantInventoryStack(rewardState, materialStackId("rusty-gear"));
  }
  return {
    unlocked,
    firstClear: true,
    rewardDiscarded,
    state: {
      ...rewardState,
      victories: state.victories + 1,
      completedRaids: state.completedRaids.includes(level)
        ? state.completedRaids
        : [...state.completedRaids, level].sort((a, b) => a - b),
      highestUnlockedLevel: unlocked ? level + 1 : state.highestUnlockedLevel,
      selectedLevel: unlocked ? level + 1 : state.selectedLevel,
      adventureUnlocked: state.adventureUnlocked || level === 1,
    },
  };
}

function grantMilestoneGear(state: ProgressionState, item: GearItem): ProgressionState {
  if (state.inventory.some((candidate) => candidate.id === item.id)) return state;
  return ensureInventoryCapacity({ ...state, inventory: [...state.inventory, item] });
}

export function purchaseUndeadGem(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  const item = createUndeadGemGear();
  if (!state.shopUnlocked) return { state, error: "Find and rescue the Shopkeeper first." };
  if (state.inventory.some((candidate) => candidate.id === item.id)) {
    return { state, error: "The Undead Gem is already owned." };
  }
  const cost = new Decimal(UNDEAD_GEM_COST);
  if (state.gold.lt(cost)) return { state, error: "Not enough gold." };
  if (!canAddUniqueInventoryItem(state)) return { state, error: "The inventory is full." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(cost),
      inventory: [...state.inventory, item],
    },
  };
}

export function nextRaidNumber(state: ProgressionState): number | null {
  return levels.find((level) => !state.completedRaids.includes(level.number))?.number ?? null;
}

export function purchaseQuest(
  state: ProgressionState,
  questId: QuestId,
): { state: ProgressionState; error?: string } {
  const quest = getQuest(questId);
  if (!quest) return { state, error: "Unknown quest." };
  if (!quest.shopAvailable) return { state, error: "That quest is unlocked elsewhere." };
  if (!state.completedRaids.includes(quest.unlockBattle)) {
    return { state, error: `Beat Battle ${quest.unlockBattle} first.` };
  }
  if (questId === "enter-tower" && !state.towerQuestAvailable) {
    return { state, error: "Find the sealed Tower door first." };
  }
  if (state.completedQuestIds.includes(questId)) return { state, error: "That quest is complete." };
  if (state.purchasedQuestIds.includes(questId)) return { state, error: "That quest is already purchased." };
  if (state.gold.lt(quest.cost)) return { state, error: "Not enough gold." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(quest.cost),
      purchasedQuestIds: [...state.purchasedQuestIds, questId],
      activeQuestId: state.activeQuestId ?? questId,
    },
  };
}

export function activateQuest(
  state: ProgressionState,
  questId: QuestId,
): { state: ProgressionState; error?: string } {
  if (state.completedQuestIds.includes(questId)) return { state, error: "That quest is complete." };
  if (!state.purchasedQuestIds.includes(questId)) return { state, error: "Purchase that quest first." };
  if (state.activeQuestId === questId) return { state };
  return { state: { ...state, activeQuestId: questId } };
}

export function completeQuest(state: ProgressionState, questId: QuestId): ProgressionState {
  if (state.activeQuestId !== questId) return state;
  const recruitedId = questId === "rescue-me"
    ? "worm"
    : questId === "find-miner"
      ? "miner"
      : null;
  const party = recruitedId && !state.party[recruitedId]
    ? { ...state.party, [recruitedId]: createMemberProgress(recruitedId) }
    : state.party;
  const equipment = recruitedId && !state.party[recruitedId]
    ? { ...state.equipment, [recruitedId]: { ...EMPTY_EQUIPMENT } }
    : state.equipment;
  return {
    ...state,
    party,
    equipment,
    activeQuestId: null,
    fishingRod: state.fishingRod || questId === "retrieve-lost-item",
    miningUnlocked: state.miningUnlocked || questId === "find-miner",
    waterDungeonVisits: questId === "retrieve-lost-item"
      ? Math.max(1, state.waterDungeonVisits)
      : state.waterDungeonVisits,
    adventureStrategy: state.adventureStrategy === "quest" ? "none" : state.adventureStrategy,
    completedQuestIds: state.completedQuestIds.includes(questId)
      ? state.completedQuestIds
      : [...state.completedQuestIds, questId],
  };
}

export function formatDecimal(value: Decimal): string {
  return formatAmount(value);
}

function createMemberProgress(id: PlayerId, training = { ...EMPTY_TRAINING }): PartyMemberProgress {
  const stats = playerStatsWithTraining(id, training);
  return {
    hp: stats.hp,
    stamina: stats.stamina,
    staminaActions: 0,
    training,
    fishBonuses: { ...EMPTY_TRAINING },
  };
}

function updateMember(
  state: ProgressionState,
  id: PlayerId,
  member: PartyMemberProgress,
): ProgressionState {
  return { ...state, party: { ...state.party, [id]: member } };
}

function sanitizeParty(
  stored: LegacyStoredProgression,
  inventory: GearItem[],
  equipment: Partial<Record<PlayerId, Equipment>>,
  completedQuestIds: QuestId[],
  activePotions: ActivePotionEffects,
  activeMysteryPotions: ActiveMysteryPotionEffect[],
  now: number,
): ProgressionState["party"] {
  const source = stored.party;
  const party: ProgressionState["party"] = {};
  const desiredIds = new Set<PlayerId>(["knight"]);
  if (source?.worm || completedQuestIds.includes("rescue-me")) desiredIds.add("worm");
  if (source?.miner || completedQuestIds.includes("find-miner")) desiredIds.add("miner");
  for (const id of desiredIds) {
    const raw = source?.[id];
    const training = sanitizeTraining(raw?.training ?? (id === "knight" ? stored.training : undefined));
    const fishBonuses = sanitizeTraining(raw?.fishBonuses);
    const stats = applyActiveStatPotions(playerStatsWithTraining(
      id,
      training,
      inventory,
      equipment[id] ?? EMPTY_EQUIPMENT,
      fishBonuses,
    ), activePotions, activeMysteryPotions, now);
    const savedHp = new Decimal(raw?.hp ?? (id === "knight" ? stored.knightHp : stats.hp) ?? stats.hp);
    const savedStamina = new Decimal(
      raw?.stamina ?? (id === "knight" ? stored.knightStamina : stats.stamina) ?? stats.stamina,
    );
    party[id] = {
      hp: savedHp.gt(0) ? Decimal.min(stats.hp, savedHp) : stats.hp.mul(0.1).max(1),
      stamina: Decimal.max(0, Decimal.min(stats.stamina, savedStamina)),
      staminaActions: validActionProgress(
        raw?.staminaActions ?? (id === "knight" ? stored.knightStaminaActions : 0),
      ),
      training,
      fishBonuses,
    };
  }
  return party;
}

function sanitizeTraining(value: Partial<TrainingLevels> | undefined): TrainingLevels {
  return {
    hp: validLevel(value?.hp), stamina: validLevel(value?.stamina),
    attack: validLevel(value?.attack), defense: validLevel(value?.defense),
    spAttack: validLevel(value?.spAttack), spDefense: validLevel(value?.spDefense),
    speed: validLevel(value?.speed), luck: validLevel(value?.luck),
  };
}

function sanitizeInventory(value: unknown): GearItem[] {
  if (!Array.isArray(value)) return [];
  const inventory: GearItem[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const raw = candidate as Partial<GearItem>;
    if (typeof raw.id !== "string" || !isGearSlot(raw.slot)) continue;
    if (raw.definitionId === "trident" || raw.id === createTridentGear().id) {
      inventory.push(createTridentGear());
      continue;
    }
    if (raw.definitionId === "undead-gem" || raw.id === createUndeadGemGear().id) {
      inventory.push(createUndeadGemGear());
      continue;
    }
    if (raw.definitionId === "shaman-ring" || raw.id === createShamanRingGear().id) {
      inventory.push(createShamanRingGear());
      continue;
    }
    if (raw.definitionId === "suction-cups" || raw.id === createSuctionCupsGear().id) {
      inventory.push(createSuctionCupsGear());
      continue;
    }
    const ring = Math.max(0, Math.floor(Number(raw.ring) || 0));
    const canonical = createRingGear(raw.slot, ring, raw.id);
    inventory.push({
      ...canonical,
      id: raw.id,
      weaponAbilityId: isWeaponAbilityId(raw.weaponAbilityId)
        ? raw.weaponAbilityId
        : canonical.weaponAbilityId,
    });
  }
  return inventory;
}

function sanitizeEquipment(value: unknown, inventory: GearItem[]): Equipment {
  const raw = value && typeof value === "object" ? value as Partial<Equipment> : {};
  const equipment = { ...EMPTY_EQUIPMENT };
  for (const slot of GEAR_SLOTS) {
    const itemId = raw[slot];
    if (typeof itemId !== "string") continue;
    const item = inventory.find((candidate) => candidate.id === itemId && candidate.slot === slot);
    if (item) equipment[slot] = item.id;
  }
  return equipment;
}

function sanitizePartyEquipment(
  value: unknown,
  inventory: GearItem[],
  completedQuestIds: QuestId[],
): Partial<Record<PlayerId, Equipment>> {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const legacyEquipment = GEAR_SLOTS.some((slot) => Object.hasOwn(raw, slot));
  const equipment: Partial<Record<PlayerId, Equipment>> = {
    knight: sanitizeEquipment(legacyEquipment ? raw : raw.knight, inventory),
  };
  if (completedQuestIds.includes("rescue-me") || raw.worm) {
    equipment.worm = sanitizeEquipment(raw.worm, inventory);
  }
  if (completedQuestIds.includes("find-miner") || raw.miner) {
    equipment.miner = sanitizeEquipment(raw.miner, inventory);
  }
  const used = new Set<string>();
  for (const id of PLAYER_ORDER) {
    const slots = equipment[id];
    if (!slots) continue;
    for (const slot of GEAR_SLOTS) {
      const itemId = slots[slot];
      if (!itemId || used.has(itemId)) slots[slot] = null;
      else used.add(itemId);
    }
  }
  return equipment;
}

function sanitizeCompletedRaids(value: unknown, highest: number): number[] {
  const fromSave = Array.isArray(value)
    ? value.filter((raid): raid is number => Number.isInteger(raid) && raid > 0 && raid <= levels.length)
    : [];
  if (fromSave.length > 0) return [...new Set(fromSave)].sort((a, b) => a - b);
  return Array.from({ length: Math.max(0, highest - 1) }, (_, index) => index + 1);
}

function sanitizeDefeatedEnemyIds(
  value: unknown,
  completedRaids: number[],
  completedQuestIds: QuestId[],
  materials: MaterialCounts,
  tridentTrialCompleted: boolean,
): string[] {
  const defeated = new Set<string>();
  if (Array.isArray(value)) {
    for (const id of value) {
      const enemy = typeof id === "string" ? getEnemy(id) : undefined;
      if (enemy && !enemy.hideFromBestiary) defeated.add(id);
    }
  }
  for (const level of completedRaids) {
    for (const spawn of getLevel(level).enemies) {
      if (!spawn.unit.hideFromBestiary) defeated.add(spawn.unit.id);
    }
  }
  if (materials["rat-pelt"] > 0) defeated.add("rat");
  if (materials["ant-chitin"] > 0) defeated.add("ant");
  if (materials["ink-sac"] > 0) defeated.add("octopus");
  if (materials["fire-alligator-hide"] > 0) defeated.add("fire-alligator");
  if (completedQuestIds.includes("rescue-me")) defeated.add("spider");
  if (tridentTrialCompleted) defeated.add("merman");
  return [...defeated].filter((id) => {
    const enemy = getEnemy(id);
    return Boolean(enemy && !enemy.hideFromBestiary);
  });
}

function sanitizeQuestIds(value: unknown): QuestId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is QuestId => typeof id === "string" && Boolean(getQuest(id))))];
}

function sanitizePurchasedQuestIds(
  value: unknown,
  completed: QuestId[],
  active: QuestId | null,
): QuestId[] {
  return [...new Set([
    ...sanitizeQuestIds(value),
    ...completed,
    ...(active ? [active] : []),
  ])];
}

function sanitizeActiveQuest(
  value: unknown,
  completed: QuestId[],
  completedRaids: number[],
): QuestId | null {
  if (typeof value !== "string" || completed.includes(value as QuestId)) return null;
  const quest = getQuest(value);
  return quest && completedRaids.includes(quest.unlockBattle) ? quest.id : null;
}

export function clampPartyVitals(state: ProgressionState): ProgressionState {
  let next = state;
  for (const id of partyMemberIds(state)) {
    const member = getPartyMember(next, id);
    next = setMemberHp(next, id, member.hp);
    next = setMemberStamina(next, id, getPartyMember(next, id).stamina);
  }
  return next;
}

function validLevel(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function validActionProgress(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value)) % 5
    : 0;
}

function sanitizeAdventureStrategy(value: unknown): AdventureStrategy {
  return value === "none" || value === "quest" || value === "split" || value === "together" || value === "ring"
    ? value
    : "none";
}

function sanitizePortalTypes(value: unknown): PortalType[] {
  if (!Array.isArray(value)) return [];
  return (["water", "forge"] as PortalType[]).filter((portal) => value.includes(portal));
}

function sanitizeFishingLog(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim())
    .slice(0, 12);
}

const ADVENTURE_AUTO_PAUSE_ROOMS: AdventureAutoPauseRoom[] = [
  "blacksmith",
  "potionmaster",
  "oddityBrewer",
  "cartographer",
  "angler",
  "towerExterior",
];

function sanitizeAutoPauseAdventureRooms(value: unknown): AdventureAutoPauseRoom[] {
  if (!Array.isArray(value)) return [...ADVENTURE_AUTO_PAUSE_ROOMS];
  return [...new Set(value.filter((room): room is AdventureAutoPauseRoom =>
    ADVENTURE_AUTO_PAUSE_ROOMS.includes(room as AdventureAutoPauseRoom)
  ))];
}

function sanitizeWaterShrineOfferings(value: unknown): Partial<Record<StatKey, StatKey>> {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const offerings: Partial<Record<StatKey, StatKey>> = {};
  for (const stat of FISH_STATS) {
    if (typeof raw[stat] === "string" && FISH_STATS.includes(raw[stat] as StatKey)) {
      offerings[stat] = raw[stat] as StatKey;
    }
  }
  return offerings;
}

function sanitizeAdventureMembers(
  value: unknown,
  party: ProgressionState["party"],
): PlayerId[] {
  if (!Array.isArray(value)) return ["knight"];
  return PLAYER_ORDER.filter((id) => party[id] && value.includes(id));
}

function sanitizeMiningMember(
  value: unknown,
  party: ProgressionState["party"],
): PlayerId {
  if (typeof value === "string" && PLAYER_ORDER.includes(value as PlayerId) && party[value as PlayerId]) {
    return value as PlayerId;
  }
  return party.miner ? "miner" : PLAYER_ORDER.find((id) => party[id]) ?? "knight";
}

function sanitizeMaterialCounts(value: unknown): MaterialCounts {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const counts = emptyMaterialCounts();
  for (const id of MATERIAL_IDS) counts[id] = validLevel(raw[id]);
  counts["ant-chitin"] += validLevel(raw["goblin-hide"]);
  return counts;
}

function sanitizeFishCounts(value: unknown): FishCounts {
  const raw = value && typeof value === "object" ? value as Partial<FishCounts> : {};
  const counts = emptyFishCounts();
  for (const stat of FISH_STATS) counts[stat] = validLevel(raw[stat]);
  return counts;
}

function sanitizePotionCounts(value: unknown): PotionCounts {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const counts = emptyPotionCounts();
  for (const id of POTION_IDS) counts[id] = validLevel(raw[id]);
  return counts;
}

function sanitizeEscapeRopeCounts(value: unknown): EscapeRopeCounts {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const counts = emptyEscapeRopeCounts();
  for (const level of ESCAPE_ROPE_LEVELS) counts[level] = validLevel(raw[level]);
  return counts;
}

function sanitizeActivePotions(value: unknown, now: number): ActivePotionEffects {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const active: ActivePotionEffects = {};
  for (const id of POTION_IDS) {
    const expiry = raw[id];
    if (typeof expiry === "number" && Number.isFinite(expiry) && expiry > now) active[id] = expiry;
  }
  return active;
}

function sanitizeActiveMysteryPotions(value: unknown, now: number): ActiveMysteryPotionEffect[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(STANDARD_LEVEL_ONE_POTION_IDS);
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const raw = entry as Partial<ActiveMysteryPotionEffect>;
    const positive = raw.positive;
    const negative = raw.negative;
    if (
      !Array.isArray(positive)
      || positive.length !== 2
      || !allowed.has(positive[0])
      || !allowed.has(positive[1])
      || !allowed.has(negative ?? "")
      || new Set([...positive, negative]).size !== 3
      || typeof raw.expiresAt !== "number"
      || !Number.isFinite(raw.expiresAt)
      || raw.expiresAt <= now
    ) return [];
    return [{
      positive: [positive[0], positive[1]],
      negative,
      expiresAt: raw.expiresAt,
    } as ActiveMysteryPotionEffect];
  });
}

function applyActiveStatPotions(
  stats: Stats,
  activePotions: ActivePotionEffects,
  activeMysteryPotions: ActiveMysteryPotionEffect[] = [],
  now = Date.now(),
): Stats {
  const strongestBonus: Partial<Record<StatKey, number>> = {};
  for (const id of POTION_IDS) {
    const potion = POTION_META[id];
    const stat = potion.stat;
    if (!stat || (activePotions[id] ?? 0) <= now) continue;
    strongestBonus[stat] = Math.max(strongestBonus[stat] ?? 0, potion.statBonus);
  }
  const mysteryBonus: Partial<Record<StatKey, number>> = {};
  for (const effect of activeMysteryPotions) {
    if (effect.expiresAt <= now) continue;
    for (const id of effect.positive) {
      const potion = POTION_META[id];
      if (potion.stat) mysteryBonus[potion.stat] = (mysteryBonus[potion.stat] ?? 0) + potion.statBonus;
    }
    const penalty = POTION_META[effect.negative];
    if (penalty.stat) mysteryBonus[penalty.stat] = (mysteryBonus[penalty.stat] ?? 0) - penalty.statBonus / 2;
  }
  const adjusted = (stat: StatKey) => stats[stat]
    .add(strongestBonus[stat] ?? 0)
    .add(mysteryBonus[stat] ?? 0)
    .max(stat === "luck" ? 0 : 1);
  return {
    hp: adjusted("hp"),
    stamina: adjusted("stamina"),
    attack: adjusted("attack"),
    defense: adjusted("defense"),
    spAttack: adjusted("spAttack"),
    spDefense: adjusted("spDefense"),
    speed: adjusted("speed"),
    luck: adjusted("luck"),
  };
}

function sanitizeFishingAssignment(
  value: unknown,
  party: ProgressionState["party"],
): FishingAssignment | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Omit<FishingAssignment, "baitId">> & { baitId?: string };
  if (!raw.memberId || !party[raw.memberId]) return null;
  const baitId = raw.baitId === "goblin-hide" ? "ant-chitin" : raw.baitId;
  if (!baitId || !MATERIAL_IDS.includes(baitId as MaterialId)) return null;
  const progressSeconds = typeof raw.progressSeconds === "number" && Number.isFinite(raw.progressSeconds)
    ? Math.max(0, Math.min(2.999, raw.progressSeconds))
    : 0;
  return {
    memberId: raw.memberId,
    baitId: baitId as MaterialId,
    mode: raw.mode === "auto" ? "auto" : "manual",
    progressSeconds,
  };
}

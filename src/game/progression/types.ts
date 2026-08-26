import type Decimal from "break_eternity.js";
import type { QuestId } from "@/content/quests";
import type { Equipment, GearItem } from "@/game/gear";
import type { FishCounts, MaterialCounts, MaterialId } from "@/game/items";
import type { ActiveMysteryPotionEffect, ActivePotionEffects, PotionCounts } from "@/game/potions";
import type {
  AdventureAutoPauseRoom,
  AdventureStrategy,
  PlayerId,
  PortalType,
  StatKey,
  TrainingLevels,
} from "@/game/types";
import type { EscapeRopeCounts } from "@/game/escape-ropes";

export const SAVE_SLOTS = [1, 2, 3] as const;
export type SaveSlot = (typeof SAVE_SLOTS)[number];

export interface SaveSlotSummary {
  slot: SaveSlot;
  occupied: boolean;
  battle: number | null;
  timePlayedMs: number;
  gold: string;
  partyMembers: number;
  raidsCleared: number;
  savedAt: number | null;
}

export interface PartyMemberProgress {
  hp: Decimal;
  stamina: Decimal;
  staminaActions: number;
  training: TrainingLevels;
  /** Number of permanent-stat fish consumed for each stat. */
  fishBonuses: TrainingLevels;
}

export interface FishingAssignment {
  memberId: PlayerId;
  baitId: MaterialId;
  mode: "manual" | "auto";
  progressSeconds: number;
}

export interface ProgressionState {
  gold: Decimal;
  timePlayedMs: number;
  party: Partial<Record<PlayerId, PartyMemberProgress>>;
  inventory: GearItem[];
  equipment: Partial<Record<PlayerId, Equipment>>;
  inventorySlotUpgrades: number;
  inventoryStackUpgrades: number;
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
  adventureIgnoreGold: boolean;
  selectedAdventureMembers: PlayerId[];
  restartAdventureOnFullHp: boolean;
  materials: MaterialCounts;
  fish: FishCounts;
  potions: PotionCounts;
  activePotions: ActivePotionEffects;
  activeMysteryPotions: ActiveMysteryPotionEffect[];
  fishingRod: boolean;
  fishingAssignment: FishingAssignment | null;
  fishingLog: string[];
  cartographerQuestCompleted: boolean;
  cartographerDiscovered: boolean;
  anglerMaterialsDelivered: boolean;
  anglerDiscovered: boolean;
  anglerRequestedFish: StatKey | null;
  tackleBoxOwned: boolean;
  favoredFishStat: StatKey | null;
  autoEnterPortalTypes: PortalType[];
  autoPauseAdventureRooms: AdventureAutoPauseRoom[];
  waterDungeonVisits: number;
  waterShrineOfferings: Partial<Record<StatKey, StatKey>>;
  waterShrineSolved: boolean;
  tridentTrialCompleted: boolean;
  weaponThrowUnlocked: boolean;
  highestAdventureRingVisited: number;
  escapeRopes: EscapeRopeCounts;
  adventureUnlocked: boolean;
  partyTrainingUnlocked: boolean;
  shopUnlocked: boolean;
  defeatedEnemyIds: string[];
  blacksmithUnlocked: boolean;
  blacksmithDiscovered: boolean;
  hammerQuestPurchased: boolean;
  hammerQuestAttemptActive: boolean;
  hammerQuestFailed: boolean;
  hammerRecovered: boolean;
  hammerReturned: boolean;
  healingPotions: number;
  pickaxeOwned: boolean;
  miningUnlocked: boolean;
  miningAutoMode: boolean;
  selectedMiningMemberId: PlayerId;
  restartMiningOnFullHp: boolean;
  highestMiningRoomReached: number;
  potionmasterQuestCompleted: boolean;
  potionmasterDiscovered: boolean;
  oddityBrewerCompleted: boolean;
  oddityBrewerDiscovered: boolean;
  towerDoorDiscovered: boolean;
  towerQuestAvailable: boolean;
  forgeDungeonVisited: boolean;
  forgeBlueprintsRecovered: boolean;
  forgeBlueprintsDelivered: boolean;
  towerKeyOwned: boolean;
  greatTowerUnlocked: boolean;
  craftingUnlocked: boolean;
  seenShopUnlocks: string[];
}

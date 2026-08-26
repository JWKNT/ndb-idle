import { getPlayer } from "@/content/players";
import type { QuestId } from "@/content/quests";
import { FISH_STATS, type FishCounts } from "@/game/items";
import type {
  AdventureStrategy,
  PlayerId,
  Position,
  StatKey,
  Stats,
} from "@/game/types";
import { STAMINA_ACTIONS_PER_POINT } from "./constants";
import { createDungeonSeed } from "./dungeonSeed";
import { centerPosition, roomKey } from "./geometry";
import { nearestFreePlayerPosition } from "./pathfinding";
import { createQuestTarget } from "./questRouting";
import {
  createSpecialDungeonStartRoom,
  generateRoom,
} from "./roomGeneration";
import { initializeAdventureTimeline } from "./turnTimeline";
import type {
  AdventureState,
  DungeonRoom,
  EarthAdventureOptions,
  ExitDirection,
  RandomSource,
  WaterAdventureOptions,
} from "./types";

export function createAdventureHeadings(
  memberIds: PlayerId[],
  strategy: AdventureStrategy,
  random: RandomSource = Math.random,
): Partial<Record<PlayerId, ExitDirection>> {
  const directions: ExitDirection[] = ["north", "east", "south", "west"];
  for (let index = directions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [directions[index], directions[swapIndex]] = [directions[swapIndex], directions[index]];
  }
  const headings: Partial<Record<PlayerId, ExitDirection>> = {};
  const sharedDirection = directions[0];
  memberIds.forEach((id, index) => {
    headings[id] = strategy === "split"
      ? directions[index % directions.length]
      : sharedDirection;
  });
  return headings;
}

export function chooseOfferingStats(
  fishInventory: Partial<FishCounts>,
  random: RandomSource = Math.random,
): StatKey[] {
  const remaining = [...FISH_STATS];
  const chosen: StatKey[] = [];
  while (chosen.length < 4 && remaining.length > 0) {
    const weights = remaining.map((stat) => fishInventory[stat] && fishInventory[stat]! > 0 ? 20 : 1);
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    let roll = Math.min(0.999999999, Math.max(0, random())) * totalWeight;
    let selectedIndex = remaining.length - 1;
    for (let index = 0; index < remaining.length; index += 1) {
      roll -= weights[index];
      if (roll < 0) {
        selectedIndex = index;
        break;
      }
    }
    chosen.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }
  return chosen;
}

export function startAdventure(
  playerStats: Stats,
  random: RandomSource = Math.random,
  staminaActionProgress = 0,
  activeQuestId: QuestId | null = null,
  playerId: PlayerId = "knight",
  waterPortalEnabled = false,
  shopkeeperRoomEnabled = false,
  completedBattleNumbers: number[] = [],
  options: EarthAdventureOptions = {},
): AdventureState {
  const playerName = getPlayer(playerId).name;
  const position = { x: 0, y: 0 };
  const questTarget = activeQuestId === "rescue-shopkeeper"
    ? createQuestTarget("rescue-shopkeeper", 3, random)
    : activeQuestId === "rescue-me"
    ? createQuestTarget("rescue-me", 4, random)
    : activeQuestId === "retrieve-lost-item"
      ? createQuestTarget("retrieve-lost-item", 5, random)
      : activeQuestId === "find-miner"
        ? createQuestTarget("find-miner", 7, random)
      : activeQuestId === "enter-tower"
        ? createQuestTarget("enter-tower", 10, random)
      : null;
  const shopkeeperRoomNumber = shopkeeperRoomEnabled && activeQuestId !== "rescue-shopkeeper"
    ? 3 + Math.floor(random() * 4)
    : null;
  const blacksmithRoomNumber = options.blacksmithRoomEnabled ? 3 + Math.floor(random() * 4) : null;
  const potionmasterRoomNumber = options.potionmasterRoomEnabled ? 4 + Math.floor(random() * 5) : null;
  const oddityBrewerRoomNumber = options.oddityBrewerRoomEnabled ? 4 + Math.floor(random() * 4) : null;
  const cartographerRoomNumber = options.cartographerRoomEnabled ? 4 + Math.floor(random() * 4) : null;
  const room = generateRoom(1, position, null, {}, playerStats.luck, random, questTarget, "earth", null, null, false, waterPortalEnabled, shopkeeperRoomNumber, [], completedBattleNumbers, blacksmithRoomNumber, potionmasterRoomNumber, 0, null, Boolean(options.forgePortalEnabled), true, cartographerRoomNumber, null, oddityBrewerRoomNumber);
  return initializeAdventureTimeline({
    dungeonSeed: createDungeonSeed(random),
    playerId,
    playerName,
    currentRoomKey: room.key,
    previousRoomKey: null,
    rooms: { [room.key]: room },
    playerPosition: centerPosition(room),
    playerFacing: "right",
    steps: 0,
    staminaActionProgress: Math.max(0, Math.floor(staminaActionProgress)) % STAMINA_ACTIONS_PER_POINT,
    log: [`${playerName} climbed down the Undertaker's rope.`],
    activeActorId: null,
    readyAt: {},
    questTarget,
    dungeonTheme: "earth",
    lostItemRoomNumber: null,
    offeringRoomNumber: null,
    waterPortalEnabled,
    forgePortalEnabled: Boolean(options.forgePortalEnabled),
    shopkeeperRoomNumber,
    blacksmithRoomNumber,
    potionmasterRoomNumber,
    oddityBrewerRoomNumber,
    cartographerRoomNumber,
    anglerRoomNumber: null,
    cartographerSurveyTargets: [],
    cartographerSurveyVisited: [],
    cartographerSurveyPaths: [],
    cartographerQuestActive: false,
    chalkRevealedPositions: [],
    chalkMappedExits: {},
    hammerQuestPurchased: Boolean(options.hammerQuestPurchased),
    hammerRecovered: Boolean(options.hammerRecovered),
    shrineSolved: false,
    playerMustPass: false,
    lastProjectile: null,
    lastImpact: [],
    lastAttackVisual: null,
    lastAttackOrigin: null,
    completedBattleNumbers: [...completedBattleNumbers],
  }, playerStats);
}

export function startForgeAdventure(
  playerStats: Stats,
  _random: RandomSource = Math.random,
  staminaActionProgress = 0,
  playerId: PlayerId = "knight",
  blueprintObjectiveEnabled = true,
): AdventureState {
  const playerName = getPlayer(playerId).name;
  const room = createSpecialDungeonStartRoom("forge");
  return initializeAdventureTimeline({
    dungeonSeed: createDungeonSeed(_random),
    playerId,
    playerName,
    currentRoomKey: room.key,
    previousRoomKey: null,
    rooms: { [room.key]: room },
    playerPosition: specialDungeonArrivalPosition(room),
    playerFacing: "right",
    steps: 0,
    staminaActionProgress: Math.max(0, Math.floor(staminaActionProgress)) % STAMINA_ACTIONS_PER_POINT,
    log: [`${playerName} entered The Forge.`],
    activeActorId: null,
    readyAt: {},
    questTarget: null,
    dungeonTheme: "forge",
    lostItemRoomNumber: null,
    offeringRoomNumber: null,
    waterPortalEnabled: false,
    forgePortalEnabled: false,
    shopkeeperRoomNumber: null,
    blacksmithRoomNumber: null,
    potionmasterRoomNumber: null,
    oddityBrewerRoomNumber: null,
    cartographerRoomNumber: null,
    anglerRoomNumber: null,
    cartographerSurveyTargets: [],
    cartographerSurveyVisited: [],
    cartographerSurveyPaths: [],
    cartographerQuestActive: false,
    chalkRevealedPositions: [],
    chalkMappedExits: {},
    hammerQuestPurchased: false,
    hammerRecovered: false,
    shrineSolved: false,
    playerMustPass: false,
    lastProjectile: null,
    lastImpact: [],
    lastAttackVisual: null,
    lastAttackOrigin: null,
    completedBattleNumbers: [],
    forgeArenasCleared: 0,
    forgeBlueprintTarget: null,
    forgeBlueprintObjectiveEnabled: blueprintObjectiveEnabled,
  }, playerStats);
}

export function startWaterAdventure(
  playerStats: Stats,
  random: RandomSource = Math.random,
  staminaActionProgress = 0,
  playerId: PlayerId = "knight",
  options: WaterAdventureOptions = {},
): AdventureState {
  const playerName = getPlayer(playerId).name;
  const lostItemRoomNumber = options.fishingRodRecovered ? null : 7 + Math.floor(random() * 4);
  const offeringRoomNumber = options.fishingRodRecovered
    && (options.visitNumber ?? 1) >= 2
    && !options.tridentTrialCompleted
      ? 5 + Math.floor(random() * 4)
      : null;
  const offeringStats = offeringRoomNumber === null
    ? []
    : chooseOfferingStats(options.fishInventory ?? {}, random);
  const anglerRoomNumber = options.anglerRoomEnabled ? 4 + Math.floor(random() * 4) : null;
  const room = createSpecialDungeonStartRoom("water");
  return initializeAdventureTimeline({
    dungeonSeed: createDungeonSeed(random),
    playerId,
    playerName,
    currentRoomKey: room.key,
    previousRoomKey: null,
    rooms: { [room.key]: room },
    playerPosition: specialDungeonArrivalPosition(room),
    playerFacing: "right",
    steps: 0,
    staminaActionProgress: Math.max(0, Math.floor(staminaActionProgress)) % STAMINA_ACTIONS_PER_POINT,
    log: [options.fishingRodRecovered
      ? `${playerName} returned to the Water Dungeon.`
      : `${playerName} entered the Water Dungeon.`],
    activeActorId: null,
    readyAt: {},
    questTarget: null,
    dungeonTheme: "water",
    lostItemRoomNumber,
    offeringRoomNumber,
    waterPortalEnabled: false,
    forgePortalEnabled: false,
    shopkeeperRoomNumber: null,
    blacksmithRoomNumber: null,
    potionmasterRoomNumber: null,
    oddityBrewerRoomNumber: null,
    cartographerRoomNumber: null,
    anglerRoomNumber,
    cartographerSurveyTargets: [],
    cartographerSurveyVisited: [],
    cartographerSurveyPaths: [],
    cartographerQuestActive: false,
    chalkRevealedPositions: [],
    chalkMappedExits: {},
    hammerQuestPurchased: false,
    hammerRecovered: false,
    shrineSolved: Boolean(options.shrineSolved),
    offeringStats,
    playerMustPass: false,
    lastProjectile: null,
    lastImpact: [],
    lastAttackVisual: null,
    lastAttackOrigin: null,
    completedBattleNumbers: [],
  }, playerStats);
}

export function addAdventureExplorer(
  shared: AdventureState,
  playerId: PlayerId,
  playerStats: Stats,
  staminaActionProgress = 0,
  occupiedStartPositions: Position[] = [],
): AdventureState {
  const playerName = getPlayer(playerId).name;
  const startRoom = shared.rooms[roomKey({ x: 0, y: 0 })];
  if (!startRoom) throw new Error("The shared dungeon has no starting room.");
  return initializeAdventureTimeline({
    dungeonSeed: shared.dungeonSeed,
    playerId,
    playerName,
    currentRoomKey: startRoom.key,
    previousRoomKey: null,
    rooms: shared.rooms,
    playerPosition: nearestFreePlayerPosition(
      startRoom,
      (shared.dungeonTheme === "water" || shared.dungeonTheme === "forge")
        ? specialDungeonArrivalPosition(startRoom)
        : centerPosition(startRoom),
      occupiedStartPositions,
    ),
    playerFacing: "right",
    steps: 0,
    staminaActionProgress: Math.max(0, Math.floor(staminaActionProgress)) % STAMINA_ACTIONS_PER_POINT,
    log: [`${playerName} joined the expedition.`],
    activeActorId: null,
    readyAt: {},
    questTarget: shared.questTarget,
    dungeonTheme: shared.dungeonTheme ?? "earth",
    lostItemRoomNumber: shared.lostItemRoomNumber ?? null,
    offeringRoomNumber: shared.offeringRoomNumber ?? null,
    waterPortalEnabled: shared.waterPortalEnabled ?? false,
    forgePortalEnabled: shared.forgePortalEnabled ?? false,
    shopkeeperRoomNumber: shared.shopkeeperRoomNumber ?? null,
    blacksmithRoomNumber: shared.blacksmithRoomNumber ?? null,
    potionmasterRoomNumber: shared.potionmasterRoomNumber ?? null,
    oddityBrewerRoomNumber: shared.oddityBrewerRoomNumber ?? null,
    cartographerRoomNumber: shared.cartographerRoomNumber ?? null,
    anglerRoomNumber: shared.anglerRoomNumber ?? null,
    cartographerSurveyTargets: [...(shared.cartographerSurveyTargets ?? [])],
    cartographerSurveyVisited: [...(shared.cartographerSurveyVisited ?? [])],
    cartographerSurveyPaths: (shared.cartographerSurveyPaths ?? []).map((path) => path.map((position) => ({ ...position }))),
    cartographerQuestActive: shared.cartographerQuestActive ?? false,
    chalkRevealedPositions: [...(shared.chalkRevealedPositions ?? [])],
    chalkMappedExits: Object.fromEntries(Object.entries(shared.chalkMappedExits ?? {}).map(([key, exits]) => [key, [...exits]])),
    hammerQuestPurchased: shared.hammerQuestPurchased ?? false,
    hammerRecovered: shared.hammerRecovered ?? false,
    shrineSolved: shared.shrineSolved ?? false,
    offeringStats: [...(shared.offeringStats ?? [])],
    playerMustPass: false,
    lastProjectile: null,
    lastImpact: [],
    lastAttackVisual: null,
    lastAttackOrigin: null,
    completedBattleNumbers: [...(shared.completedBattleNumbers ?? [])],
    forgeArenasCleared: shared.forgeArenasCleared ?? 0,
    forgeBlueprintTarget: shared.forgeBlueprintTarget ? { ...shared.forgeBlueprintTarget } : null,
    forgeBlueprintObjectiveEnabled: shared.forgeBlueprintObjectiveEnabled ?? true,
  }, playerStats);
}

function specialDungeonArrivalPosition(room: DungeonRoom): Position {
  const center = centerPosition(room);
  return { x: center.x, y: Math.min(room.height - 2, center.y + 2) };
}

export function currentAdventureRoom(state: AdventureState): DungeonRoom {
  const room = state.rooms[state.currentRoomKey];
  if (!room) throw new Error(`Missing dungeon room ${state.currentRoomKey}.`);
  return room;
}

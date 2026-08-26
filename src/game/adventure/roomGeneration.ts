import Decimal from "break_eternity.js";
import { createRegenRoomTiles } from "../../content/adventure-rooms/regen-room";
import { createLostItemRoomTiles } from "../../content/adventure-rooms/lost-item-room";
import { createOfferingRoomTiles } from "../../content/adventure-rooms/offering-room";
import { createMermanThroneRoomTiles } from "../../content/adventure-rooms/merman-throne-room";
import { createPortalRoomTiles } from "../../content/adventure-rooms/portal-room";
import { createRescueRoomTiles } from "../../content/adventure-rooms/rescue-room";
import { MIMIC_TREASURE_CHANCE, createTreasureRoomTiles } from "../../content/adventure-rooms/treasure-room";
import { createShopkeeperRoomTiles } from "../../content/adventure-rooms/shopkeeper-room";
import { createLotteryRoomTiles } from "../../content/adventure-rooms/lottery-room";
import { createDiceRoomTiles } from "../../content/adventure-rooms/dice-room";
import { createBlacksmithRoomTiles } from "../../content/adventure-rooms/blacksmith-room";
import { createHammerVaultRoomTiles } from "../../content/adventure-rooms/hammer-vault-room";
import { createMinerRoomTiles } from "../../content/adventure-rooms/miner-room";
import { createPotionmasterRoomTiles } from "../../content/adventure-rooms/potionmaster-room";
import { createCartographerRoomTiles } from "../../content/adventure-rooms/cartographer-room";
import { createAnglerRoomTiles } from "../../content/adventure-rooms/angler-room";
import { createOddityBrewerRoomTiles } from "../../content/adventure-rooms/oddity-brewer-room";
import { TOWER_EXTERIOR_SIZE, createTowerExteriorRoomTiles } from "../../content/adventure-rooms/tower-exterior-room";
import {
  FORGE_ROOM_SIZE,
  createForgeBlueprintRoomTiles,
  createForgeRoomTiles,
  createForgeTreasureRoomTiles,
  decorateForgeNormalRoom,
} from "../../content/adventure-rooms/forge-room";
import { randomForgeEquipmentRecipe } from "../../content/forge-recipes";
import { treasureGearSlot } from "../gear";
import { STANDARD_LEVEL_ONE_POTION_IDS, type PotionId } from "../potions";
import type { Position, StatKey } from "../types";
import {
  boundedLuck,
  generationChances,
  treasureRoomChance,
  waterPortalSpawnChance,
} from "./economy";
import {
  adventureEnemyDefinition,
  adventureEnemyStats,
  enemyKindForRing,
  rollEnemyKindForRoom,
} from "./enemies";
import {
  DIRECTIONS,
  adventureZoneForPosition,
  centerPosition,
  centeredExitPosition,
  chooseExitPosition,
  inwardPosition,
  oppositeDirection,
  positionKey,
  positionsEqual,
  roomKey,
  shuffled,
} from "./geometry";
import { allWalkableTilesConnected } from "./pathfinding";
import {
  canReserveMermanThrone,
  chooseExitDirections,
  hasOtherUnexploredFrontier,
  mandatoryNeighborExits,
  offeringReservingPosition,
} from "./exitPlanning";
import type {
  AdventureEnemyKind,
  AdventureExit,
  AdventureQuestTarget,
  AdventureTile,
  AdventureTileKind,
  DungeonRoom,
  DungeonTheme,
  ExitDirection,
  RandomSource,
} from "./types";

const REGEN_ROOM_CHANCE = 0.055;
const LOTTERY_ROOM_CHANCE = 0.04;
const DICE_ROOM_CHANCE = 0.012;
const WATER_INTERIOR_WALL_TARGET = 24;
const FORGE_TREASURE_ROOM_CHANCE = 0.18;
const FORGE_TREASURE_POTION_CHANCE = 0.3;
const FORGE_TREASURE_GUARANTEE_ROOM = 6;
const LEVEL_ONE_POTIONS = [...STANDARD_LEVEL_ONE_POTION_IDS];

function randomLevelOnePotion(random: RandomSource): PotionId {
  const roll = Math.max(0, Math.min(0.999999, random()));
  return LEVEL_ONE_POTIONS[Math.floor(roll * LEVEL_ONE_POTIONS.length)] ?? "haste";
}

export function createTowerExteriorDungeonRoom(
  number: number,
  position: Position,
  returnDirection: ExitDirection,
): DungeonRoom {
  const tiles = createTowerExteriorRoomTiles("south");
  const exitPosition = { x: Math.floor(TOWER_EXTERIOR_SIZE / 2), y: TOWER_EXTERIOR_SIZE - 1 };
  tiles[exitPosition.y][exitPosition.x].exitDirection = returnDirection;
  const exit: AdventureExit = {
    direction: returnDirection,
    position: exitPosition,
  };
  return {
    key: roomKey(position),
    number,
    position: { ...position },
    width: TOWER_EXTERIOR_SIZE,
    height: TOWER_EXTERIOR_SIZE,
    tiles,
    exits: [exit],
    ring: 4,
    kind: "towerExterior",
    regenUsedBy: [],
  };
}

export function createSpecialDungeonStartRoom(theme: "water" | "forge"): DungeonRoom {
  const size = theme === "forge" ? FORGE_ROOM_SIZE : 9;
  const portalKind = theme === "forge" ? "forgePortal" : "waterPortal";
  const tiles = createPortalRoomTiles(
    portalKind,
    size,
    theme === "forge" ? "forge" : undefined,
  );
  const exits = DIRECTIONS.map((direction): AdventureExit => ({
    direction,
    position: centeredExitPosition(size, direction),
  }));
  for (const exit of exits) {
    carveExitApproach(tiles, exit);
    tiles[exit.position.y][exit.position.x] = {
      kind: "exit",
      exitDirection: exit.direction,
    };
  }
  return {
    key: roomKey({ x: 0, y: 0 }),
    number: 1,
    position: { x: 0, y: 0 },
    width: size,
    height: size,
    tiles,
    exits,
    ring: theme === "forge" ? 4 : 0,
    kind: portalKind,
    regenUsedBy: [],
  };
}

function generateForgeRoom(
  number: number,
  position: Position,
  requiredExit: ExitDirection | null,
  existingRooms: Record<string, DungeonRoom>,
  random: RandomSource,
  arenasCleared: number,
  blueprintTarget: Position | null,
  blueprintObjectiveEnabled: boolean,
): DungeonRoom {
  const key = roomKey(position);
  const mandatoryExits = mandatoryNeighborExits(position, requiredExit, existingRooms);
  const blueprint = blueprintObjectiveEnabled
    && Boolean(blueprintTarget && positionsEqual(position, blueprintTarget));
  const canReserveBlueprintNorth = !mandatoryExits.includes("north")
    && !existingRooms[roomKey({ x: position.x, y: position.y - 1 })];
  const arenaCandidate = !blueprint
    && number > 1
    && (!blueprintObjectiveEnabled || arenasCleared < 3)
    && (number % 2 === 0 || random() < 0.28)
    && (!blueprintObjectiveEnabled || arenasCleared !== 2 || canReserveBlueprintNorth);
  const forgeTreasureAlreadyExists = Object.values(existingRooms)
    .some((room) => room.kind === "forgeTreasure");
  const shouldTreasure = !blueprint
    && !blueprintObjectiveEnabled
    && number > 1
    && (
      (!forgeTreasureAlreadyExists && number >= FORGE_TREASURE_GUARANTEE_ROOM)
      || (!arenaCandidate && random() < FORGE_TREASURE_ROOM_CHANCE)
    );
  const shouldArena = arenaCandidate && !shouldTreasure;
  let blueprintDirection: ExitDirection | undefined;
  let exitDirections: ExitDirection[];
  if (blueprint || shouldTreasure) {
    exitDirections = mandatoryExits;
  } else {
    exitDirections = chooseExitDirections(4, position, requiredExit, existingRooms, random, null, false);
    if (blueprintObjectiveEnabled && shouldArena && arenasCleared === 2) {
      blueprintDirection = "north";
      if (blueprintDirection && !exitDirections.includes(blueprintDirection)) {
        exitDirections = [...exitDirections, blueprintDirection];
      }
    }
  }
  const forgeTreasurePotionId = shouldTreasure && random() < FORGE_TREASURE_POTION_CHANCE
    ? randomLevelOnePotion(random)
    : undefined;
  const tiles = blueprint
    ? createForgeBlueprintRoomTiles()
    : shouldTreasure
      ? createForgeTreasureRoomTiles(forgeTreasurePotionId
          ? { potionId: forgeTreasurePotionId }
          : { gearSlot: treasureGearSlot(position.x, position.y, 4) })
      : createForgeRoomTiles();
  const width = tiles[0]?.length ?? FORGE_ROOM_SIZE;
  const height = tiles.length;
  const exits = exitDirections.map((direction) => ({
    direction,
    position: direction === "north"
      ? { x: Math.floor(width / 2), y: 0 }
      : direction === "south"
        ? { x: Math.floor(width / 2), y: height - 1 }
        : direction === "west"
          ? { x: 0, y: Math.floor(height / 2) }
          : { x: width - 1, y: Math.floor(height / 2) },
  }));
  exits.forEach((exit) => {
    carveExitApproach(tiles, exit);
    tiles[exit.position.y][exit.position.x] = { kind: "exit", exitDirection: exit.direction };
  });
  if (!blueprint && !shouldArena && !shouldTreasure) decorateForgeNormalRoom(tiles, number);
  const room: DungeonRoom = {
    key,
    number,
    position: { ...position },
    width,
    height,
    tiles,
    exits,
    ring: 4,
    kind: blueprint
      ? "forgeBlueprint"
      : shouldArena
        ? "forgeArena"
        : shouldTreasure
          ? "forgeTreasure"
          : "forgeNormal",
    regenUsedBy: [],
    forgeArenaResolved: shouldArena ? false : undefined,
    forgeArenaStarted: shouldArena ? false : undefined,
    forgeArenaOrdinal: shouldArena ? arenasCleared + 1 : undefined,
    forgeBlueprintDirection: blueprintDirection,
    forgeRecipeId: blueprint || shouldTreasure
      ? "tower-key"
      : shouldArena
        ? randomForgeEquipmentRecipe(random)
        : undefined,
  };
  return room;
}

export function generateRoom(
  number: number,
  position: Position,
  requiredExit: ExitDirection | null,
  existingRooms: Record<string, DungeonRoom>,
  luck: Decimal,
  random: RandomSource,
  questTarget: AdventureQuestTarget | null = null,
  dungeonTheme: DungeonTheme = "earth",
  lostItemRoomNumber: number | null = null,
  offeringRoomNumber: number | null = null,
  _shrineSolved = false,
  waterPortalEnabled = false,
  shopkeeperRoomNumber: number | null = null,
  offeringStats: StatKey[] = [],
  completedBattleNumbers: number[] = [],
  blacksmithRoomNumber: number | null = null,
  potionmasterRoomNumber: number | null = null,
  forgeArenasCleared = 0,
  forgeBlueprintTarget: Position | null = null,
  forgePortalEnabled = false,
  forgeBlueprintObjectiveEnabled = true,
  cartographerRoomNumber: number | null = null,
  anglerRoomNumber: number | null = null,
  oddityBrewerRoomNumber: number | null = null,
): DungeonRoom {
  if (dungeonTheme === "forge") {
    return generateForgeRoom(
      number,
      position,
      requiredExit,
      existingRooms,
      random,
      forgeArenasCleared,
      forgeBlueprintTarget,
      forgeBlueprintObjectiveEnabled,
    );
  }
  const key = roomKey(position);
  const ring = adventureZoneForPosition(position, completedBattleNumbers, dungeonTheme);
  const isHammerTarget = Boolean(questTarget?.questId === "retrieve-hammer" && positionsEqual(position, questTarget.position));
  let size = isHammerTarget ? 13 : roomSize(ring);
  const mandatoryExits = mandatoryNeighborExits(position, requiredExit, existingRooms);
  const specialRoll = number > 1 ? random() : 1;
  const treasureChance = treasureRoomChance(luck);
  const isQuestTarget = Boolean(questTarget && positionsEqual(position, questTarget.position));
  const isShopkeeperTarget = isQuestTarget && questTarget?.questId === "rescue-shopkeeper";
  const isRescueTarget = isQuestTarget && questTarget?.questId === "rescue-me";
  const portalAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "portal");
  const forgePortalAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "forgePortal");
  const isPortalTarget = isQuestTarget
    && questTarget?.questId === "retrieve-lost-item"
    && !portalAlreadyExists;
  const isForgePortalTarget = isQuestTarget
    && questTarget?.questId === "enter-tower"
    && !forgePortalAlreadyExists;
  const isMinerTarget = isQuestTarget && questTarget?.questId === "find-miner";
  const isLostItemRoom = dungeonTheme === "water" && number === lostItemRoomNumber;
  const reservingOffering = offeringReservingPosition(existingRooms, position);
  const isMermanThroneRoom = dungeonTheme === "water" && Boolean(reservingOffering);
  const offeringAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "offering");
  const offeringBossDirection = requiredExit ? oppositeDirection(requiredExit) : null;
  const isOfferingRoom = dungeonTheme === "water"
    && offeringRoomNumber !== null
    && number >= offeringRoomNumber
    && mandatoryExits.length === 1
    && !offeringAlreadyExists
    && offeringBossDirection !== null
    && canReserveMermanThrone(position, offeringBossDirection, existingRooms);
  const isRequiredQuestRoute = Boolean(
    questTarget && questTarget.path.slice(0, -1).some((step) => positionsEqual(step, position)),
  );
  const canEndOrdinaryBranch = hasOtherUnexploredFrontier(position, existingRooms, questTarget);
  const shopkeeperAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "shopkeeper");
  const isShopkeeperRoom = dungeonTheme === "earth"
    && ring === 1
    && !shopkeeperAlreadyExists
    && (
      isShopkeeperTarget
      || (
        shopkeeperRoomNumber !== null
        && number >= shopkeeperRoomNumber
        && mandatoryExits.length === 1
        && canEndOrdinaryBranch
        && !isQuestTarget
        && !isRequiredQuestRoute
      )
    );
  const blacksmithAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "blacksmith");
  const isBlacksmithRoom = dungeonTheme === "earth"
    && ring === 3
    && blacksmithRoomNumber !== null
    && countRingRooms(existingRooms, 3) + 1 >= blacksmithRoomNumber
    && mandatoryExits.length === 1
    && !isQuestTarget
    && !isRequiredQuestRoute
    && !blacksmithAlreadyExists;
  const potionmasterAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "potionmaster");
  const isPotionmasterRoom = dungeonTheme === "earth"
    && ring === 4
    && potionmasterRoomNumber !== null
    && countRingRooms(existingRooms, 4) + 1 >= potionmasterRoomNumber
    && mandatoryExits.length === 1
    && canEndOrdinaryBranch
    && !isQuestTarget
    && !isRequiredQuestRoute
    && !potionmasterAlreadyExists;
  const cartographerAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "cartographer");
  const oddityBrewerAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "oddityBrewer");
  const isOddityBrewerRoom = dungeonTheme === "earth"
    && ring === 2
    && oddityBrewerRoomNumber !== null
    && countRingRooms(existingRooms, 2) + 1 >= oddityBrewerRoomNumber
    && mandatoryExits.length === 1
    && canEndOrdinaryBranch
    && !isQuestTarget
    && !isRequiredQuestRoute
    && !oddityBrewerAlreadyExists;
  const isCartographerRoom = dungeonTheme === "earth"
    && ring === 2
    && cartographerRoomNumber !== null
    && countRingRooms(existingRooms, 2) + 1 >= cartographerRoomNumber
    && mandatoryExits.length === 1
    && canEndOrdinaryBranch
    && !isQuestTarget
    && !isRequiredQuestRoute
    && !cartographerAlreadyExists;
  const anglerAlreadyExists = Object.values(existingRooms).some((room) => room.kind === "angler");
  const isAnglerRoom = dungeonTheme === "water"
    && anglerRoomNumber !== null
    && number >= anglerRoomNumber
    && mandatoryExits.length === 1
    && !anglerAlreadyExists;
  const isWaterPortalRoom = dungeonTheme === "earth"
    && ring === 2
    && waterPortalEnabled
    && !isQuestTarget
    && !isRequiredQuestRoute
    && !dungeonHasWaterPortal(existingRooms)
    && random() < waterPortalSpawnChance(countRingRooms(existingRooms, 2) + 1);
  const isRecurringForgePortalRoom = dungeonTheme === "earth"
    && forgePortalEnabled
    && ring === 4
    && !isQuestTarget
    && !isRequiredQuestRoute
    && !forgePortalAlreadyExists
    && random() < forgePortalSpawnChance(countRingRooms(existingRooms, 4) + 1);
  const isLotteryRoom = dungeonTheme === "earth"
    && number > 1
    && completedBattleNumbers.includes(4)
    && !isQuestTarget
    && !isRequiredQuestRoute
    && specialRoll >= treasureChance + REGEN_ROOM_CHANCE
    && specialRoll < treasureChance + REGEN_ROOM_CHANCE + LOTTERY_ROOM_CHANCE;
  const isDiceRoom = dungeonTheme === "earth"
    && number > 1
    && completedBattleNumbers.includes(9)
    && !isQuestTarget
    && !isRequiredQuestRoute
    && specialRoll >= treasureChance + REGEN_ROOM_CHANCE + LOTTERY_ROOM_CHANCE
    && specialRoll < treasureChance + REGEN_ROOM_CHANCE + LOTTERY_ROOM_CHANCE + DICE_ROOM_CHANCE;
  const kind: DungeonRoom["kind"] = isRescueTarget
    ? "rescue"
    : isPortalTarget
      ? "portal"
    : isForgePortalTarget
      ? "forgePortal"
    : isMinerTarget
      ? "miner"
    : isLostItemRoom
      ? "lostItem"
    : isMermanThroneRoom
      ? "mermanThrone"
    : isOfferingRoom
      ? "offering"
    : isShopkeeperRoom
      ? "shopkeeper"
    : isHammerTarget
      ? "hammerVault"
    : isBlacksmithRoom
      ? "blacksmith"
    : isPotionmasterRoom
      ? "potionmaster"
    : isOddityBrewerRoom
      ? "oddityBrewer"
    : isCartographerRoom
      ? "cartographer"
    : isAnglerRoom
      ? "angler"
    : isWaterPortalRoom
      ? "waterPortal"
    : isRecurringForgePortalRoom
      ? "forgePortal"
    : isLotteryRoom
      ? "lottery"
    : isDiceRoom
      ? "dice"
    : isRequiredQuestRoute
      ? "normal"
    : dungeonTheme === "water"
      ? "normal"
    : mandatoryExits.length === 1 && canEndOrdinaryBranch && specialRoll < treasureChance
    ? "treasure"
    : specialRoll >= treasureChance && specialRoll < treasureChance + REGEN_ROOM_CHANCE
      ? "regen"
      : "normal";
  if (kind === "dice") size = 11;
  const isMimicTreasure = kind === "treasure"
    && completedBattleNumbers.includes(7)
    && random() < MIMIC_TREASURE_CHANCE;
  const exitDirections = number === 1
    ? [...DIRECTIONS]
    : kind === "mermanThrone"
      ? mandatoryExits
    : kind === "offering"
      ? [...mandatoryExits, offeringBossDirection!]
    : kind === "treasure" || kind === "rescue" || kind === "portal" || kind === "forgePortal" || kind === "lostItem" || kind === "shopkeeper" || kind === "blacksmith" || kind === "miner" || kind === "hammerVault" || kind === "potionmaster" || kind === "oddityBrewer" || kind === "cartographer" || kind === "angler"
      ? mandatoryExits
      : chooseExitDirections(
          ring,
          position,
          requiredExit,
          existingRooms,
          random,
          questTarget,
          dungeonTheme === "water",
        );
  const exits = exitDirections.map((direction) => ({
    direction,
    position: kind === "lostItem" || kind === "offering" || kind === "mermanThrone" || kind === "shopkeeper" || kind === "blacksmith" || kind === "miner" || kind === "hammerVault" || kind === "dice" || kind === "oddityBrewer" || kind === "cartographer" || kind === "angler"
      ? centeredExitPosition(size, direction)
      : chooseExitPosition(size, direction, random),
  }));
  const rescueLayout = kind === "rescue"
    ? createRescueRoomTiles(requiredExit ?? "west")
    : null;
  const offeringLayout = kind === "offering"
    ? createOfferingRoomTiles(requiredExit ?? "south", false, offeringStats)
    : null;
  const throneLayout = kind === "mermanThrone"
    ? createMermanThroneRoomTiles(requiredExit ?? "south", false)
    : null;
  const shopkeeperLayout = kind === "shopkeeper"
    ? createShopkeeperRoomTiles(requiredExit ?? "west")
    : null;
  const blacksmithLayout = kind === "blacksmith"
    ? createBlacksmithRoomTiles(requiredExit ?? "west")
    : null;
  const potionmasterLayout = kind === "potionmaster"
    ? createPotionmasterRoomTiles()
    : null;
  const cartographerLayout = kind === "cartographer"
    ? createCartographerRoomTiles(requiredExit ?? "west")
    : null;
  const oddityBrewerLayout = kind === "oddityBrewer"
    ? createOddityBrewerRoomTiles(requiredExit ?? "west")
    : null;
  const anglerLayout = kind === "angler"
    ? createAnglerRoomTiles(requiredExit ?? "west")
    : null;
  const minerLayout = kind === "miner"
    ? createMinerRoomTiles(requiredExit ?? "south")
    : null;
  const hammerVaultLayout = kind === "hammerVault"
    ? createHammerVaultRoomTiles()
    : null;
  const tiles = kind === "treasure"
    ? createTreasureRoomTiles(isMimicTreasure, size)
    : kind === "regen"
      ? createRegenRoomTiles(size)
      : kind === "portal"
        ? createPortalRoomTiles("portal", size)
      : kind === "forgePortal"
        ? createPortalRoomTiles("forgePortal", size)
      : kind === "waterPortal"
        ? createPortalRoomTiles("waterPortal", size)
      : kind === "lottery"
        ? createLotteryRoomTiles(size)
      : kind === "dice"
        ? createDiceRoomTiles(size)
      : potionmasterLayout?.tiles
        ? potionmasterLayout.tiles
      : oddityBrewerLayout
        ? oddityBrewerLayout
      : cartographerLayout
        ? cartographerLayout
      : anglerLayout
        ? anglerLayout
      : kind === "lostItem"
        ? createLostItemRoomTiles()
      : offeringLayout?.tiles
        ? offeringLayout.tiles
      : throneLayout?.tiles
        ? throneLayout.tiles
      : shopkeeperLayout?.tiles
        ? shopkeeperLayout.tiles
      : blacksmithLayout?.tiles
        ? blacksmithLayout.tiles
      : minerLayout?.tiles
        ? minerLayout.tiles
      : hammerVaultLayout?.tiles
        ? hammerVaultLayout.tiles
      : rescueLayout?.tiles ?? carveOpenRoom(size);

  for (const exit of exits) {
    if (
      (kind === "offering" && exit.direction === offeringBossDirection)
      || kind === "mermanThrone"
    ) continue;
    carveExitApproach(tiles, exit);
    tiles[exit.position.y][exit.position.x] = kind === "lottery"
      ? { kind: "lotteryGate", exitDirection: exit.direction }
      : kind === "dice"
        ? { kind: "diceGate", exitDirection: exit.direction }
      : kind === "hammerVault"
        ? { kind: "clayGate", exitDirection: exit.direction }
      : { kind: "exit", exitDirection: exit.direction };
  }

  const room: DungeonRoom = {
    key,
    number,
    position: { ...position },
    width: size,
    height: size,
    tiles,
    exits,
    ring,
    kind,
    regenUsedBy: [],
    offeringDoorOpened: kind === "offering" ? false : undefined,
    offeringBossDirection: kind === "offering" ? offeringBossDirection ?? undefined : undefined,
    lotterySpun: kind === "lottery" ? false : undefined,
    lotteryResolved: kind === "lottery" ? false : undefined,
    diceRolled: kind === "dice" ? false : undefined,
    diceRolling: kind === "dice" ? false : undefined,
    diceValues: undefined,
    hammerChestPosition: hammerVaultLayout?.chestPosition,
  };
  const entrance = requiredExit
    ? exits.find((exit) => exit.direction === requiredExit)
    : undefined;
  const spawn = entrance ? inwardPosition(entrance.position, entrance.direction) : centerPosition(room);
  room.tiles[spawn.y][spawn.x] = { kind: "floor" };
  if (kind === "treasure") {
    const center = centerPosition(room);
    room.tiles[center.y][center.x] = {
      kind: "treasureChest",
      gearSlot: treasureGearSlot(position.x, position.y, ring),
      mimicDisguise: isMimicTreasure,
    };
    return room;
  }
  if (kind === "regen") return room;
  if (kind === "portal" || kind === "forgePortal" || kind === "waterPortal" || kind === "lostItem" || kind === "lottery" || kind === "dice") return room;
  if (kind === "potionmaster" || kind === "oddityBrewer" || kind === "cartographer" || kind === "angler") return room;
  if (kind === "offering") {
    return room;
  }
  if (kind === "mermanThrone" && throneLayout) {
    spawnMermen(room, throneLayout.mermanPositions);
    return room;
  }
  if (kind === "rescue") {
    for (const position of rescueLayout?.spiderPositions ?? []) {
      const spiderTile = room.tiles[position.y][position.x];
      if (spiderTile.kind === "enemy") spiderTile.enemyHp = adventureEnemyStats(ring, "spider").hp;
    }
    return room;
  }
  if (kind === "shopkeeper" && shopkeeperLayout) {
    for (const position of shopkeeperLayout.skeletonPositions) {
      const skeletonTile = room.tiles[position.y][position.x];
      if (skeletonTile.kind === "enemy") skeletonTile.enemyHp = adventureEnemyStats(ring, "skeleton").hp;
    }
    return room;
  }
  if (kind === "blacksmith" || kind === "miner") return room;
  if (kind === "hammerVault" && hammerVaultLayout) {
    for (const position of hammerVaultLayout.mummyPositions) {
      const hp = adventureEnemyStats(3, "mummy").hp;
      const mummyTile = room.tiles[position.y][position.x];
      setEnemyFootprintHp(room, mummyTile.enemyId, position, hp);
    }
    return room;
  }
  if (number === 1 && dungeonTheme === "earth") {
    for (let y = 3; y <= 5; y += 1) {
      for (let x = 3; x <= 5; x += 1) {
        if (room.tiles[y][x].kind === "floor") room.tiles[y][x].floorVariant = "sunlight";
      }
    }
    const anchor = { x: Math.max(1, Math.floor(room.width / 2) - 2), y: Math.max(1, Math.floor(room.height / 2) + 2) };
    if (room.tiles[anchor.y]?.[anchor.x]?.kind === "floor") {
      room.tiles[anchor.y][anchor.x].decoration = "earthRopeAnchor";
    }
    return room;
  }
  addOpenRoomWalls(room, spawn, random, dungeonTheme);

  if (dungeonTheme === "earth" && ring >= 4) {
    for (const row of room.tiles) {
      for (const tile of row) {
        if (tile.kind === "wall") tile.wallVariant = "volcanic";
      }
    }
    placeFireBeams(room, spawn, random);
  }

  const reserved = new Set<string>([
    positionKey(spawn),
    ...exits.flatMap((exit) => [
      positionKey(exit.position),
      positionKey(inwardPosition(exit.position, exit.direction)),
    ]),
  ]);

  const forcedTrap = ring >= 4
    ? null
    : maybePlaceForcedTrap(room, spawn, requiredExit, luck, random);
  if (forcedTrap) reserved.add(positionKey(forcedTrap));

  const chances = generationChances(luck, ring, dungeonTheme);
  const enemyKind = dungeonTheme === "water" ? "octopus" : enemyKindForRing(ring);
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].kind !== "floor" || reserved.has(positionKey({ x, y }))) continue;
      const roll = random();
      if (roll < chances.gold) room.tiles[y][x] = { kind: "gold" };
      else if (ring < 4 && roll < chances.gold + chances.enemy) {
        const rolledEnemyKind = dungeonTheme === "water"
          ? "octopus"
          : rollEnemyKindForRoom(ring, completedBattleNumbers, random);
        const enemy = adventureEnemyDefinition(rolledEnemyKind);
        room.tiles[y][x] = {
          kind: "enemy",
          enemyId: `${enemy.id}-${key}-${x}-${y}`,
          enemyKind: enemy.id as AdventureEnemyKind,
          enemyHp: adventureEnemyStats(ring, rolledEnemyKind).hp,
        };
      }
      else if (roll < chances.gold + chances.enemy + chances.trap) room.tiles[y][x] = { kind: "trap" };
    }
  }

  if (dungeonTheme === "earth" && ring >= 4) {
    placeFireAlligators(room, reserved, random);
  }

  decorateOrdinaryRoom(room, dungeonTheme, reserved, random);

  return room;
}

function decorateOrdinaryRoom(
  room: DungeonRoom,
  dungeonTheme: DungeonTheme,
  reserved: Set<string>,
  random: RandomSource,
): void {
  const earthPalettes = {
    0: ["earthSewerGrate", "earthLeakingPipe", "earthRatNest"],
    1: ["earthSewerGrate", "earthLeakingPipe", "earthRatNest"],
    2: ["earthAntMound", "earthEggCluster", "earthResinPatch"],
    3: ["earthBurialUrn", "earthFossil", "earthPotteryShards"],
    4: ["earthLavaVent", "earthBasaltSpire", "earthEmberPile"],
  } as const;
  const palette = dungeonTheme === "water"
    ? ["drownedKelp", "drownedCoral", "drownedBarnacles", "drownedMast"] as const
    : earthPalettes[Math.min(4, Math.max(0, room.ring)) as keyof typeof earthPalettes];
  const candidates = shuffled(
    room.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.kind === "floor" && !tile.decoration && !reserved.has(positionKey({ x, y }))
        ? [{ x, y }]
        : []
    )),
    random,
  );
  const count = Math.min(candidates.length, room.width >= 11 ? 4 : 3);
  for (let index = 0; index < count; index += 1) {
    const position = candidates[index];
    if (!position) continue;
    room.tiles[position.y][position.x].decoration = palette[Math.floor(random() * palette.length)];
  }
}

function carveOpenRoom(size: number): AdventureTile[][] {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === size - 1 || y === size - 1 ? "wall" : "floor",
    })),
  );
}

function addOpenRoomWalls(
  room: DungeonRoom,
  spawn: Position,
  random: RandomSource,
  dungeonTheme: DungeonTheme,
): void {
  if (room.ring === 0 && dungeonTheme === "earth") return;
  const protectedTiles = new Set([
    positionKey(spawn),
    ...room.exits.flatMap((exit) => [
      positionKey(exit.position),
      positionKey(inwardPosition(exit.position, exit.direction)),
    ]),
  ]);
  const patterns: Position[][] = [
    [{ x: 0, y: 0 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
  ];
  let remaining = dungeonTheme === "water"
    ? WATER_INTERIOR_WALL_TARGET
    : Math.min(12, Math.max(4, 3 + room.ring * 2));
  let attempts = 0;
  const maximumAttempts = dungeonTheme === "water" ? 240 : 70;

  while (remaining > 0 && attempts < maximumAttempts) {
    attempts += 1;
    const origin = {
      x: 1 + Math.floor(random() * (room.width - 2)),
      y: 1 + Math.floor(random() * (room.height - 2)),
    };
    const pattern = patterns[Math.floor(random() * patterns.length)] ?? patterns[0];
    const candidates = pattern
      .map((offset) => ({ x: origin.x + offset.x, y: origin.y + offset.y }))
      .filter((position) =>
        position.x > 0 && position.x < room.width - 1 &&
        position.y > 0 && position.y < room.height - 1 &&
        room.tiles[position.y][position.x].kind === "floor" &&
        !protectedTiles.has(positionKey(position)),
      )
      .slice(0, remaining);
    if (candidates.length === 0) continue;

    for (const position of candidates) room.tiles[position.y][position.x] = { kind: "wall" };
    if (!allWalkableTilesConnected(room, spawn)) {
      for (const position of candidates) room.tiles[position.y][position.x] = { kind: "floor" };
      continue;
    }
    remaining -= candidates.length;
  }

  if (dungeonTheme === "water" && remaining > 0) {
    const candidates = shuffled(
      room.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
        tile.kind === "floor" && !protectedTiles.has(positionKey({ x, y }))
          ? [{ x, y }]
          : []
      )),
      random,
    );
    for (const position of candidates) {
      if (remaining <= 0) break;
      room.tiles[position.y][position.x] = { kind: "wall" };
      if (!allWalkableTilesConnected(room, spawn)) {
        room.tiles[position.y][position.x] = { kind: "floor" };
        continue;
      }
      remaining -= 1;
    }
  }
}

function placeFireBeams(
  room: DungeonRoom,
  spawn: Position,
  random: RandomSource,
): void {
  const beamCount = random() < 0.35 ? 2 : 1;
  const used = new Set<string>();
  for (let index = 0; index < beamCount; index += 1) {
    const direction = random() < 0.5 ? "horizontal" : "vertical";
    const limit = direction === "horizontal" ? room.height : room.width;
    const spawnCoordinate = direction === "horizontal" ? spawn.y : spawn.x;
    const candidates = shuffled(
      Array.from({ length: Math.max(0, limit - 4) }, (_, offset) => offset + 2)
        .filter((coordinate) => coordinate !== spawnCoordinate && !used.has(`${direction}:${coordinate}`)),
      random,
    );
    const coordinate = candidates[0];
    if (coordinate === undefined) continue;
    used.add(`${direction}:${coordinate}`);
    const groupId = `fire-beam:${room.key}:${direction}:${coordinate}`;
    if (direction === "horizontal") {
      for (let x = 1; x < room.width - 1; x += 1) {
        room.tiles[coordinate][x] = fireBeamTile(
          room.tiles[coordinate][x],
          groupId,
          direction,
        );
      }
    } else {
      for (let y = 1; y < room.height - 1; y += 1) {
        room.tiles[y][coordinate] = fireBeamTile(
          room.tiles[y][coordinate],
          groupId,
          direction,
        );
      }
    }
  }
}

function fireBeamTile(
  existing: AdventureTile,
  groupId: string,
  direction: "horizontal" | "vertical",
): AdventureTile {
  if (existing.kind !== "trap" || existing.trapStyle !== "fire-beam") {
    return {
      kind: "trap",
      trapStyle: "fire-beam",
      trapGroupId: groupId,
      trapGroupIds: [groupId],
      trapBeamDirection: direction,
    };
  }
  const existingGroups = existing.trapGroupIds
    ?? (existing.trapGroupId ? [existing.trapGroupId] : []);
  return {
    ...existing,
    trapGroupId: existing.trapGroupId ?? groupId,
    trapGroupIds: [...new Set([...existingGroups, groupId])],
    trapBeamDirection: existing.trapBeamDirection === direction
      ? direction
      : "cross",
  };
}

function placeFireAlligators(
  room: DungeonRoom,
  reserved: Set<string>,
  random: RandomSource,
): void {
  const roll = random();
  const desired = roll < 0.2 ? 0 : roll < 0.75 ? 1 : 2;
  if (desired === 0) return;
  const candidates = shuffled(
    room.tiles.flatMap((row, y) => row.flatMap((tile, x) => {
      const lower = room.tiles[y + 1]?.[x];
      return tile.kind === "floor"
        && lower?.kind === "floor"
        && !reserved.has(positionKey({ x, y }))
        && !reserved.has(positionKey({ x, y: y + 1 }))
        ? [{ x, y }]
        : [];
    })),
    random,
  );
  const occupied = new Set<string>();
  let placed = 0;
  for (const anchor of candidates) {
    if (placed >= desired) break;
    const lower = { x: anchor.x, y: anchor.y + 1 };
    if (occupied.has(positionKey(anchor)) || occupied.has(positionKey(lower))) continue;
    const enemyId = `fire-alligator-${room.key}-${placed + 1}`;
    const hp = adventureEnemyStats(room.ring, "fire-alligator").hp;
    room.tiles[anchor.y][anchor.x] = {
      kind: "enemy",
      enemyId,
      enemyKind: "fire-alligator",
      enemyHp: hp,
      enemyPart: 0,
      enemyFacing: "south",
    };
    room.tiles[lower.y][lower.x] = {
      kind: "enemy",
      enemyId,
      enemyKind: "fire-alligator",
      enemyHp: hp,
      enemyPart: 1,
      enemyFacing: "south",
    };
    occupied.add(positionKey(anchor));
    occupied.add(positionKey(lower));
    placed += 1;
  }
}

function carveExitApproach(tiles: AdventureTile[][], exit: AdventureExit): void {
  const inward = inwardPosition(exit.position, exit.direction);
  tiles[inward.y][inward.x] = { kind: "floor" };
}

function maybePlaceForcedTrap(
  room: DungeonRoom,
  spawn: Position,
  entryDirection: ExitDirection | null,
  luck: Decimal,
  random: RandomSource,
): Position | null {
  if (room.ring < 2) return null;
  const luckReduction = boundedLuck(luck) * 0.006;
  const chance = room.ring >= 4 ? 1 : Math.max(0.2, 0.35 + (room.ring - 2) * 0.16 - luckReduction);
  if (random() >= chance) return null;

  const exit = shuffled(
    room.exits.filter((candidate) =>
      candidate.direction !== entryDirection && isOnMainSide(spawn, candidate.direction, room.width)
    ),
    random,
  )[0];
  if (!exit) return null;
  const tilesBeforeBarrier = room.tiles.map((row) => row.map((tile) => ({ ...tile })));

  const barrierCoordinate = exit.direction === "north" || exit.direction === "west"
    ? 2
    : room.width - 3;
  const gate = exit.direction === "north" || exit.direction === "south"
    ? { x: exit.position.x, y: barrierCoordinate }
    : { x: barrierCoordinate, y: exit.position.y };

  if (exit.direction === "north" || exit.direction === "south") {
    const vestibuleY = exit.direction === "north" ? 1 : room.height - 2;
    for (let x = 1; x < room.width - 1; x += 1) {
      room.tiles[barrierCoordinate][x] = { kind: x === gate.x ? "trap" : "wall" };
      room.tiles[vestibuleY][x] = { kind: "floor" };
    }
    room.tiles[exit.direction === "north" ? 3 : room.height - 4][gate.x] = { kind: "floor" };
  } else {
    const vestibuleX = exit.direction === "west" ? 1 : room.width - 2;
    for (let y = 1; y < room.height - 1; y += 1) {
      room.tiles[y][barrierCoordinate] = { kind: y === gate.y ? "trap" : "wall" };
      room.tiles[y][vestibuleX] = { kind: "floor" };
    }
    room.tiles[gate.y][exit.direction === "west" ? 3 : room.width - 4] = { kind: "floor" };
  }
  if (!allWalkableTilesConnected(room, spawn)) {
    room.tiles = tilesBeforeBarrier;
    return null;
  }
  return gate;
}

function isOnMainSide(spawn: Position, direction: ExitDirection, size: number): boolean {
  if (direction === "north") return spawn.y > 2;
  if (direction === "south") return spawn.y < size - 3;
  if (direction === "west") return spawn.x > 2;
  return spawn.x < size - 3;
}

function roomSize(ring: number): number {
  return ring >= 4 ? 11 : 9;
}

function countRingRooms(rooms: Record<string, DungeonRoom>, ring: number): number {
  return Object.values(rooms).filter((room) => room.ring === ring).length;
}

function forgePortalSpawnChance(zoneFourRoomsVisited: number): number {
  const visit = Math.max(1, Math.floor(zoneFourRoomsVisited));
  const chances = [0, 0.2, 0.35, 0.5, 0.7, 1] as const;
  return chances[Math.min(visit, 5)];
}

function dungeonHasWaterPortal(rooms: Record<string, DungeonRoom>): boolean {
  return Object.values(rooms).some((room) => findTiles(room, "waterPortal").length > 0);
}

function spawnMermen(room: DungeonRoom, positions: Position[]): void {
  positions.forEach((position, index) => {
    room.tiles[position.y][position.x] = {
      kind: "enemy",
      enemyId: `merman-${room.key}-${index + 1}`,
      enemyKind: "merman",
      enemyHp: adventureEnemyStats(room.ring, "merman").hp,
    };
  });
}


function findTiles(room: DungeonRoom, kind: AdventureTileKind): Position[] {
  const found: Position[] = [];
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].kind === kind) found.push({ x, y });
    }
  }
  return found;
}

function enemyFootprint(room: DungeonRoom, enemyId: string | undefined, fallback: Position): Position[] {
  if (!enemyId) return [fallback];
  const positions: Position[] = [];
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].enemyId === enemyId) positions.push({ x, y });
    }
  }
  return positions.length > 0 ? positions : [fallback];
}

function setEnemyFootprintHp(
  room: DungeonRoom,
  enemyId: string | undefined,
  fallback: Position,
  hp: Decimal,
): void {
  for (const position of enemyFootprint(room, enemyId, fallback)) {
    room.tiles[position.y][position.x] = { ...room.tiles[position.y][position.x], enemyHp: hp };
  }
}

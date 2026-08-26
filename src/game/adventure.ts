import Decimal from "break_eternity.js";
import {
  sealForgeArena,
  spawnForgeArenaEnemies,
} from "../content/adventure-rooms/forge-room";
import { TOWER_EXTERIOR_SIZE } from "../content/adventure-rooms/tower-exterior-room";
import { getPlayer } from "../content/players";
import type { QuestId } from "../content/quests";
import { physicalDamage, specialDamage } from "./combat";
import {
  createRingGear,
  createTridentGear,
  treasureGearSlot,
  type GearItem,
} from "./gear";
import { formatWholeAmount } from "./numbers";
import { MATERIAL_META, type MaterialId } from "./items";
import { POTION_META, type PotionId } from "./potions";
import type { PortalType, Position, Stats, WeaponAbilityId } from "./types";
import { WEAPON_SKILLS, weaponSkill } from "./weapon-skills";
import { playerBasicAttackVisual } from "./attack-visuals";
import {
  hazardAvoidChance,
  rollGold,
} from "./adventure/economy";
import {
  adventureEnemyDefinition,
  adventureEnemyName,
  adventureEnemyStats,
  enemyKindForAdventure,
  materialForAdventureEnemy as materialForEnemy,
} from "./adventure/enemies";
import {
  spinLotteryWheel,
} from "./adventure/lottery";
import {
  DIRECTION_OFFSETS,
  adventureZoneForPosition,
  centerPosition,
  isAdjacent,
  isOnRoom,
  inwardPosition,
  manhattanDistance as manhattanRoomDistance,
  neighbors,
  oppositeDirection,
  positionKey,
  positionsEqual,
  roomKey,
} from "./adventure/geometry";
import {
  allNonWallTilesReachable,
  nearestFreePlayerPosition,
  repairRoomConnectivity,
} from "./adventure/pathfinding";
import { STAMINA_ACTIONS_PER_POINT } from "./adventure/constants";
import { createRoomRandom } from "./adventure/dungeonSeed";
import { cloneAdventureForRoom, cloneDungeonRoom } from "./adventure/state";
import {
  createTowerExteriorDungeonRoom,
  generateRoom,
} from "./adventure/roomGeneration";
import {
  ensureDungeonFrontier,
  repairAdventureFrontier,
} from "./adventure/exitPlanning";
import {
  adventurePlayerActorId,
  beginNextAdventureTurn,
  initializeAdventureTimeline,
} from "./adventure/turnTimeline";
import {
  resolveForgeArenaIfCleared,
  resolveLotteryRoomIfCleared,
  updateForgeArenaWaitingBoundary,
  updateLockedRoomBoundary,
  updateStateLockedRoomBoundary,
} from "./adventure/encounterLocks";
import { currentAdventureRoom } from "./adventure/creation";
import {
  beginCartographerSurvey,
  cartographerSurveyReady,
  recordCartographerVisit,
} from "./adventure/cartographer";
import { finishAdventureAction } from "./adventure/actionTimeline";
import {
  openHammerVaultGate,
  openMermanThroneDoor,
  releaseShopkeeperIfCleared,
  releaseWormIfCleared,
  rescueSpiderCount,
  revealHammerChestIfCleared,
  revealTridentChest,
} from "./adventure/objectiveResolution";
import {
  clearEnemyFootprint,
  enemyCanEnter,
  enemyFootprint,
  enemyWithoutUnderlyingTerrain,
  facingFromOffset,
  facingToward,
  findTiles,
  horizontalFacing,
  indefiniteArticle,
  isInAdventureWeaponSkillRange,
  isInEnemyAttackRange,
  isInPlayerAttackRange,
  isInWeaponThrowRange,
  laserEndBeforeWall,
  revealTrapGroup,
  setEnemyFootprintHp,
  setEnemyFootprintParalysis,
  setEnemySpriteFacing,
  shamanRingTeleportPosition,
  terrainUnderEnemy,
  trapDamage,
  trapIsActive,
  twoTileFootprint,
} from "./adventure/combatRules";
import type {
  AdventureEnemyKind,
  AdventureEnemyTurnResult,
  AdventureExplorerPosition,
  AdventureMoveResult,
  AdventureState,
  AdventureTile,
  DungeonRoom,
  ExitDirection,
  RandomSource,
} from "./adventure/types";

export type {
  AdventureEnemyKind,
  AdventureEnemyTurnResult,
  AdventureExit,
  AdventureExplorerPosition,
  AdventureMoveResult,
  AdventureQuestTarget,
  AdventureState,
  AdventureStrategyContext,
  AdventureTile,
  AdventureTileKind,
  DungeonRoom,
  DungeonTheme,
  EarthAdventureOptions,
  ExitDirection,
  RandomSource,
  WaterAdventureOptions,
} from "./adventure/types";
export {
  adventureEnemyName,
  adventureEnemyStats,
  enemyKindForAdventure,
  enemyKindForRing,
  materialForAdventureEnemy,
  rollEnemyKindForRoom,
} from "./adventure/enemies";
export {
  fireBeamIsActive,
  isInAdventureWeaponSkillRange,
  isInWeaponThrowRange,
} from "./adventure/combatRules";
export { suggestAdventureMove } from "./adventure/autoStrategy";
export {
  addAdventureExplorer,
  chooseOfferingStats,
  createAdventureHeadings,
  currentAdventureRoom,
  startAdventure,
  startForgeAdventure,
  startWaterAdventure,
} from "./adventure/creation";
export {
  generationChances,
  hazardAvoidChance,
  rollGold,
  treasureRoomChance,
  waterPortalSpawnChance,
} from "./adventure/economy";
export { lotteryEnemyPool } from "./adventure/lottery";
export {
  adventureZoneForPosition,
  directionLabel,
  ringForPosition,
} from "./adventure/geometry";
export { allNonWallTilesReachable } from "./adventure/pathfinding";
export {
  chooseExitDirections,
  hasViableUnexploredFrontier,
  repairAdventureFrontier,
  rollRoomExitCount,
} from "./adventure/exitPlanning";
export {
  adventurePartyTurnPreview,
  adventurePlayerActorId,
  adventureTurnPreview,
  isAdventurePlayerTurn,
  refreshAdventureTimeline,
} from "./adventure/turnTimeline";
export { settleDiceRoomRoll } from "./adventure/encounterLocks";
export { beginCartographerSurvey, cartographerSurveyReady, recordCartographerVisit, revealChalkArea } from "./adventure/cartographer";
export {
  activateHammerQuestAtBlacksmith,
  activateMinerQuestAtBlacksmith,
} from "./adventure/questRouting";

export { ADVENTURE_KNIGHT_ID, STAMINA_ACTIONS_PER_POINT } from "./adventure/constants";


export function shouldPauseAutoForOfferingEntry(
  sourceRoom: DungeonRoom,
  destinationRoom: DungeonRoom,
): boolean {
  return sourceRoom.kind !== "offering"
    && sourceRoom.kind !== "mermanThrone"
    && destinationRoom.kind === "offering"
    && !destinationRoom.offeringDoorOpened;
}

export function moveInAdventure(
  state: AdventureState,
  destination: Position,
  playerStats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  random: RandomSource = Math.random,
  otherExplorers: AdventureExplorerPosition[] = [],
  weaponThrowUnlocked = false,
  hasTrident = false,
  hasShamanRing = false,
  weaponAbilityId?: WeaponAbilityId,
  requireFullPartyForForgePortal = true,
  hasTowerKey = false,
  attackMode: "automatic" | "basic" | "secondary" = "automatic",
): AdventureMoveResult {
  state = repairAdventureFrontier(state);
  if (currentStamina.lte(0)) {
    return failedMove(state, currentHp, currentStamina, "No stamina remains.");
  }
  const playerActorId = adventurePlayerActorId(state.playerId);
  if (state.activeActorId !== playerActorId) {
    return failedMove(state, currentHp, currentStamina, "Wait for the active enemy to act.");
  }
  if (state.playerMustPass) {
    return failedMove(state, currentHp, currentStamina, `${state.playerName} must recover after throwing a weapon.`);
  }
  const room = currentAdventureRoom(state);
  if (otherExplorers.some((explorer) =>
    explorer.roomKey === room.key && positionsEqual(explorer.position, destination)
  )) {
    return failedMove(state, currentHp, currentStamina, "Another party member occupies that tile.");
  }
  if (!isOnRoom(room, destination)) {
    return failedMove(state, currentHp, currentStamina, "Choose a tile inside the room.");
  }

  const tile = room.tiles[destination.y][destination.x];
  if (attackMode === "secondary" && tile.kind !== "enemy") {
    return failedMove(state, currentHp, currentStamina, "Choose an enemy for the weapon's secondary attack.");
  }
  const returnPortalType: PortalType | null = state.dungeonTheme === "water" && tile.kind === "waterPortal"
    ? "water"
    : state.dungeonTheme === "forge" && tile.kind === "forgePortal"
      ? "forge"
      : null;
  const returnPortalReady = returnPortalType === null || otherExplorers.every((explorer) => {
    const explorerRoom = state.rooms[explorer.roomKey];
    const explorerTile = explorerRoom?.tiles[explorer.position.y]?.[explorer.position.x];
    return explorerRoom?.key === room.key
      && explorerTile?.kind === `${returnPortalType}Portal`;
  });
  const forgePortalReady = tile.kind !== "forgePortal"
    || !requireFullPartyForForgePortal
    || otherExplorers.every((explorer) => {
      const explorerRoom = state.rooms[explorer.roomKey];
      return explorerRoom?.tiles[explorer.position.y]?.[explorer.position.x]?.kind === "forgePortal";
    });
  if (
    (
      tile.kind === "towerDoor"
      || tile.kind === "shopkeeper"
      || tile.kind === "rodKeeper"
      || tile.kind === "lostItemChest"
    )
    && isAdjacent(state.playerPosition, destination)
  ) {
    const next = cloneAdventureForRoom(state, room.key);
    const firstTowerVisit = tile.kind === "towerDoor";
    const unlockedGreatTower = tile.kind === "towerDoor" && hasTowerKey;
    const completedShopkeeperQuest = tile.kind === "shopkeeper"
      && next.questTarget?.questId === "rescue-shopkeeper";
    const completedFishingRodQuest = (tile.kind === "rodKeeper" || tile.kind === "lostItemChest")
      && (
        next.questTarget?.questId === "retrieve-lost-item"
        // The marked route ends at the Water Dungeon portal. The portal dungeon
        // deliberately has no earth-map quest target of its own; its one-time
        // lost-item room is the authoritative marker for Rodney's interaction.
        || (next.dungeonTheme === "water" && next.lostItemRoomNumber !== null)
      );
    if (completedShopkeeperQuest) next.questTarget = null;
    if (completedFishingRodQuest) next.questTarget = null;
    next.log = [
      unlockedGreatTower
        ? "The Tower Key turns. The Great Tower opens! A horrible wind escapes, ruins your hair, and whispers your full legal name. This feels legally significant."
        : firstTowerVisit
          ? "The Tower is locked."
        : completedShopkeeperQuest
          ? "The Shopkeeper is free! The Shop is now open. You saved his life, so he rewards you with the sacred privilege of paying full price."
        : completedFishingRodQuest
          ? "Rodney offers the Fishing Rod. He refuses to explain why he was waiting here or where he intends to go next."
          : "Spoke with the Shopkeeper.",
      ...next.log,
    ].slice(0, 8);
    const completed = finishAdventureAction(next, playerActorId, playerStats);
    return {
      state: completed,
      hp: currentHp,
      stamina: currentStamina,
      goldGained: new Decimal(0),
      gearFound: null,
      died: false,
      exhausted: false,
      unlockedShopkeeper: tile.kind === "shopkeeper",
      completedQuestId: completedShopkeeperQuest
        ? "rescue-shopkeeper"
        : completedFishingRodQuest
          ? "retrieve-lost-item"
          : undefined,
      discoveredTowerDoor: firstTowerVisit,
      unlockedGreatTower,
    };
  }
  if ((tile.kind === "cartographer" || tile.kind === "angler") && isAdjacent(state.playerPosition, destination)) {
    let next = cloneAdventureForRoom(state, room.key);
    let completedCartographerSurvey = false;
    if (tile.kind === "cartographer") {
      if (cartographerSurveyReady(next)) {
        completedCartographerSurvey = true;
        next.cartographerSurveyTargets = [];
        next.cartographerSurveyVisited = [];
        next.cartographerSurveyPaths = [];
        next.cartographerQuestActive = false;
        next.log = ["Survey complete. Obtained one Mapmaker's Chalk.", ...next.log].slice(0, 8);
      } else {
        next = beginCartographerSurvey(next);
      }
    } else {
      next.log = ["Spoke with the Angler.", ...next.log].slice(0, 8);
    }
    return {
      state: finishAdventureAction(next, playerActorId, playerStats),
      hp: currentHp,
      stamina: currentStamina,
      goldGained: new Decimal(0),
      gearFound: null,
      died: false,
      exhausted: false,
      completedCartographerSurvey,
    };
  }
  if (
    tile.kind === "wall"
    || tile.kind === "cage"
    || tile.kind === "lostItemChest"
    || tile.kind === "rodKeeper"
    || tile.kind === "shopkeeperCage"
    || tile.kind === "blacksmithForge"
    || tile.kind === "blacksmithAnvil"
    || tile.kind === "blacksmithWorkbench"
    || tile.kind === "blacksmithToolRack"
    || tile.kind === "blacksmithSupplies"
    || tile.kind === "potionCauldron"
    || tile.kind === "potionShelf"
    || tile.kind === "potionTable"
    || tile.kind === "cartographer"
    || tile.kind === "mapTable"
    || tile.kind === "angler"
    || tile.kind === "anglerNet"
    || tile.kind === "diceDisplay"
    || tile.kind === "gardenTree"
    || tile.kind === "gardenFountain"
    || tile.kind === "gardenStatue"
    || tile.kind === "gardenWater"
    || tile.kind === "gardenFlowers"
    || tile.kind === "gardenBench"
    || tile.kind === "towerWall"
    || tile.kind === "towerDoor"
    || tile.kind === "shopkeeper"
    || tile.kind === "forgeGate"
    || tile.kind === "caveRock"
    || tile.kind === "caveGem"
    || tile.kind === "lotteryGate"
    || tile.kind === "diceGate"
    || tile.kind === "clayGate"
    || tile.kind === "clayBoulder"
    || (tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier))
  ) {
    return failedMove(
      state,
      currentHp,
      currentStamina,
      tile.kind === "cage" || tile.kind === "shopkeeperCage"
        ? "The locked cage blocks that tile."
        : tile.kind === "lotteryGate"
          ? "The Lottery room gate is sealed until its prize is resolved."
        : tile.kind === "diceGate"
          ? "The Dice room gate is sealed until someone rolls at the center pedestal."
        : tile.kind === "woodenDoor"
          ? "The sealed wooden door blocks that tile."
          : "A wall blocks that tile.",
    );
  }

  if (tile.kind === "enemy") {
    const equippedSkill = weaponSkill(weaponAbilityId);
    const secondaryReady = Boolean(
      weaponAbilityId
      && (weaponAbilityId !== "trident-throw" || weaponThrowUnlocked)
      && (state.weaponCooldownRemaining ?? 0) <= 0
      && isInAdventureWeaponSkillRange(state, room, destination, weaponAbilityId, hasTrident)
    );
    if (attackMode !== "basic" && secondaryReady) {
      if (weaponAbilityId === "trident-throw") {
        return throwAdventureWeapon(state, room, destination, playerStats, currentHp, currentStamina, hasTrident);
      }
      return castAdventureWeaponSkill(
        state,
        room,
        destination,
        playerStats,
        currentHp,
        currentStamina,
        weaponAbilityId!,
      );
    }
    if (attackMode === "secondary") {
      if (!equippedSkill) {
        return failedMove(state, currentHp, currentStamina, "No secondary weapon attack is equipped.");
      }
      if (equippedSkill.id === "trident-throw" && (!weaponThrowUnlocked || !hasTrident)) {
        return failedMove(state, currentHp, currentStamina, "Weapon Throw has not been unlocked.");
      }
      if ((state.weaponCooldownRemaining ?? 0) > 0) {
        const turns = state.weaponCooldownRemaining ?? 0;
        return failedMove(
          state,
          currentHp,
          currentStamina,
          `${equippedSkill.name} is ready in ${turns} turn${turns === 1 ? "" : "s"}.`,
        );
      }
      return failedMove(state, currentHp, currentStamina, `${equippedSkill.name} cannot reach that tile.`);
    }
    if (!isInPlayerAttackRange(state, room, destination)) {
      if (
        attackMode === "automatic"
        && weaponThrowUnlocked
        && hasTrident
        && isInWeaponThrowRange(state, room, destination, hasTrident)
      ) {
        return throwAdventureWeapon(state, room, destination, playerStats, currentHp, currentStamina, hasTrident);
      }
      return failedMove(state, currentHp, currentStamina, `${state.playerName} cannot attack that tile with a basic attack.`);
    }
    return attackAdventureEnemy(state, room, destination, playerStats, currentHp, currentStamina);
  }

  if (!isAdjacent(state.playerPosition, destination)) {
    return failedMove(state, currentHp, currentStamina, "Move to one adjacent tile.");
  }

  if (
    tile.kind === "woodenDoor"
    && tile.doorOpen
    && !tile.bossBarrier
    && tile.doorPart === 2
    && tile.doorDirection
  ) {
    return enterExit(
      state,
      room,
      tile.doorDirection,
      playerStats,
      currentHp,
      currentStamina,
      random,
      otherExplorers,
    );
  }

  if (tile.kind === "exit" && tile.exitDirection) {
    return enterExit(
      state,
      room,
      tile.exitDirection,
      playerStats,
      currentHp,
      currentStamina,
      random,
      otherExplorers,
    );
  }

  const next = cloneAdventureForRoom(state, room.key);
  next.lastProjectile = null;
  next.lastImpact = [];
  next.lastAttackVisual = null;
  next.lastAttackOrigin = null;
  const nextRoom = currentAdventureRoom(next);
  const interactingWithBlacksmith = tile.kind === "blacksmith";
  const interactingWithMiner = tile.kind === "miner";
  const interactingWithPotionmaster = tile.kind === "potionmaster";
  const interactingWithOddityBrewer = tile.kind === "oddityBrewer";
  if (!interactingWithBlacksmith && !interactingWithMiner && !interactingWithPotionmaster && !interactingWithOddityBrewer) {
    next.playerFacing = horizontalFacing(
      state.playerPosition,
      destination,
      state.playerFacing ?? "right",
    );
    next.playerPosition = { ...destination };
    next.steps += 1;
  }
  let hp = currentHp;
  let goldGained = new Decimal(0);
  let gearFound: GearItem | null = null;
  let potionFound: PotionId | null = null;
  let completedTridentTrial = false;
  let unlockedShopkeeper = false;
  let unlockedBlacksmith = false;
  let recoveredHammer = false;
  let returnedHammer = false;
  let diceCurseRoll: number | undefined;
  let completedQuestId: QuestId | undefined;
  let logMessage: string | null = null;
  let staminaActions = 1;
  let usedRegen = false;

  if (tile.kind === "gold") {
    goldGained = tile.goldAmount ?? rollGold(playerStats.luck, room.ring, random);
    logMessage = `Obtained ${formatWholeAmount(goldGained)} gold.`;
    nextRoom.tiles[destination.y][destination.x] = { kind: "floor" };
    if (resolveLotteryRoomIfCleared(next, nextRoom)) {
      logMessage += " That was the last prize, and every gate opened! Gambling has been solved forever. Close the casinos.";
    }
  } else if (tile.kind === "treasureChest" && tile.mimicDisguise) {
    const mimicId = `mimic-${room.key}`;
    next.playerPosition = { ...state.playerPosition };
    next.steps = Math.max(0, next.steps - 1);
    nextRoom.tiles[destination.y][destination.x] = {
      kind: "enemy",
      enemyId: mimicId,
      enemyKind: "mimic",
      enemyHp: adventureEnemyStats(room.ring, "mimic").hp,
    };
    logMessage = "The treasure chest grows teeth and bites at you. It's a Mimic! You saw the teeth, clicked anyway, and have only greed to blame.";
  } else if (tile.kind === "treasureChest") {
    if (tile.potionId) {
      potionFound = tile.potionId;
      logMessage = `Obtained ${POTION_META[potionFound].name}.`;
    } else {
      const slot = tile.gearSlot ?? treasureGearSlot(room.position.x, room.position.y, room.ring);
      gearFound = createRingGear(
        slot,
        room.ring,
        `${room.key}-${room.number}`,
        state.completedBattleNumbers ?? [],
      );
      logMessage = `Obtained ${gearFound.name}.`;
    }
    nextRoom.tiles[destination.y][destination.x] = { kind: "openedChest" };
  } else if (tile.kind === "tridentChest") {
    gearFound = createTridentGear();
    completedTridentTrial = true;
    logMessage = "Obtained the Tidecaller Trident! The door opens because the royal weapon was also the doorknob. Merman security has peaked.";
    nextRoom.tiles[destination.y][destination.x] = { kind: "openedChest" };
    openMermanThroneDoor(nextRoom);
  } else if (tile.kind === "portal") {
    logMessage = `${state.playerName} stepped onto the teleport platform.`;
  } else if (tile.kind === "waterPortal") {
    logMessage = returnPortalType === "water"
      ? returnPortalReady
        ? `${state.playerName} activated the return portal.`
        : `${state.playerName} waits on the return portal for the rest of the expedition.`
      : `${state.playerName} entered the Water Dungeon portal.`;
  } else if (tile.kind === "forgePortal") {
    logMessage = returnPortalType === "forge"
      ? returnPortalReady
        ? `${state.playerName} activated the return portal.`
        : `${state.playerName} waits on the return portal for the rest of the expedition.`
      : forgePortalReady
        ? `${state.playerName} entered The Forge portal.`
        : `${state.playerName} waits on The Forge portal for the rest of the expedition.`;
  } else if (
    tile.kind === "lotteryWheel"
    && tile.lotteryPartX === 1
    && tile.lotteryPartY === 1
    && room.kind === "lottery"
    && !room.lotterySpun
  ) {
    logMessage = spinLotteryWheel(
      nextRoom,
      playerStats.luck,
      state.completedBattleNumbers ?? [],
      random,
    );
  } else if (tile.kind === "dicePedestal" && room.kind === "dice" && !room.diceRolled) {
    const firstDie = 1 + Math.floor(Math.max(0, Math.min(0.999999, random())) * 6);
    const secondDie = 1 + Math.floor(Math.max(0, Math.min(0.999999, random())) * 6);
    diceCurseRoll = firstDie + secondDie;
    nextRoom.diceRolled = true;
    nextRoom.diceRolling = true;
    nextRoom.diceValue = diceCurseRoll;
    nextRoom.diceValues = [firstDie, secondDie];
    diceCurseRoll = undefined;
    logMessage = "The giant dice start rolling and every gate slams shut. Surely the room-sized cursed dice covered in skulls are the NICE kind.";
  } else if (tile.kind === "blacksmith") {
    unlockedBlacksmith = true;
    if (next.hammerRecovered) {
      returnedHammer = true;
      next.hammerRecovered = false;
      logMessage = "Returned the stolen Hammer to the Blacksmith.";
    } else if (next.hammerQuestPurchased && !next.questTarget) {
      logMessage = "The Blacksmith is waiting for his stolen Hammer.";
    } else {
      logMessage = "Spoke with the Blacksmith.";
    }
  } else if (tile.kind === "miner") {
    if (next.questTarget?.questId === "find-miner") {
      next.questTarget = null;
      completedQuestId = "find-miner";
      logMessage = `${state.playerName} gave the Pickaxe to the Miner. He joined the party before you finished speaking and licked the point to check if it was real.`;
    } else {
      logMessage = "Spoke with the Miner.";
    }
  } else if (tile.kind === "potionmaster") {
    logMessage = "Spoke with the Lost Potionmaster.";
  } else if (tile.kind === "oddityBrewer") {
    logMessage = "Spoke with Charles.";
  } else if (tile.kind === "hammerChest") {
    nextRoom.tiles[destination.y][destination.x] = { kind: "openedChest" };
    next.hammerRecovered = true;
    next.questTarget = null;
    recoveredHammer = true;
    openHammerVaultGate(nextRoom);
    updateStateLockedRoomBoundary(next, nextRoom.key, "clayGate", false);
    logMessage = "Obtained the Blacksmith's Hammer! The clay gate opens. It recognizes the Hammer as legally re-stolen and respects property law.";
  } else if (tile.kind === "forgeBlueprintChest") {
    nextRoom.tiles[destination.y][destination.x] = { kind: "openedChest" };
    next.forgeBlueprintTarget = null;
    logMessage = "Obtained the Blacksmith's Blueprints! The edges are burnt, the middle is wet, and page four is an anatomically ambitious butt. The numbers survived.";
  } else if (tile.kind === "trap") {
    revealTrapGroup(nextRoom, tile);
    if (!trapIsActive(nextRoom, tile)) {
      logMessage = "Crossed while the fire beam was dormant.";
    } else if (random() < hazardAvoidChance(playerStats.luck, room.ring)) {
      logMessage = tile.trapStyle === "fire-beam"
        ? "Avoided an active fire beam."
        : "Avoided hidden spikes.";
    } else {
      const teleportPosition = hasShamanRing
        ? shamanRingTeleportPosition(
            nextRoom,
            next.playerPosition,
            otherExplorers
              .filter((explorer) => explorer.roomKey === room.key)
              .map((explorer) => explorer.position),
            random,
          )
        : null;
        if (teleportPosition) {
          next.playerPosition = teleportPosition;
          logMessage = tile.trapStyle === "fire-beam"
          ? `A wall-to-wall fire beam erupted. Shaman's Ring teleported ${state.playerName} to safety.`
          : `Hidden spikes appeared. Shaman's Ring teleported ${state.playerName} to safety.`;
      } else {
        const damage = trapDamage(room.ring);
        hp = Decimal.max(0, hp.sub(damage));
        staminaActions += 1;
        logMessage = tile.trapStyle === "fire-beam"
          ? `A wall-to-wall fire beam dealt ${formatWholeAmount(damage)} damage.`
          : `Hidden spikes dealt ${formatWholeAmount(damage)} damage.`;
      }
    }
  } else if (tile.kind === "regen" && !nextRoom.regenUsedBy.includes(playerActorId)) {
    nextRoom.regenUsedBy = [...nextRoom.regenUsedBy, playerActorId];
    usedRegen = true;
  }

  const completed = finishAdventureAction(next, playerActorId, playerStats);
  const staminaResult = applyStaminaActions(completed, currentStamina, staminaActions);
  let finalStamina = staminaResult.stamina;
  if (usedRegen) {
    const beforeRegen = finalStamina;
    const springRestore = hotSpringStaminaRestore(room.ring);
    finalStamina = Decimal.min(playerStats.stamina, finalStamina.add(springRestore));
    const restored = finalStamina.sub(beforeRegen);
    logMessage = restored.gt(0)
      ? `The hot spring restored ${formatWholeAmount(restored)} stamina.`
      : `${state.playerName} used the hot spring at full stamina.`;
  }
  if (logMessage) staminaResult.state.log = [logMessage, ...staminaResult.state.log].slice(0, 8);
  return {
    state: staminaResult.state,
    hp,
    stamina: finalStamina,
    goldGained,
    gearFound,
    potionFound,
    died: hp.lte(0),
    exhausted: finalStamina.lte(0),
    completedQuestId,
    enteredPortalType: returnPortalType
      ? undefined
      : tile.kind === "waterPortal"
      ? "water"
      : tile.kind === "forgePortal"
        ? forgePortalReady ? "forge" : undefined
        : undefined,
    returnedPortalType: returnPortalType && returnPortalReady ? returnPortalType : undefined,
    completedTridentTrial,
    unlockedShopkeeper,
    unlockedBlacksmith,
    recoveredHammer,
    returnedHammer,
    recoveredForgeBlueprints: tile.kind === "forgeBlueprintChest",
    diceCurseRoll,
  };
}

export function hotSpringStaminaRestore(ring: number): number {
  const restoreByDepth = [0, 15, 30, 50, 75] as const;
  return restoreByDepth[Math.min(4, Math.max(1, Math.floor(ring)))] ?? 15;
}

export function passAdventureTurn(
  state: AdventureState,
  playerStats: Stats,
): AdventureState {
  state = repairAdventureFrontier(state);
  const playerActorId = adventurePlayerActorId(state.playerId);
  if (state.activeActorId !== playerActorId) return state;

  return finishAdventureAction({
    ...state,
    playerMustPass: false,
    lastProjectile: null,
    lastImpact: [],
    lastAttackVisual: null,
    lastAttackOrigin: null,
    log: [...state.log],
  }, playerActorId, playerStats);
}

export function openOfferingChamber(
  state: AdventureState,
  _playerStats: Stats,
): AdventureState {
  const room = currentAdventureRoom(state);
  if (room.kind !== "offering") return state;
  const next = cloneAdventureForRoom(state, room.key);
  const nextRoom = currentAdventureRoom(next);
  const openingNow = !nextRoom.offeringDoorOpened;
  if (openingNow) {
    nextRoom.offeringDoorOpened = true;
    for (const row of nextRoom.tiles) {
      for (const tile of row) {
        if (tile.kind === "woodenDoor") {
          tile.doorOpen = true;
          tile.bossBarrier = false;
        }
      }
    }
  }
  next.shrineSolved = true;
  if (openingNow) {
    next.log = [
      "All four offerings resonate. The great wooden door opens, proving fish can solve architecture if arranged judgmentally.",
      ...next.log,
    ].slice(0, 8);
  }
  // Solving the shrine is an interaction, not a combat turn. Preserve the
  // current actor and readiness clocks so the player can immediately step off
  // the final offering tile and walk through the newly opened doorway.
  return next;
}


function enterExit(
  state: AdventureState,
  room: DungeonRoom,
  direction: ExitDirection,
  playerStats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  random: RandomSource,
  otherExplorers: AdventureExplorerPosition[],
): AdventureMoveResult {
  const offset = DIRECTION_OFFSETS[direction];
  const frontierPosition = { x: room.position.x + offset.x, y: room.position.y + offset.y };
  const towerAlreadyDiscovered = Object.values(state.rooms).some(
    (candidate) => candidate.kind === "towerExterior",
  );
  const crossingZoneFiveThreshold = room.kind !== "towerExterior"
    && (state.dungeonTheme ?? "earth") === "earth"
    && (state.completedBattleNumbers ?? []).includes(9)
    && adventureZoneForPosition(frontierPosition, state.completedBattleNumbers, "earth") === 5;
  const enteringTowerExterior = crossingZoneFiveThreshold && !towerAlreadyDiscovered;
  const returningFromTowerExterior = room.kind === "towerExterior"
    && room.exits.some((exit) => exit.direction === direction)
    && Boolean(state.towerReturnRoomKey && state.rooms[state.towerReturnRoomKey]);
  const key = enteringTowerExterior
    ? roomKey(frontierPosition)
    : returningFromTowerExterior
      ? state.towerReturnRoomKey!
      : roomKey(frontierPosition);
  const position = enteringTowerExterior
    ? frontierPosition
    : returningFromTowerExterior
      ? state.rooms[key].position
      : frontierPosition;
  let destinationRoom = state.rooms[key];
  const exploredNewRoom = !destinationRoom;
  let rooms = state.rooms;
  let logMessage: string | null = null;
  if (!destinationRoom) {
    const roomRandom = state.dungeonSeed === undefined
      ? random
      : createRoomRandom(state.dungeonSeed, position, state.dungeonTheme ?? "earth");
    const completedBattlesForGeneration = crossingZoneFiveThreshold && towerAlreadyDiscovered
      ? (state.completedBattleNumbers ?? []).filter((battle) => battle !== 9)
      : state.completedBattleNumbers ?? [];
    destinationRoom = enteringTowerExterior
      ? createTowerExteriorDungeonRoom(
          Object.keys(state.rooms).length + 1,
          frontierPosition,
          oppositeDirection(direction),
        )
      : generateRoom(
          Object.keys(state.rooms).length + 1,
          position,
          oppositeDirection(direction),
          state.rooms,
          playerStats.luck,
          roomRandom,
          state.questTarget,
          state.dungeonTheme ?? "earth",
          state.lostItemRoomNumber ?? null,
          state.offeringRoomNumber ?? null,
          state.shrineSolved ?? false,
          state.waterPortalEnabled ?? false,
          state.shopkeeperRoomNumber ?? null,
          state.offeringStats ?? [],
          completedBattlesForGeneration,
          state.blacksmithRoomNumber ?? null,
          state.potionmasterRoomNumber ?? null,
          state.forgeArenasCleared ?? 0,
          state.forgeBlueprintTarget ?? null,
          state.forgePortalEnabled ?? false,
          state.forgeBlueprintObjectiveEnabled ?? true,
          state.cartographerRoomNumber ?? null,
          state.anglerRoomNumber ?? null,
          state.oddityBrewerRoomNumber ?? null,
        );
    rooms = { ...state.rooms, [key]: destinationRoom };
    logMessage = destinationRoom.kind === "rescue"
      ? "Found the marked rescue room. There is a Worm in a cage and seven Spiders licking lips they DO NOT HAVE. This is already too moist."
      : destinationRoom.kind === "portal"
        ? "Found the marked teleport room. Put everybody on the glowing floor and count heads afterward. Count your own head first."
      : destinationRoom.kind === "lostItem"
        ? "Found a damp stranger clutching the Fishing Rod. He has been waiting here without food, luggage, or a second facial expression."
      : destinationRoom.kind === "offering"
        ? "Found a sealed offering chamber. Four colored floor tiles demand four specific fish. The floor has dietary needs and no mouth. Do not encourage it."
      : destinationRoom.kind === "mermanThrone"
        ? "Entered the water throne room. The door slams shut and three Mermen throw royal cutlery at your organs. Audience granted!"
      : destinationRoom.kind === "treasure"
        ? "Found a treasure room! The chest looks normal. It has normal hinges, normal wood, and a normal amount of barely concealed breathing."
      : destinationRoom.kind === "regen"
        ? "Found a hot spring! It is either magical healing water or an enormous warm monster mistake. GET IN."
      : destinationRoom.kind === "shopkeeper"
        ? "Found a stranger in a cage! Three Skeletons guard him while he hugs a bucket and refuses to explain the bucket. Rescue everything except the bucket."
      : destinationRoom.kind === "blacksmith"
        ? "Found a Blacksmith in the clay tunnels! He is turning wet dirt into armor by hitting it harder than the laws of materials science can object."
      : destinationRoom.kind === "hammerVault"
        ? "Entered the stolen-Hammer vault. The clay gate slams shut. The Mummies clutch the Hammer like it contains the last television remote on Earth."
      : destinationRoom.kind === "miner"
        ? "Found the Miner! He is surrounded by gems and has mined none of them because his current Pickaxe is one forehead. Bring the real Pickaxe."
      : destinationRoom.kind === "waterPortal"
        ? "Found a Water Dungeon portal. It glows blue, drips upward, and makes the exact noise your bathtub should never make. Enter it!"
      : destinationRoom.kind === "forgePortal"
        ? state.questTarget?.questId === "enter-tower"
          ? "Found the marked Forge portal. Your eyebrows curl toward it like two frightened caterpillars attempting escape."
          : "Found a Forge portal. The other side appears to be ALL FIRE plus several smaller, angrier fires. Neat!"
      : destinationRoom.kind === "lottery"
        ? "Entered a Lottery room! The gates lock behind you. Spin the wheel and win GOLD or MURDER—the two traditional prize categories!"
      : destinationRoom.kind === "dice"
        ? "Entered a Dice room. The gates lock. Roll the enormous skull dice! Their previous owner is spread evenly across the grout."
      : destinationRoom.kind === "potionmaster"
        ? "Found a Lost Potionmaster! Every bottle is purple. One is breathing. Another stopped breathing when it noticed you noticing."
      : destinationRoom.kind === "oddityBrewer"
        ? "Found Charles. He is stirring something chunky with a boot. He has a cleaner boot nearby and deliberately chose this one."
      : destinationRoom.kind === "cartographer"
        ? "Found a Cartographer! His map has three holes where geography should be and a beautiful self-portrait where the key should be."
      : destinationRoom.kind === "angler"
        ? "Found an Angler's shack in the Water Dungeon. It smells like fish, bait, and the bucket the Shopkeeper told you not to look at."
      : destinationRoom.kind === "towerExterior"
        ? "The tunnels open into a garden beneath the Great Tower. DAYLIGHT attacks your dungeon eyes for emotional damage. No red number appears."
      : destinationRoom.kind === "forgeArena"
        ? "Found a Forge arena. The furnaces politely wait for the whole party because fire wants nobody excluded from the screaming."
      : destinationRoom.kind === "forgeTreasure"
        ? "Found a Forge vault. A recipe is drawn on the floor in soot and one red substance we are filing under soot. Remember the pattern! Hah."
      : destinationRoom.kind === "forgeBlueprint"
        ? "Found the Blueprints beyond the third arena! One more room full of hot little jerks stands between you and advanced garbage arrangement."
      : null;
  } else {
    destinationRoom = cloneDungeonRoom(destinationRoom);
    rooms = { ...state.rooms, [key]: destinationRoom };
  }

  if (destinationRoom.kind !== "towerExterior") {
    rooms = ensureDungeonFrontier(
      rooms,
      key,
      state.questTarget,
      state.chalkMappedExits,
      state.cartographerSurveyPaths,
    );
  }
  destinationRoom = rooms[key] ?? destinationRoom;

  const entranceDirection = returningFromTowerExterior
    ? state.towerReturnExitDirection ?? oppositeDirection(direction)
    : oppositeDirection(direction);

  let forgeArenaStarted = false;
  if (
    destinationRoom.kind === "forgeArena"
    && !destinationRoom.forgeArenaStarted
    && !destinationRoom.forgeArenaResolved
  ) {
    const arenaEntranceDirection = destinationRoom.forgeArenaEntranceDirection ?? entranceDirection;
    if (destinationRoom.forgeArenaEntranceDirection !== arenaEntranceDirection) {
      destinationRoom = {
        ...cloneDungeonRoom(destinationRoom),
        forgeArenaEntranceDirection: arenaEntranceDirection,
      };
      rooms = { ...rooms, [key]: destinationRoom };
    }
    rooms = updateForgeArenaWaitingBoundary(rooms, key, arenaEntranceDirection);
    destinationRoom = rooms[key];
  }
  if (
    destinationRoom.kind === "forgeArena"
    && !destinationRoom.forgeArenaStarted
    && !destinationRoom.forgeArenaResolved
    && otherExplorers.every((explorer) => explorer.roomKey === key)
  ) {
    destinationRoom = cloneDungeonRoom(destinationRoom);
    sealForgeArena(destinationRoom.tiles, destinationRoom.exits);
    spawnForgeArenaEnemies(
      destinationRoom.tiles,
      destinationRoom.key,
      destinationRoom.forgeArenaOrdinal ?? (state.forgeArenasCleared ?? 0) + 1,
      random,
    );
    destinationRoom.forgeArenaStarted = true;
    rooms = { ...rooms, [key]: destinationRoom };
    forgeArenaStarted = true;
    logMessage = "The full expedition assembled. The gates slam shut and four Forgelings jump out. It is ALWAYS four because five failed the fire-code inspection.";
  }

  const boundaryGate = destinationRoom.kind === "lottery" && !destinationRoom.lotteryResolved
    ? "lotteryGate"
    : destinationRoom.kind === "dice" && (!destinationRoom.diceRolled || destinationRoom.diceRolling)
      ? "diceGate"
      : destinationRoom.kind === "hammerVault" && !state.hammerRecovered
        ? "clayGate"
        : destinationRoom.kind === "forgeArena" && destinationRoom.forgeArenaStarted && !destinationRoom.forgeArenaResolved
          ? "forgeGate"
          : null;
  if (boundaryGate) {
    rooms = updateLockedRoomBoundary(rooms, key, boundaryGate, true);
    destinationRoom = rooms[key];
  }

  const entrance = enteringTowerExterior
    ? destinationRoom.exits[0]
    : destinationRoom.exits.find((exit) => exit.direction === entranceDirection);
  const preferredPosition = enteringTowerExterior
    ? { x: Math.floor(TOWER_EXTERIOR_SIZE / 2), y: TOWER_EXTERIOR_SIZE - 2 }
    : entrance
    ? inwardPosition(entrance.position, entrance.direction)
    : centerPosition(destinationRoom);
  const occupiedPositions = otherExplorers
    .filter((explorer) => explorer.roomKey === key)
    .map((explorer) => explorer.position);
  const playerPosition = nearestFreePlayerPosition(
    destinationRoom,
    preferredPosition,
    occupiedPositions,
  );

  const reservedBlueprintTarget = !(state.forgeBlueprintObjectiveEnabled ?? true)
    ? null
    : destinationRoom.kind === "forgeArena" && destinationRoom.forgeBlueprintDirection
      ? {
          x: destinationRoom.position.x + DIRECTION_OFFSETS[destinationRoom.forgeBlueprintDirection].x,
          y: destinationRoom.position.y + DIRECTION_OFFSETS[destinationRoom.forgeBlueprintDirection].y,
        }
      : state.forgeBlueprintTarget ?? null;
  let destinationState = initializeAdventureTimeline({
    dungeonSeed: state.dungeonSeed,
    playerId: state.playerId,
    playerName: state.playerName,
    currentRoomKey: key,
    previousRoomKey: room.key,
    rooms,
    playerPosition,
    playerFacing: horizontalFacing(
      state.playerPosition,
      {
        x: state.playerPosition.x + offset.x,
        y: state.playerPosition.y + offset.y,
      },
      state.playerFacing ?? "right",
    ),
    steps: state.steps + 1,
    staminaActionProgress: state.staminaActionProgress,
    log: logMessage ? [logMessage, ...state.log].slice(0, 8) : [...state.log],
    activeActorId: null,
    readyAt: {},
    questTarget: state.questTarget,
    dungeonTheme: state.dungeonTheme ?? "earth",
    lostItemRoomNumber: state.lostItemRoomNumber ?? null,
    offeringRoomNumber: state.offeringRoomNumber ?? null,
    waterPortalEnabled: state.waterPortalEnabled ?? false,
    forgePortalEnabled: state.forgePortalEnabled ?? false,
    shopkeeperRoomNumber: state.shopkeeperRoomNumber ?? null,
    blacksmithRoomNumber: state.blacksmithRoomNumber ?? null,
    potionmasterRoomNumber: state.potionmasterRoomNumber ?? null,
    oddityBrewerRoomNumber: state.oddityBrewerRoomNumber ?? null,
    cartographerRoomNumber: state.cartographerRoomNumber ?? null,
    anglerRoomNumber: state.anglerRoomNumber ?? null,
    cartographerSurveyTargets: [...(state.cartographerSurveyTargets ?? [])],
    cartographerSurveyVisited: [...(state.cartographerSurveyVisited ?? [])],
    cartographerSurveyPaths: (state.cartographerSurveyPaths ?? []).map((path) => path.map((pathPosition) => ({ ...pathPosition }))),
    cartographerQuestActive: state.cartographerQuestActive ?? false,
    chalkRevealedPositions: [...(state.chalkRevealedPositions ?? [])],
    chalkMappedExits: Object.fromEntries(Object.entries(state.chalkMappedExits ?? {}).map(([mappedKey, exits]) => [mappedKey, [...exits]])),
    hammerQuestPurchased: state.hammerQuestPurchased ?? false,
    hammerRecovered: state.hammerRecovered ?? false,
    shrineSolved: state.shrineSolved ?? false,
    offeringStats: [...(state.offeringStats ?? [])],
    playerMustPass: state.playerMustPass ?? false,
    lastProjectile: null,
    lastImpact: [],
    completedBattleNumbers: [...(state.completedBattleNumbers ?? [])],
    forgeArenasCleared: state.forgeArenasCleared ?? 0,
    forgeBlueprintTarget: reservedBlueprintTarget,
    forgeBlueprintObjectiveEnabled: state.forgeBlueprintObjectiveEnabled ?? true,
    towerReturnRoomKey: enteringTowerExterior
      ? room.key
      : returningFromTowerExterior
        ? null
        : state.towerReturnRoomKey ?? null,
    towerReturnExitDirection: enteringTowerExterior
      ? direction
      : returningFromTowerExterior
        ? null
        : state.towerReturnExitDirection ?? null,
  }, playerStats);
  destinationState = recordCartographerVisit(destinationState, destinationRoom.position);
  const staminaResult = applyStaminaActions(destinationState, currentStamina, 1);
  return {
    state: staminaResult.state,
    hp: currentHp,
    stamina: staminaResult.stamina,
    goldGained: new Decimal(0),
    gearFound: null,
    died: false,
    exhausted: staminaResult.stamina.lte(0),
    completedQuestId: undefined,
    exploredNewRoom,
    forgeArenaStarted,
  };
}

export function repairAdventureRoomConnectivity(state: AdventureState): AdventureState {
  const room = currentAdventureRoom(state);
  if (allNonWallTilesReachable(room, state.playerPosition)) return state;
  const next = cloneAdventureForRoom(state, room.key);
  repairRoomConnectivity(currentAdventureRoom(next), next.playerPosition);
  return next;
}

export function performAdventureEnemyTurn(
  state: AdventureState,
  playerStats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  otherExplorerPositions: Position[] = [],
  hasShamanRing = false,
  random: RandomSource = Math.random,
  hasSuctionCups = false,
  mysteryDodgeChance = 0,
): AdventureEnemyTurnResult {
  const actorId = state.activeActorId;
  if (!actorId || actorId === adventurePlayerActorId(state.playerId)) {
    return {
      state,
      hp: currentHp,
      stamina: currentStamina,
      died: currentHp.lte(0),
      exhausted: currentStamina.lte(0),
    };
  }

  const room = currentAdventureRoom(state);
  let enemyPosition = findEnemyById(room, actorId);
  if (!enemyPosition) {
    const readyAt = { ...state.readyAt };
    delete readyAt[actorId];
    return {
      state: beginNextAdventureTurn({ ...state, readyAt }, playerStats),
      hp: currentHp,
      stamina: currentStamina,
      died: currentHp.lte(0),
      exhausted: currentStamina.lte(0),
    };
  }

  const next = cloneAdventureForRoom(state, room.key);
  next.lastProjectile = null;
  next.lastImpact = [];
  next.lastAttackVisual = null;
  next.lastAttackOrigin = null;
  const nextRoom = currentAdventureRoom(next);
  let enemyTile = nextRoom.tiles[enemyPosition.y][enemyPosition.x];
  const enemyKind = enemyTile.enemyKind ?? enemyKindForAdventure(state, room);
  const enemyName = adventureEnemyName(enemyKind);
  const enemyDefinition = adventureEnemyDefinition(enemyKind);
  if ((enemyTile.enemyParalyzedTurns ?? 0) > 0) {
    setEnemyFootprintParalysis(
      nextRoom,
      enemyTile.enemyId,
      enemyPosition,
      Math.max(0, (enemyTile.enemyParalyzedTurns ?? 0) - 1),
    );
    next.log = [`${enemyName} is paralyzed by Suction Cups and loses its turn.`, ...next.log].slice(0, 8);
    const completed = finishAdventureAction(next, actorId, playerStats);
    return {
      state: completed,
      hp: currentHp,
      stamina: currentStamina,
      died: currentHp.lte(0),
      exhausted: currentStamina.lte(0),
    };
  }
  setEnemySpriteFacing(
    nextRoom,
    enemyTile.enemyId,
    enemyPosition,
    horizontalFacing(
      enemyPosition,
      state.playerPosition,
      enemyTile.spriteFacing ?? "left",
    ),
  );
  enemyTile = nextRoom.tiles[enemyPosition.y][enemyPosition.x];
  let hp = currentHp;
  let logMessage: string | null = null;
  let staminaActions = 0;
  const mysteryDodges = () => {
    const chance = Math.max(0, Math.min(1, mysteryDodgeChance));
    return chance > 0 && random() < chance;
  };

  if (enemyKind === "fire-alligator") {
    orientTwoTileEnemyToward(
      nextRoom,
      enemyTile.enemyId!,
      state.playerPosition,
      [...otherExplorerPositions, state.playerPosition],
    );
    enemyPosition = findEnemyById(nextRoom, actorId) ?? enemyPosition;
    enemyTile = nextRoom.tiles[enemyPosition.y][enemyPosition.x];
    const footprint = enemyFootprint(nextRoom, enemyTile.enemyId, enemyPosition);
    const attackFrom = footprint.find((position) =>
      isInEnemyAttackRange(nextRoom, position, state.playerPosition, 3)
    );
    const stats = adventureEnemyStats(room.ring, enemyKind);
    if (attackFrom) {
      const damage = specialDamage(stats.spAttack, playerStats.spDefense);
      next.lastProjectile = {
        from: { ...attackFrom },
        to: { ...state.playerPosition },
        kind: "fire",
      };
      const dodged = mysteryDodges();
      const teleportPosition = !dodged && hasShamanRing
        ? shamanRingTeleportPosition(nextRoom, state.playerPosition, otherExplorerPositions, random)
        : null;
      if (dodged) {
        logMessage = `${state.playerName} dodges ${enemyName}'s Magma Breath with Mystery Potion.`;
      } else if (teleportPosition) {
        next.playerPosition = teleportPosition;
        logMessage = `Shaman's Ring teleports ${state.playerName} away from ${enemyName}'s Magma Breath.`;
      } else {
        hp = Decimal.max(0, hp.sub(damage));
        staminaActions = 1;
        logMessage = `${enemyName} uses Magma Breath for ${formatWholeAmount(damage)} special damage.`;
      }
    } else {
      const movement = moveFootprintEnemyTowardPlayer(
        nextRoom,
        enemyTile.enemyId!,
        state.playerPosition,
        otherExplorerPositions,
      );
      if (movement.trap && trapIsActive(nextRoom, movement.trap)) {
        revealTrapGroup(nextRoom, movement.trap);
        const damage = trapDamage(room.ring);
        const remainingHp = Decimal.max(0, (enemyTile.enemyHp ?? stats.hp).sub(damage));
        if (remainingHp.lte(0)) {
          clearEnemyFootprint(nextRoom, enemyTile.enemyId, movement.anchor ?? enemyPosition);
          delete next.readyAt[actorId];
          logMessage = `${enemyName} walks into a fire beam for ${formatWholeAmount(damage)} damage and dies.`;
        } else {
          setEnemyFootprintHp(nextRoom, enemyTile.enemyId, movement.anchor ?? enemyPosition, remainingHp);
          logMessage = `${enemyName} walks into a fire beam for ${formatWholeAmount(damage)} damage.`;
        }
      } else if (movement.trap) {
        revealTrapGroup(nextRoom, movement.trap);
        logMessage = `${enemyName} crosses while the fire beam is dormant.`;
      }
    }
  } else if (enemyKind === "alligator") {
    orientTwoTileEnemyToward(
      nextRoom,
      enemyTile.enemyId!,
      state.playerPosition,
      [...otherExplorerPositions, state.playerPosition],
    );
    enemyPosition = findEnemyById(nextRoom, actorId) ?? enemyPosition;
    enemyTile = nextRoom.tiles[enemyPosition.y][enemyPosition.x];
    const footprint = enemyFootprint(nextRoom, enemyTile.enemyId, enemyPosition);
    const canSnap = footprint.some((position) =>
      Math.max(
        Math.abs(position.x - state.playerPosition.x),
        Math.abs(position.y - state.playerPosition.y),
      ) === 1
    );
    if (canSnap) {
      const stats = adventureEnemyStats(room.ring, enemyKind);
      const damage = physicalDamage(stats.attack, playerStats.defense);
      const dodged = mysteryDodges();
      const teleportPosition = !dodged && hasShamanRing
        ? shamanRingTeleportPosition(nextRoom, state.playerPosition, otherExplorerPositions, random)
        : null;
      if (dodged) {
        logMessage = `${state.playerName} dodges ${enemyName}'s Wide Snap with Mystery Potion.`;
      } else if (teleportPosition) {
        next.playerPosition = teleportPosition;
        logMessage = `Shaman's Ring teleports ${state.playerName} away from ${enemyName}'s Wide Snap.`;
      } else {
        hp = Decimal.max(0, hp.sub(damage));
        staminaActions = 1;
        logMessage = `${enemyName} uses Wide Snap on ${state.playerName} for ${formatWholeAmount(damage)} damage.`;
      }
    } else {
      moveFootprintEnemyTowardPlayer(
        nextRoom,
        enemyTile.enemyId!,
        state.playerPosition,
        otherExplorerPositions,
      );
    }
  } else if (enemyKind === "mummy") {
    const footprint = enemyFootprint(nextRoom, enemyTile.enemyId, enemyPosition);
    const attackFrom = footprint.find((position) =>
      isInEnemyAttackRange(
        nextRoom,
        position,
        state.playerPosition,
        enemyDefinition.attackRange ?? 5,
        "eight-way",
      )
    );
    const adjacentFrom = footprint.find((position) =>
      Math.max(
        Math.abs(position.x - state.playerPosition.x),
        Math.abs(position.y - state.playerPosition.y),
      ) === 1
    );
    const stats = adventureEnemyStats(room.ring, enemyKind);
    if (adjacentFrom) {
      const damage = physicalDamage(stats.attack, playerStats.defense);
      if (mysteryDodges()) {
        logMessage = `${state.playerName} dodges ${enemyName}'s strike with Mystery Potion.`;
      } else {
        hp = Decimal.max(0, hp.sub(damage));
        staminaActions = 1;
        logMessage = `${enemyName} strikes diagonally for ${formatWholeAmount(damage)} damage.`;
      }
    } else if (attackFrom) {
      const damage = specialDamage(stats.spAttack, playerStats.spDefense);
      const impact = plusImpactPositions(nextRoom, state.playerPosition);
      breakClayBoulders(nextRoom, impact);
      next.lastImpact = impact;
      next.lastProjectile = {
        from: { ...attackFrom },
        to: { ...state.playerPosition },
        kind: "mummy",
      };
      if (mysteryDodges()) {
        logMessage = `${state.playerName} dodges ${enemyName}'s Burial Burst with Mystery Potion.`;
      } else {
        hp = Decimal.max(0, hp.sub(damage));
        staminaActions = 1;
        logMessage = `${enemyName} launches Burial Burst for ${formatWholeAmount(damage)} special damage.`;
      }
    } else if (random() < 0.3) {
      const fallen = spawnClayBoulders(nextRoom, state.playerPosition, random);
      logMessage = fallen > 0
        ? `${enemyName} shakes the vault and ${fallen} clay boulders fall.`
        : `${enemyName} shakes the vault, but no clay boulders can fall.`;
    } else {
      moveMummyTowardPlayer(nextRoom, enemyTile.enemyId!, state.playerPosition, otherExplorerPositions);
    }
  } else if (enemyKind === "merman" && enemyTile.enemyMustPass) {
    nextRoom.tiles[enemyPosition.y][enemyPosition.x] = { ...enemyTile, enemyMustPass: false };
    logMessage = `${enemyName} retrieves its trident and passes.`;
  } else if (
    enemyKind === "merman"
    && !isAdjacent(enemyPosition, state.playerPosition)
    && isInEnemyAttackRange(nextRoom, enemyPosition, state.playerPosition, 99)
  ) {
    const stats = adventureEnemyStats(room.ring, enemyKind);
    const damage = physicalDamage(stats.attack.mul(1.35), playerStats.defense);
    nextRoom.tiles[enemyPosition.y][enemyPosition.x] = {
      ...enemyTile,
      enemyMustPass: true,
    };
    next.lastProjectile = {
      from: { ...enemyPosition },
      to: laserEndBeforeWall(nextRoom, enemyPosition, state.playerPosition),
      kind: "trident",
    };
    const dodged = mysteryDodges();
    const teleportPosition = !dodged && hasShamanRing
      ? shamanRingTeleportPosition(nextRoom, state.playerPosition, otherExplorerPositions, random)
      : null;
    if (dodged) {
      logMessage = `${state.playerName} dodges ${enemyName}'s thrown Trident with Mystery Potion.`;
    } else if (teleportPosition) {
      next.playerPosition = teleportPosition;
      logMessage = `Shaman's Ring teleports ${state.playerName} away from ${enemyName}'s thrown Trident.`;
    } else {
      hp = Decimal.max(0, hp.sub(damage));
      staminaActions = 1;
      logMessage = `${enemyName} throws its Trident at ${state.playerName} for ${formatWholeAmount(damage)} damage.`;
    }
  } else if (isInEnemyAttackRange(
    nextRoom,
    enemyPosition,
    state.playerPosition,
    enemyKind === "merman" ? 1 : enemyDefinition.attackRange ?? 1,
    enemyDefinition.attackPattern === "eight-way" ? "eight-way" : "orthogonal",
  )) {
    const stats = adventureEnemyStats(room.ring, enemyKind);
    const damage = (enemyDefinition.attackType ?? "physical") === "special"
      ? specialDamage(stats.spAttack, playerStats.spDefense)
      : physicalDamage(stats.attack, playerStats.defense);
    nextRoom.tiles[enemyPosition.y][enemyPosition.x] = {
      ...enemyTile,
    };
    next.lastProjectile = enemyKind === "clay-golem"
      ? {
          from: { ...enemyPosition },
          to: laserEndBeforeWall(nextRoom, enemyPosition, state.playerPosition),
          kind: "laser",
        }
      : (enemyDefinition.attackRange ?? 1) > 1
      ? { from: { ...enemyPosition }, to: { ...state.playerPosition } }
      : null;
    if (enemyKind === "bellows-forgeling") {
      next.lastImpact = plusImpactPositions(nextRoom, state.playerPosition);
      next.lastProjectile = { from: { ...enemyPosition }, to: { ...state.playerPosition }, kind: "fire" };
    } else if (enemyKind === "hammer-forgeling") {
      next.lastImpact = [state.playerPosition, ...neighbors(state.playerPosition)]
        .filter((position) => isOnRoom(nextRoom, position));
    }
    const dodged = mysteryDodges();
    const teleportPosition = !dodged && hasShamanRing
      ? shamanRingTeleportPosition(nextRoom, state.playerPosition, otherExplorerPositions, random)
      : null;
    if (dodged) {
      logMessage = `${state.playerName} dodges ${enemyName}'s attack with Mystery Potion.`;
    } else if (teleportPosition) {
      next.playerPosition = teleportPosition;
      logMessage = `Shaman's Ring teleports ${state.playerName} away from ${enemyName}'s attack.`;
    } else {
      hp = Decimal.max(0, hp.sub(damage));
      staminaActions = 1;
      if (enemyKind === "chain-forgeling") {
        const pull = {
          x: state.playerPosition.x + Math.sign(enemyPosition.x - state.playerPosition.x),
          y: state.playerPosition.y + Math.sign(enemyPosition.y - state.playerPosition.y),
        };
        const pullTile = nextRoom.tiles[pull.y]?.[pull.x];
        if (
          pullTile
          && ["floor", "trap", "regen"].includes(pullTile.kind)
          && !otherExplorerPositions.some((position) => positionsEqual(position, pull))
        ) next.playerPosition = pull;
        logMessage = `${enemyName} hooks ${state.playerName} for ${formatWholeAmount(damage)} damage and pulls them closer.`;
      } else if (enemyKind === "bellows-forgeling") {
        logMessage = `${enemyName} uses Cinder Burst for ${formatWholeAmount(damage)} special damage.`;
      } else if (enemyKind === "hammer-forgeling") {
        logMessage = `${enemyName} uses Anvil Drop for ${formatWholeAmount(damage)} damage.`;
      } else logMessage = enemyKind === "merman"
        ? `${enemyName} jabs ${state.playerName} for ${formatWholeAmount(damage)} damage.`
        : `${enemyName} uses ${enemyDefinition.attackName ?? "Attack"} on ${state.playerName} for ${formatWholeAmount(damage)} damage.`;
    }
  } else {
    const occupied = new Set([
      ...findTiles(nextRoom, "enemy").map(positionKey),
      ...otherExplorerPositions.map(positionKey),
    ]);
    const destination = enemyStepTowardPlayer(
      nextRoom,
      enemyPosition,
      state.playerPosition,
      occupied,
    );
    if (destination) {
      const destinationTile = nextRoom.tiles[destination.y][destination.x];
      const movingEnemy = {
        ...enemyWithoutUnderlyingTerrain(enemyTile),
        spriteFacing: horizontalFacing(
          enemyPosition,
          destination,
          enemyTile.spriteFacing ?? "left",
        ),
      };
      nextRoom.tiles[enemyPosition.y][enemyPosition.x] = terrainUnderEnemy(enemyTile);
      if (destinationTile.kind === "trap" && trapIsActive(nextRoom, destinationTile)) {
        const damage = trapDamage(room.ring);
        revealTrapGroup(nextRoom, destinationTile);
        const spikeDescription = destinationTile.trapStyle === "fire-beam"
          ? "a fire beam"
          : destinationTile.revealed ? "spikes" : "hidden spikes";
        const remainingHp = Decimal.max(
          0,
          (enemyTile.enemyHp ?? adventureEnemyStats(room.ring, enemyKind).hp).sub(damage),
        );
        if (remainingHp.lte(0)) {
          nextRoom.tiles[destination.y][destination.x] = { ...destinationTile, revealed: true };
          logMessage = `${enemyName} stepped on ${spikeDescription} for ${formatWholeAmount(damage)} damage and dies.`;
        } else {
          nextRoom.tiles[destination.y][destination.x] = {
            ...movingEnemy,
            enemyHp: remainingHp,
            underlyingKind: "trap",
            underlyingTrapRevealed: true,
            underlyingTrapStyle: destinationTile.trapStyle,
            underlyingTrapGroupId: destinationTile.trapGroupId,
            underlyingTrapGroupIds: destinationTile.trapGroupIds,
            underlyingTrapBeamDirection: destinationTile.trapBeamDirection,
          };
          logMessage = `${enemyName} stepped on ${spikeDescription} for ${formatWholeAmount(damage)} damage.`;
        }
      } else if (destinationTile.kind === "trap") {
        revealTrapGroup(nextRoom, destinationTile);
        nextRoom.tiles[destination.y][destination.x] = {
          ...movingEnemy,
          underlyingKind: "trap",
          underlyingTrapRevealed: true,
          underlyingTrapStyle: destinationTile.trapStyle,
          underlyingTrapGroupId: destinationTile.trapGroupId,
          underlyingTrapGroupIds: destinationTile.trapGroupIds,
          underlyingTrapBeamDirection: destinationTile.trapBeamDirection,
        };
        logMessage = `${enemyName} crosses while the fire beam is dormant.`;
      } else if (destinationTile.kind === "regen") {
        nextRoom.tiles[destination.y][destination.x] = {
          ...movingEnemy,
          underlyingKind: "regen",
          underlyingRegenPartX: destinationTile.regenPartX,
          underlyingRegenPartY: destinationTile.regenPartY,
        };
      } else {
        nextRoom.tiles[destination.y][destination.x] = movingEnemy;
      }
    }
  }

  if (releaseShopkeeperIfCleared(nextRoom)) {
    logMessage = "The final Skeleton falls and the Shopkeeper's cage opened! Apparently the lock was powered by Skeletons and/or narrative convenience.";
  }
  if (
    hp.lt(currentHp)
    && hp.gt(0)
    && hasSuctionCups
    && !enemyDefinition.isRaidBoss
    && random() < 0.15
  ) {
    const currentEnemyPosition = findEnemyById(nextRoom, actorId) ?? enemyPosition;
    setEnemyFootprintParalysis(nextRoom, actorId, currentEnemyPosition, 1);
    logMessage = `${logMessage ?? `${enemyName} attacks.`} Suction Cups paralyze ${enemyName} for its next turn.`;
  }
  if (logMessage) next.log = [logMessage, ...next.log].slice(0, 8);
  const completed = finishAdventureAction(next, actorId, playerStats);
  const staminaResult = applyStaminaActions(completed, currentStamina, staminaActions);
  return {
    state: staminaResult.state,
    hp,
    stamina: staminaResult.stamina,
    died: hp.lte(0),
    exhausted: staminaResult.stamina.lte(0),
  };
}

function attackAdventureEnemy(
  state: AdventureState,
  room: DungeonRoom,
  target: Position,
  playerStats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
): AdventureMoveResult {
  const next = cloneAdventureForRoom(state, room.key);
  next.lastProjectile = null;
  const nextRoom = currentAdventureRoom(next);
  const tile = nextRoom.tiles[target.y][target.x];
  next.playerFacing = horizontalFacing(
    state.playerPosition,
    target,
    state.playerFacing ?? "right",
  );
  const enemyKind = tile.enemyKind ?? enemyKindForAdventure(state, room);
  const enemyStats = adventureEnemyStats(room.ring, enemyKind);
  const enemyName = adventureEnemyName(enemyKind);
  const enemyArticle = indefiniteArticle(enemyName);
  const player = getPlayer(state.playerId);
  const attackVisual = playerBasicAttackVisual(state.playerId);
  next.lastAttackVisual = attackVisual;
  next.lastAttackOrigin = { ...state.playerPosition };
  next.lastImpact = [{ ...target }];
  next.lastProjectile = attackVisual === "worm-acid"
    ? { from: { ...state.playerPosition }, to: { ...target }, kind: "acid" }
    : null;
  const damage = (player.attackType ?? "physical") === "special"
    ? specialDamage(playerStats.spAttack, enemyStats.spDefense)
    : physicalDamage(playerStats.attack, enemyStats.defense);
  const remainingHp = Decimal.max(0, (tile.enemyHp ?? enemyStats.hp).sub(damage));
  const materialGained = remainingHp.lte(0) ? materialForEnemy(enemyKind) : null;
  const tridentTrialCompleted = false;
  const gearFound: GearItem | null = null;
  let completedQuestId: QuestId | undefined;
  let logMessage: string;
  let forgeArenaOpened = false;

  if (remainingHp.lte(0)) {
    clearEnemyFootprint(nextRoom, tile.enemyId, target);
    if (tile.enemyId) delete next.readyAt[tile.enemyId];
    if (tile.enemyKind === "spider" && nextRoom.kind === "rescue") {
      const spidersRemaining = rescueSpiderCount(nextRoom);
      if (releaseWormIfCleared(nextRoom)) {
        next.questTarget = null;
        completedQuestId = "rescue-me";
        logMessage = `${state.playerName} defeats the final Spider. Recruited Worm! He is slimy, grateful, and already inside the Party tab getting mucus on the margins.`;
      } else {
        logMessage = `${state.playerName} defeats a Spider. ${spidersRemaining} guard${spidersRemaining === 1 ? " remains" : "s remain"}. Worm screams tactical advice consisting entirely of MORE STABBING.`;
      }
    } else if (materialGained) {
      logMessage = `${state.playerName} defeats ${enemyArticle} ${enemyName}. Obtained ${MATERIAL_META[materialGained].name}.`;
    } else {
      logMessage = `${state.playerName} defeats ${enemyArticle} ${enemyName}.`;
    }
    if (enemyKind === "merman" && findTiles(nextRoom, "enemy").every((position) =>
      nextRoom.tiles[position.y][position.x].enemyKind !== "merman"
    )) {
      revealTridentChest(nextRoom);
      logMessage = "Defeated the final Merman. A treasure chest appears! It was not there before. The room insists it was. Gaslighting chest acquired.";
    }
    if (releaseShopkeeperIfCleared(nextRoom)) {
      logMessage = "Defeated the final Skeleton. The Shopkeeper's cage opened! Skeleton-powered lock confirmed. Engineering accreditation revoked.";
    }
    if (revealHammerChestIfCleared(nextRoom)) {
      logMessage = "Defeated the final Clay Mummy. The Hammer chest appears! It was behind the UI the whole time, where game objects go to smoke.";
    }
    if (resolveLotteryRoomIfCleared(next, nextRoom)) {
      logMessage += " The last summoned enemy falls and every gate opens. You won at gambling by killing the gambling. Financial advice!";
    }
    forgeArenaOpened = resolveForgeArenaIfCleared(next, nextRoom);
    if (forgeArenaOpened) {
      logMessage += " The final Forgeling falls and the arena gates open. The hot little freaks are gone, leaving four scorch marks and one tiny unpaid invoice!";
    }
  } else {
    setEnemyFootprintHp(nextRoom, tile.enemyId, target, remainingHp);
    logMessage = `${state.playerName} uses ${player.attackName ?? "Attack"} on ${enemyArticle} ${enemyName} for ${formatWholeAmount(damage)} damage.`;
  }
  next.log = [logMessage, ...next.log].slice(0, 8);

  const completed = finishAdventureAction(next, adventurePlayerActorId(state.playerId), playerStats);
  const staminaResult = applyStaminaActions(completed, currentStamina, 1);
  return {
    state: staminaResult.state,
    hp: currentHp,
    stamina: staminaResult.stamina,
    goldGained: new Decimal(0),
    gearFound,
    materialGained,
    defeatedEnemyId: remainingHp.lte(0) ? enemyKind : undefined,
    died: false,
    exhausted: staminaResult.stamina.lte(0),
    completedQuestId,
    completedTridentTrial: tridentTrialCompleted,
    forgeArenaCleared: forgeArenaOpened,
  };
}

function castAdventureWeaponSkill(
  state: AdventureState,
  room: DungeonRoom,
  target: Position,
  playerStats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  weaponAbilityId: WeaponAbilityId,
): AdventureMoveResult {
  const skill = weaponSkill(weaponAbilityId);
  if (!skill || skill.id === "trident-throw") {
    return failedMove(state, currentHp, currentStamina, "No weapon technique is equipped.");
  }
  const next = cloneAdventureForRoom(state, room.key);
  const nextRoom = currentAdventureRoom(next);
  const area = adventureWeaponSkillArea(next.playerPosition, target, skill.area)
    .filter((position) => isOnRoom(nextRoom, position));
  const enemies = new Map<string, { position: Position; tile: AdventureTile }>();
  for (const position of area) {
    const tile = nextRoom.tiles[position.y]?.[position.x];
    if (tile?.kind !== "enemy") continue;
    const id = tile.enemyId ?? `${position.x},${position.y}`;
    if (!enemies.has(id)) enemies.set(id, { position, tile });
  }
  if (enemies.size === 0) {
    return failedMove(state, currentHp, currentStamina, `${skill.name} would not hit an enemy.`);
  }

  next.playerFacing = horizontalFacing(
    state.playerPosition,
    target,
    state.playerFacing ?? "right",
  );
  next.lastImpact = area;
  next.lastAttackVisual = skill.visual;
  next.lastAttackOrigin = { ...state.playerPosition };
  next.lastProjectile = skill.attackType === "special"
    ? {
        from: { ...state.playerPosition },
        to: { ...target },
        kind: skill.visual === "burst-orb" ? "burst" : "rapid",
      }
    : null;
  next.weaponCooldownRemaining = skill.cooldownTurns + 1;
  const defeatedKinds: AdventureEnemyKind[] = [];
  let firstMaterial: MaterialId | null = null;
  let totalDamage = new Decimal(0);
  for (const { position, tile } of enemies.values()) {
    const enemyKind = tile.enemyKind ?? enemyKindForAdventure(state, room);
    const enemyStats = adventureEnemyStats(room.ring, enemyKind);
    const damage = skill.attackType === "special"
      ? specialDamage(playerStats.spAttack.mul(skill.damageMultiplier), enemyStats.spDefense)
      : physicalDamage(playerStats.attack.mul(skill.damageMultiplier), enemyStats.defense);
    totalDamage = totalDamage.add(damage);
    const remainingHp = Decimal.max(0, (tile.enemyHp ?? enemyStats.hp).sub(damage));
    if (remainingHp.lte(0)) {
      clearEnemyFootprint(nextRoom, tile.enemyId, position);
      if (tile.enemyId) delete next.readyAt[tile.enemyId];
      defeatedKinds.push(enemyKind);
      firstMaterial ??= materialForEnemy(enemyKind);
    } else {
      setEnemyFootprintHp(nextRoom, tile.enemyId, position, remainingHp);
    }
  }

  let completedQuestId: QuestId | undefined;
  if (nextRoom.kind === "rescue" && releaseWormIfCleared(nextRoom)) {
    next.questTarget = null;
    completedQuestId = "rescue-me";
  }
  if (nextRoom.kind === "mermanThrone" && findTiles(nextRoom, "enemy").every((position) =>
    nextRoom.tiles[position.y][position.x].enemyKind !== "merman"
  )) revealTridentChest(nextRoom);
  releaseShopkeeperIfCleared(nextRoom);
  revealHammerChestIfCleared(nextRoom);
  const lotteryOpened = resolveLotteryRoomIfCleared(next, nextRoom);
  const forgeArenaOpened = resolveForgeArenaIfCleared(next, nextRoom);
  const defeated = defeatedKinds.length;
  const materialNote = firstMaterial ? ` Obtained ${MATERIAL_META[firstMaterial].name}.` : "";
  next.log = [
    completedQuestId === "rescue-me"
      ? `${state.playerName} uses ${skill.name} and defeats the final Spider. Recruited Worm! He climbs into the Party tab through a hole that was not there before.`
      : `${state.playerName} uses ${skill.name}, dealing ${formatWholeAmount(totalDamage)} total damage${defeated > 0 ? ` and defeating ${defeated} enem${defeated === 1 ? "y" : "ies"}` : ""}.${materialNote}${lotteryOpened ? " The last summon falls and the gates open." : ""}${forgeArenaOpened ? " The Forge arena gates open." : ""}`,
    ...next.log,
  ].slice(0, 8);
  const completed = finishAdventureAction(next, adventurePlayerActorId(state.playerId), playerStats);
  const staminaResult = applyStaminaActions(completed, currentStamina, 1);
  return {
    state: staminaResult.state,
    hp: currentHp,
    stamina: staminaResult.stamina,
    goldGained: new Decimal(0),
    gearFound: null,
    materialGained: firstMaterial,
    defeatedEnemyId: defeatedKinds[0],
    died: false,
    exhausted: staminaResult.stamina.lte(0),
    completedQuestId,
    forgeArenaCleared: forgeArenaOpened,
  };
}

function adventureWeaponSkillArea(
  origin: Position,
  target: Position,
  area: NonNullable<ReturnType<typeof weaponSkill>>["area"],
): Position[] {
  if (area === "single" || area === "trident") return [target];
  if (area === "impact-plus") {
    return [
      target,
      { x: target.x + 1, y: target.y },
      { x: target.x - 1, y: target.y },
      { x: target.x, y: target.y + 1 },
      { x: target.x, y: target.y - 1 },
    ];
  }
  if (area === "surround") {
    return Array.from({ length: 9 }, (_, index) => ({
      x: origin.x + index % 3 - 1,
      y: origin.y + Math.floor(index / 3) - 1,
    })).filter((position) => !positionsEqual(position, origin));
  }
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const direction = Math.abs(dx) >= Math.abs(dy)
    ? { x: Math.sign(dx) || 1, y: 0 }
    : { x: 0, y: Math.sign(dy) || 1 };
  const perpendicular = { x: -direction.y, y: direction.x };
  return [1, 2].flatMap((depth) => [-1, 0, 1].map((width) => ({
    x: origin.x + direction.x * depth + perpendicular.x * width,
    y: origin.y + direction.y * depth + perpendicular.y * width,
  })));
}

function throwAdventureWeapon(
  state: AdventureState,
  room: DungeonRoom,
  target: Position,
  playerStats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  hasTrident = false,
): AdventureMoveResult {
  const next = cloneAdventureForRoom(state, room.key);
  const nextRoom = currentAdventureRoom(next);
  const tile = nextRoom.tiles[target.y][target.x];
  next.playerFacing = horizontalFacing(
    state.playerPosition,
    target,
    state.playerFacing ?? "right",
  );
  const enemyKind = tile.enemyKind ?? enemyKindForAdventure(state, room);
  const enemyStats = adventureEnemyStats(room.ring, enemyKind);
  const throwSkill = WEAPON_SKILLS["trident-throw"];
  const damage = hasTrident
    ? specialDamage(playerStats.spAttack.mul(throwSkill.damageMultiplier), enemyStats.spDefense)
    : physicalDamage(playerStats.attack.mul(1.35), enemyStats.defense);
  const remainingHp = Decimal.max(0, (tile.enemyHp ?? enemyStats.hp).sub(damage));
  const materialGained = remainingHp.lte(0) ? materialForEnemy(enemyKind) : null;
  const enemyName = adventureEnemyName(enemyKind);
  next.lastProjectile = {
    from: { ...state.playerPosition },
    to: laserEndBeforeWall(nextRoom, state.playerPosition, target),
    kind: "trident",
  };
  next.lastImpact = [{ ...target }];
  next.lastAttackVisual = "trident-throw";
  next.lastAttackOrigin = { ...state.playerPosition };
  const gearFound: GearItem | null = null;
  const tridentTrialCompleted = false;
  let completedQuestId: QuestId | undefined;
  let lotteryOpened = false;
  let forgeArenaOpened = false;
  if (remainingHp.lte(0)) {
    clearEnemyFootprint(nextRoom, tile.enemyId, target);
    if (tile.enemyId) delete next.readyAt[tile.enemyId];
    if (enemyKind === "merman" && findTiles(nextRoom, "enemy").every((position) =>
      nextRoom.tiles[position.y][position.x].enemyKind !== "merman"
    )) {
      revealTridentChest(nextRoom);
    }
    if (enemyKind === "spider" && releaseWormIfCleared(nextRoom)) {
      next.questTarget = null;
      completedQuestId = "rescue-me";
    }
    releaseShopkeeperIfCleared(nextRoom);
    revealHammerChestIfCleared(nextRoom);
    lotteryOpened = resolveLotteryRoomIfCleared(next, nextRoom);
    forgeArenaOpened = resolveForgeArenaIfCleared(next, nextRoom);
  } else {
    setEnemyFootprintHp(nextRoom, tile.enemyId, target, remainingHp);
  }
  next.playerMustPass = true;
  // finishAdventureAction consumes the thrower's current turn immediately.
  next.weaponCooldownRemaining = throwSkill.cooldownTurns + 1;
  if (completedQuestId === "rescue-me") {
    next.log = [`${state.playerName} defeats the final Spider. Recruited Worm! You own zero Worm containers, so he will be loose in the menus.`, ...next.log].slice(0, 8);
  } else if (enemyKind === "merman" && remainingHp.lte(0) && nextRoom.tiles.flat().some((tile) => tile.kind === "tridentChest")) {
    next.log = ["Defeated the final Merman. A treasure chest appears in the throne room! No smoke, no mechanism, just aggressive furniture continuity.", ...next.log].slice(0, 8);
  } else if (lotteryOpened) {
    const materialNote = materialGained ? ` Obtained ${MATERIAL_META[materialGained].name}.` : "";
    next.log = [`${state.playerName} defeated ${enemyName} with ${hasTrident ? "Tidecaller Throw" : "Weapon Throw"}.${materialNote} The last summon falls and every gate opens.`, ...next.log].slice(0, 8);
  } else if (forgeArenaOpened) {
    const materialNote = materialGained ? ` Obtained ${MATERIAL_META[materialGained].name}.` : "";
    next.log = [`${state.playerName} defeated ${enemyName}.${materialNote} The Forge arena gates open.`, ...next.log].slice(0, 8);
  } else if (materialGained) {
    next.log = [`${state.playerName} defeated ${enemyName} with ${hasTrident ? "Tidecaller Throw" : "Weapon Throw"}. Obtained ${MATERIAL_META[materialGained].name}.`, ...next.log].slice(0, 8);
  } else if (remainingHp.lte(0)) {
    next.log = [`${state.playerName} defeated ${enemyName} with ${hasTrident ? "Tidecaller Throw" : "Weapon Throw"}. Next turn is spent retrieving the weapon.`, ...next.log].slice(0, 8);
  } else {
    next.log = [`${state.playerName} uses ${hasTrident ? "Tidecaller Throw" : "Weapon Throw"} on ${enemyName} for ${formatWholeAmount(damage)} damage. Next turn is spent retrieving the weapon.`, ...next.log].slice(0, 8);
  }
  const completed = finishAdventureAction(next, adventurePlayerActorId(state.playerId), playerStats);
  const staminaResult = applyStaminaActions(completed, currentStamina, 1);
  return {
    state: staminaResult.state,
    hp: currentHp,
    stamina: staminaResult.stamina,
    goldGained: new Decimal(0),
    gearFound,
    materialGained,
    defeatedEnemyId: remainingHp.lte(0) ? enemyKind : undefined,
    died: false,
    exhausted: staminaResult.stamina.lte(0),
    completedQuestId,
    completedTridentTrial: tridentTrialCompleted,
    forgeArenaCleared: forgeArenaOpened,
  };
}

function enemyStepTowardPlayer(
  room: DungeonRoom,
  start: Position,
  playerPosition: Position,
  occupied: Set<string>,
): Position | null {
  const queue: Array<{ position: Position; first: Position | null }> = [{ position: start, first: null }];
  const visited = new Set([positionKey(start)]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (positionsEqual(current.position, playerPosition)) return current.first;
    for (const next of neighbors(current.position)) {
      const key = positionKey(next);
      if (visited.has(key) || !isOnRoom(room, next)) continue;
      const isPlayer = positionsEqual(next, playerPosition);
      if (!isPlayer && (!enemyCanEnter(room.tiles[next.y][next.x]) || occupied.has(key))) continue;
      visited.add(key);
      queue.push({ position: next, first: current.first ?? next });
    }
  }
  return null;
}

function plusImpactPositions(room: DungeonRoom, center: Position): Position[] {
  return [center, ...neighbors(center)].filter((position) => isOnRoom(room, position));
}

function breakClayBoulders(room: DungeonRoom, positions: Position[]): void {
  for (const position of positions) {
    if (room.tiles[position.y]?.[position.x]?.kind === "clayBoulder") {
      room.tiles[position.y][position.x] = { kind: "floor" };
    }
  }
}

function spawnClayBoulders(
  room: DungeonRoom,
  playerPosition: Position,
  random: RandomSource,
): number {
  const candidates = findTiles(room, "floor")
    .filter((position) => !positionsEqual(position, playerPosition))
    .map((position) => ({ position, roll: random() }))
    .sort((a, b) => a.roll - b.roll);
  const count = Math.min(candidates.length, 2 + Math.floor(random() * 3));
  for (const { position } of candidates.slice(0, count)) {
    room.tiles[position.y][position.x] = { kind: "clayBoulder", boulderTurnsRemaining: 10 };
  }
  return count;
}


function moveMummyTowardPlayer(
  room: DungeonRoom,
  enemyId: string,
  playerPosition: Position,
  otherExplorerPositions: Position[],
): boolean {
  const footprint = enemyFootprint(room, enemyId, { x: 0, y: 0 });
  const anchor = footprint.find((position) => room.tiles[position.y][position.x].enemyPart === 0)
    ?? footprint[0];
  if (!anchor) return false;
  const occupied = new Set([
    ...findTiles(room, "enemy")
      .filter((position) => room.tiles[position.y][position.x].enemyId !== enemyId)
      .map(positionKey),
    ...otherExplorerPositions.map(positionKey),
    positionKey(playerPosition),
  ]);
  const footprintKeys = new Set(footprint.map(positionKey));
  const choices = neighbors(anchor).sort((a, b) =>
    manhattanRoomDistance(a, playerPosition) - manhattanRoomDistance(b, playerPosition)
  );
  for (const destinationAnchor of choices) {
    const offset = { x: destinationAnchor.x - anchor.x, y: destinationAnchor.y - anchor.y };
    const destinations = footprint.map((position) => ({
      x: position.x + offset.x,
      y: position.y + offset.y,
    }));
    if (destinations.some((position) =>
      !isOnRoom(room, position)
      || occupied.has(positionKey(position))
      || (
        !footprintKeys.has(positionKey(position))
        && !["floor", "clayBoulder"].includes(room.tiles[position.y][position.x].kind)
      )
    )) continue;
    const movingTiles = footprint.map((position) => ({
      ...room.tiles[position.y][position.x],
      spriteFacing: horizontalFacing(
        anchor,
        destinationAnchor,
        room.tiles[position.y][position.x].spriteFacing ?? "left",
      ),
    }));
    footprint.forEach((position) => { room.tiles[position.y][position.x] = { kind: "floor" }; });
    destinations.forEach((position, index) => { room.tiles[position.y][position.x] = movingTiles[index]; });
    return true;
  }
  return false;
}

function moveFootprintEnemyTowardPlayer(
  room: DungeonRoom,
  enemyId: string,
  playerPosition: Position,
  otherExplorerPositions: Position[],
): { moved: boolean; anchor?: Position; trap?: AdventureTile } {
  const footprint = enemyFootprint(room, enemyId, { x: 0, y: 0 })
    .sort((left, right) =>
      (room.tiles[left.y][left.x].enemyPart ?? 0) - (room.tiles[right.y][right.x].enemyPart ?? 0)
    );
  const anchor = footprint.find((position) => room.tiles[position.y][position.x].enemyPart === 0)
    ?? footprint[0];
  if (!anchor) return { moved: false };
  const footprintKeys = new Set(footprint.map(positionKey));
  const occupied = new Set([
    ...findTiles(room, "enemy")
      .filter((position) => room.tiles[position.y][position.x].enemyId !== enemyId)
      .map(positionKey),
    ...otherExplorerPositions.map(positionKey),
    positionKey(playerPosition),
  ]);
  const choices = neighbors(anchor).sort((left, right) =>
    manhattanRoomDistance(left, playerPosition) - manhattanRoomDistance(right, playerPosition)
  );
  for (const destinationAnchor of choices) {
    const offset = { x: destinationAnchor.x - anchor.x, y: destinationAnchor.y - anchor.y };
    const facing = facingFromOffset(offset);
    const destinations = footprint.length === 2
      ? twoTileFootprint(destinationAnchor, facing)
      : footprint.map((position) => ({
          x: position.x + offset.x,
          y: position.y + offset.y,
        }));
    if (destinations.some((position) => {
      if (!isOnRoom(room, position) || occupied.has(positionKey(position))) return true;
      if (footprintKeys.has(positionKey(position))) return false;
      return !["floor", "trap", "regen"].includes(room.tiles[position.y][position.x].kind);
    })) continue;

    const movingTiles = footprint.map((position) => ({
      ...enemyWithoutUnderlyingTerrain(room.tiles[position.y][position.x]),
      enemyFacing: facing,
      spriteFacing: horizontalFacing(
        anchor,
        destinationAnchor,
        room.tiles[position.y][position.x].spriteFacing ?? "left",
      ),
    }));
    const destinationTerrain = destinations.map((position) =>
      footprintKeys.has(positionKey(position))
        ? terrainUnderEnemy(room.tiles[position.y][position.x])
        : { ...room.tiles[position.y][position.x] }
    );
    footprint.forEach((position) => { room.tiles[position.y][position.x] = terrainUnderEnemy(room.tiles[position.y][position.x]); });
    destinations.forEach((position, index) => {
      const terrain = destinationTerrain[index];
      const moving = movingTiles[index];
      room.tiles[position.y][position.x] = terrain.kind === "trap"
        ? {
            ...moving,
            underlyingKind: "trap",
            underlyingTrapRevealed: terrain.revealed,
            underlyingTrapStyle: terrain.trapStyle,
            underlyingTrapGroupId: terrain.trapGroupId,
            underlyingTrapGroupIds: terrain.trapGroupIds,
            underlyingTrapBeamDirection: terrain.trapBeamDirection,
          }
        : terrain.kind === "regen"
          ? {
              ...moving,
              underlyingKind: "regen",
              underlyingRegenPartX: terrain.regenPartX,
              underlyingRegenPartY: terrain.regenPartY,
            }
          : moving;
    });
    return {
      moved: true,
      anchor: destinationAnchor,
      trap: destinationTerrain.find((tile) => tile.kind === "trap"),
    };
  }
  return { moved: false };
}

function orientTwoTileEnemyToward(
  room: DungeonRoom,
  enemyId: string,
  toward: Position,
  blockedPositions: Position[],
): void {
  const footprint = enemyFootprint(room, enemyId, { x: 0, y: 0 })
    .sort((left, right) =>
      (room.tiles[left.y][left.x].enemyPart ?? 0) - (room.tiles[right.y][right.x].enemyPart ?? 0)
    );
  if (footprint.length !== 2) return;
  const anchor = footprint.find((position) => room.tiles[position.y][position.x].enemyPart === 0)
    ?? footprint[0];
  if (!anchor) return;
  const facing = facingToward(anchor, toward);
  const destinations = twoTileFootprint(anchor, facing);
  const footprintKeys = new Set(footprint.map(positionKey));
  const blocked = new Set(blockedPositions.map(positionKey));
  const canOrient = destinations.every((position) =>
    isOnRoom(room, position)
    && !blocked.has(positionKey(position))
    && (
      footprintKeys.has(positionKey(position))
      || enemyCanEnter(room.tiles[position.y][position.x])
    )
  );
  if (!canOrient) {
    const currentHorizontal = footprint[0].y === footprint[1].y;
    const compatibleFacing = currentHorizontal
      ? toward.x < anchor.x ? "west" : "east"
      : toward.y < anchor.y ? "north" : "south";
    for (const position of footprint) {
      room.tiles[position.y][position.x] = {
        ...room.tiles[position.y][position.x],
        enemyFacing: compatibleFacing,
        spriteFacing: horizontalFacing(
          anchor,
          toward,
          room.tiles[position.y][position.x].spriteFacing ?? "left",
        ),
      };
    }
    return;
  }

  const movingTiles = footprint.map((position) => ({
    ...enemyWithoutUnderlyingTerrain(room.tiles[position.y][position.x]),
    enemyFacing: facing,
    spriteFacing: horizontalFacing(
      anchor,
      toward,
      room.tiles[position.y][position.x].spriteFacing ?? "left",
    ),
  }));
  const destinationTerrain = destinations.map((position) =>
    footprintKeys.has(positionKey(position))
      ? terrainUnderEnemy(room.tiles[position.y][position.x])
      : { ...room.tiles[position.y][position.x] }
  );
  footprint.forEach((position) => {
    room.tiles[position.y][position.x] = terrainUnderEnemy(room.tiles[position.y][position.x]);
  });
  destinations.forEach((position, index) => {
    const terrain = destinationTerrain[index];
    const moving = movingTiles[index];
    room.tiles[position.y][position.x] = terrain.kind === "trap"
      ? {
          ...moving,
          underlyingKind: "trap",
          underlyingTrapRevealed: terrain.revealed,
          underlyingTrapStyle: terrain.trapStyle,
          underlyingTrapGroupId: terrain.trapGroupId,
          underlyingTrapGroupIds: terrain.trapGroupIds,
          underlyingTrapBeamDirection: terrain.trapBeamDirection,
        }
      : terrain.kind === "regen"
        ? {
            ...moving,
            underlyingKind: "regen",
            underlyingRegenPartX: terrain.regenPartX,
            underlyingRegenPartY: terrain.regenPartY,
          }
        : moving;
  });
}



function findEnemyById(room: DungeonRoom, enemyId: string): Position | null {
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].enemyId === enemyId) return { x, y };
    }
  }
  return null;
}

function applyStaminaActions(
  state: AdventureState,
  currentStamina: Decimal,
  actions: number,
): { state: AdventureState; stamina: Decimal } {
  const totalActions = state.staminaActionProgress + Math.max(0, Math.floor(actions));
  const staminaSpent = Math.floor(totalActions / STAMINA_ACTIONS_PER_POINT);
  return {
    state: {
      ...state,
      staminaActionProgress: totalActions % STAMINA_ACTIONS_PER_POINT,
    },
    stamina: Decimal.max(0, currentStamina.sub(staminaSpent)),
  };
}

function failedMove(
  state: AdventureState,
  hp: Decimal,
  stamina: Decimal,
  error: string,
): AdventureMoveResult {
  return {
    state,
    hp,
    stamina,
    goldGained: new Decimal(0),
    gearFound: null,
    died: false,
    exhausted: stamina.lte(0),
    error,
  };
}

import type { Position } from "@/game/types";
import {
  findTiles,
  fireBeamIsActive,
  isInAdventureWeaponSkillRange,
  isInPlayerAttackRange,
  isInWeaponThrowRange,
} from "./combatRules";
import {
  DIRECTION_OFFSETS,
  directionBetween,
  manhattanDistance as manhattanRoomDistance,
  neighborRoomKey,
  oppositeDirection,
  ringForPosition,
  roomKey,
} from "./geometry";
import { repairAdventureFrontier } from "./exitPlanning";
import { cheapestFirstStep } from "./pathfinding";
import { adventurePlayerActorId } from "./turnTimeline";
import type {
  AdventureExit,
  AdventureState,
  AdventureStrategyContext,
  DungeonRoom,
  ExitDirection,
} from "./types";

export function suggestAdventureMove(
  state: AdventureState,
  context: AdventureStrategyContext = { prioritizeQuest: true },
): Position | null {
  state = repairAdventureFrontier(state);
  const playerActorId = adventurePlayerActorId(state.playerId);
  if (state.activeActorId !== playerActorId) return null;
  const room = state.rooms[state.currentRoomKey];
  if (state.playerMustPass) return null;
  const roomRequiresResolution = room.kind === "mermanThrone"
    || room.kind === "hammerVault"
    || room.kind === "miner"
    || (room.kind === "lottery" && !room.lotteryResolved)
    || (room.kind === "dice" && !room.diceRolled)
    || (room.kind === "forgeArena" && room.forgeArenaStarted && !room.forgeArenaResolved);
  const travelingToTargetRing = !context.routeRoomKey
    && context.targetRing !== undefined
    && room.ring !== context.targetRing
    && !roomRequiresResolution;
  // Quest travel must outrank optional ranged attacks. Otherwise a unit that
  // reaches the room immediately before a marked destination can continually
  // reacquire a nearby enemy instead of taking the reserved final exit. The
  // pathfinder will still attack an enemy when it physically blocks the route,
  // and sealed objective rooms continue to require full resolution.
  const questRouteStep = !roomRequiresResolution && context.prioritizeQuest !== false
    ? routeTowardQuestTarget(state, room)
    : null;
  const cartographerRouteStep = !roomRequiresResolution
    && context.prioritizeQuest !== false
    && state.cartographerQuestActive
      ? routeTowardCartographerSurvey(state, room)
      : null;
  const dungeonReturnStep = context.returnToDungeonPortal
    && context.routeRoomKey
    && room.key !== context.routeRoomKey
    && !roomRequiresResolution
      ? routeToExploredRoom(state, room, context.routeRoomKey)
      : null;
  const travelingToQuest = questRouteStep !== null || cartographerRouteStep !== null;
  const travelingToDungeonReturn = dungeonReturnStep !== null;
  if (!travelingToTargetRing && !travelingToQuest && !travelingToDungeonReturn) {
    if (context.weaponAbilityId && (state.weaponCooldownRemaining ?? 0) <= 0) {
      const skillEnemy = findTiles(room, "enemy").find((position) =>
        isInAdventureWeaponSkillRange(
          state,
          room,
          position,
          context.weaponAbilityId!,
          context.hasTrident,
        )
      );
      if (skillEnemy) return skillEnemy;
    }
    const attackableEnemy = findTiles(room, "enemy").find((position) =>
      isInPlayerAttackRange(state, room, position)
    );
    if (attackableEnemy) return attackableEnemy;
    if (context.weaponThrowUnlocked && context.hasTrident) {
      const throwableEnemy = findTiles(room, "enemy").find((position) =>
        isInWeaponThrowRange(state, room, position, context.hasTrident)
      );
      if (throwableEnemy) return throwableEnemy;
    }
  }
  if (
    (state.dungeonTheme ?? "earth") === "earth"
    &&
    room.kind === "portal"
    && room.tiles[state.playerPosition.y]?.[state.playerPosition.x]?.kind === "portal"
  ) return null;
  if (
    (state.dungeonTheme ?? "earth") === "earth"
    &&
    room.kind === "forgePortal"
    && context.requireFullPartyForForgePortal
    && room.tiles[state.playerPosition.y]?.[state.playerPosition.x]?.kind === "forgePortal"
  ) return null;

  // Discovering the tower pauses auto once. If the player resumes auto there,
  // the expedition returns through its only exit and continues in zone 4.
  // Explicit landmark routing is the one case where an explorer waits here.
  if (room.kind === "towerExterior") {
    if (context.routeRoomKey === room.key) return null;
    const returnExit = room.exits[0]?.position;
    if (!returnExit) return null;
    return cheapestFirstStep(
      room,
      state.playerPosition,
      [returnExit],
      context.occupiedPositions ?? [],
      context.avoidManualInteractions ?? false,
      [],
      false,
      context.ignoreGold ?? false,
    );
  }

  // A sealed objective room takes precedence over the selected exploration
  // strategy: defeat its guardians, then claim the reward that unlocks its exit.
  let targets = room.kind === "mermanThrone" ? findTiles(room, "enemy") : [];
  if (targets.length === 0 && room.kind === "mermanThrone") {
    targets = findTiles(room, "tridentChest");
  }
  if (targets.length === 0 && room.kind === "rescue" && !travelingToTargetRing) targets = findTiles(room, "enemy");
  if (targets.length === 0 && room.kind === "shopkeeper" && !travelingToTargetRing) targets = findTiles(room, "enemy");
  if (targets.length === 0 && room.kind === "shopkeeper") targets = findTiles(room, "shopkeeper");
  if (targets.length === 0 && room.kind === "blacksmith" && state.hammerRecovered) {
    targets = findTiles(room, "blacksmith");
  }
  if (targets.length === 0 && room.kind === "hammerVault") targets = findTiles(room, "enemy");
  if (targets.length === 0 && room.kind === "hammerVault") targets = findTiles(room, "hammerChest");
  if (targets.length === 0 && room.kind === "miner") targets = findTiles(room, "miner");
  if (targets.length === 0 && room.kind === "portal") targets = findTiles(room, "portal");
  // The first Forge visit is the objective of the Enter Tower quest. It must
  // not depend on the advanced Forge-portal preference, which is intentionally
  // hidden until after that first visit succeeds.
  if (
    targets.length === 0
    && room.kind === "forgePortal"
    && (state.dungeonTheme ?? "earth") === "earth"
    && state.questTarget?.questId === "enter-tower"
  ) {
    targets = findTiles(room, "forgePortal");
  }
  if (targets.length === 0 && room.kind === "lostItem") {
    targets = findTiles(room, "rodKeeper");
    if (targets.length === 0) targets = findTiles(room, "lostItemChest");
  }
  if (targets.length === 0 && room.kind === "lottery" && !room.lotterySpun) {
    targets = findTiles(room, "lotteryWheel").filter((position) => {
      const tile = room.tiles[position.y][position.x];
      return tile.lotteryPartX === 1 && tile.lotteryPartY === 1;
    });
  }
  if (targets.length === 0 && room.kind === "lottery" && !room.lotteryResolved) {
    targets = findTiles(room, "enemy");
  }
  if (targets.length === 0 && room.kind === "lottery" && !room.lotteryResolved) {
    targets = findTiles(room, "gold");
  }
  if (targets.length === 0 && room.kind === "dice" && !room.diceRolled) {
    targets = findTiles(room, "dicePedestal");
  }
  if (targets.length === 0 && room.kind === "forgeArena" && room.forgeArenaStarted && !room.forgeArenaResolved) {
    targets = findTiles(room, "enemy");
  }
  if (targets.length === 0 && room.kind === "forgeBlueprint") {
    targets = findTiles(room, "forgeBlueprintChest");
  }
  if (
    targets.length === 0
    && room.kind === "cartographer"
    && state.cartographerQuestActive
    && (state.cartographerSurveyTargets?.length ?? 0) === (state.cartographerSurveyVisited?.length ?? 0)
  ) {
    targets = findTiles(room, "cartographer");
  }
  if (targets.length === 0 && context.returnToDungeonPortal) {
    if (state.dungeonTheme === "water" && room.kind === "waterPortal") {
      targets = findTiles(room, "waterPortal");
    } else if (state.dungeonTheme === "forge" && room.kind === "forgePortal") {
      targets = findTiles(room, "forgePortal");
    } else if (dungeonReturnStep) {
      targets = [dungeonReturnStep];
    }
  }
  if (targets.length === 0 && context.routeRoomKey) {
    if (context.routeRoomKey === room.key) {
      // Portals may still activate when their matching advanced option is on;
      // other landmarks are rendezvous points where explorers wait.
      const autoEnteringTargetPortal = context.returnToDungeonPortal
        || ((state.dungeonTheme ?? "earth") === "earth" && room.kind === "waterPortal"
        && context.enterPortalTypes?.includes("water"))
        || ((state.dungeonTheme ?? "earth") === "earth" && room.kind === "forgePortal"
          && context.enterPortalTypes?.includes("forge"));
      if (!autoEnteringTargetPortal) return null;
    } else {
      const routeStep = routeToExploredRoom(state, room, context.routeRoomKey);
      if (routeStep) targets = [routeStep];
    }
  }
  if (targets.length === 0 && (state.dungeonTheme ?? "earth") === "earth" && context.enterPortalTypes?.includes("water")) {
    targets = findTiles(room, "waterPortal");
  }
  if (targets.length === 0 && (state.dungeonTheme ?? "earth") === "earth" && context.enterPortalTypes?.includes("forge")) {
    targets = findTiles(room, "forgePortal");
  }
  if (targets.length === 0 && room.kind === "regen" && !room.regenUsedBy.includes(playerActorId)) {
    targets = findTiles(room, "regen");
  }

  if (targets.length === 0 && questRouteStep) {
    targets = [questRouteStep];
  }
  if (targets.length === 0 && cartographerRouteStep) {
    targets = [cartographerRouteStep];
  }
  if (targets.length === 0 && context.followRoomKey && context.followRoomKey !== room.key) {
    const followStep = routeToExploredRoom(state, room, context.followRoomKey);
    if (followStep) targets = [followStep];
  }
  if (targets.length === 0 && !travelingToTargetRing) targets = findTiles(room, "treasureChest");
  if (targets.length === 0 && !travelingToTargetRing && !context.ignoreGold) {
    targets = findTiles(room, "gold");
  }

  if (targets.length === 0) {
    const frontierExits = room.exits
      .filter((exit) => !state.rooms[neighborRoomKey(room, exit.direction)])
      .sort((a, b) => {
        if (context.targetRing) {
          const ringDifference = Math.abs(ringForExit(room, a) - context.targetRing)
            - Math.abs(ringForExit(room, b) - context.targetRing);
          if (ringDifference !== 0) return ringDifference;
        }
        const headingDifference = directionPreferenceScore(a.direction, context.preferredDirection)
          - directionPreferenceScore(b.direction, context.preferredDirection);
        if (headingDifference !== 0) return headingDifference;
        if (context.avoidRoomKeys?.length) {
          return splitExitScore(state, room, b, context.avoidRoomKeys)
            - splitExitScore(state, room, a, context.avoidRoomKeys);
        }
        return questExitDistance(state, room, a) - questExitDistance(state, room, b);
      });
    targets = (context.preferredDirection || context.avoidRoomKeys?.length
      ? frontierExits.slice(0, 1)
      : frontierExits)
      .map((exit) => exit.position);
  }
  if (targets.length === 0) {
    const route = routeToNearestFrontier(state, room);
    if (route) targets = [route];
  }
  if (targets.length === 0) {
    const exits = room.exits
      .filter((exit) => neighborRoomKey(room, exit.direction) !== state.previousRoomKey)
      .filter((exit) => shouldUseExploredExit(state, room, exit, context.routeRoomKey))
      .sort((a, b) => directionPreferenceScore(a.direction, context.preferredDirection)
        - directionPreferenceScore(b.direction, context.preferredDirection));
    targets = (context.preferredDirection ? exits.slice(0, 1) : exits).map((exit) => exit.position);
  }
  if (targets.length === 0) {
    const exits = room.exits
      .filter((exit) => shouldUseExploredExit(state, room, exit, context.routeRoomKey))
      .sort((a, b) => directionPreferenceScore(a.direction, context.preferredDirection)
        - directionPreferenceScore(b.direction, context.preferredDirection));
    targets = (context.preferredDirection ? exits.slice(0, 1) : exits).map((exit) => exit.position);
  }

  const allowedSpecialPortals: Array<"waterPortal" | "forgePortal"> = [];
  if (context.returnToDungeonPortal) {
    if (state.dungeonTheme === "water") allowedSpecialPortals.push("waterPortal");
    if (state.dungeonTheme === "forge") allowedSpecialPortals.push("forgePortal");
  } else if ((state.dungeonTheme ?? "earth") === "earth") {
    if (context.enterPortalTypes?.includes("water")) allowedSpecialPortals.push("waterPortal");
    if (context.enterPortalTypes?.includes("forge")) allowedSpecialPortals.push("forgePortal");
  }
  if (room.kind === "forgePortal" && state.questTarget?.questId === "enter-tower") {
    allowedSpecialPortals.push("forgePortal");
  }

  const firstStep = cheapestFirstStep(
    room,
    state.playerPosition,
    targets,
    context.occupiedPositions ?? [],
    context.avoidManualInteractions ?? false,
    allowedSpecialPortals,
    travelingToTargetRing,
    context.ignoreGold ?? false,
    travelingToQuest,
  );
  if (firstStep) {
    const firstTile = room.tiles[firstStep.y]?.[firstStep.x];
    if (
      firstTile?.kind === "trap"
      && firstTile.revealed
      && firstTile.trapStyle === "fire-beam"
      && fireBeamIsActive(room, firstTile)
    ) return null;
  }
  return firstStep;
}

function shouldUseExploredExit(
  state: AdventureState,
  room: DungeonRoom,
  exit: AdventureExit,
  routeRoomKey: string | null | undefined,
): boolean {
  const destination = state.rooms[neighborRoomKey(room, exit.direction)];
  return !destination
    || destination.kind !== "towerExterior"
    || destination.key === routeRoomKey;
}

function ringForExit(room: DungeonRoom, exit: AdventureExit): number {
  const offset = DIRECTION_OFFSETS[exit.direction];
  return ringForPosition({ x: room.position.x + offset.x, y: room.position.y + offset.y });
}

function directionPreferenceScore(
  direction: ExitDirection,
  preferredDirection: ExitDirection | null | undefined,
): number {
  if (!preferredDirection) return 0;
  if (direction === preferredDirection) return 0;
  if (direction === oppositeDirection(preferredDirection)) return 2;
  return 1;
}

function splitExitScore(
  state: AdventureState,
  room: DungeonRoom,
  exit: AdventureExit,
  avoidRoomKeys: string[],
): number {
  const offset = DIRECTION_OFFSETS[exit.direction];
  const candidate = { x: room.position.x + offset.x, y: room.position.y + offset.y };
  const avoided = avoidRoomKeys.flatMap((key) => state.rooms[key]?.position ?? []);
  if (avoided.length === 0) return 0;
  return Math.min(...avoided.map((position) => manhattanRoomDistance(candidate, position)));
}

function routeTowardQuestTarget(state: AdventureState, startRoom: DungeonRoom): Position | null {
  const target = state.questTarget;
  if (!target) return null;
  const firstMissingIndex = target.path.findIndex((position) => !state.rooms[roomKey(position)]);
  const destinationPosition = firstMissingIndex < 0
    ? target.position
    : firstMissingIndex === 0
      ? { x: 0, y: 0 }
      : target.path[firstMissingIndex - 1];
  const destinationKey = roomKey(destinationPosition);

  if (startRoom.key === destinationKey) {
    if (firstMissingIndex < 0) return null;
    const nextPosition = target.path[firstMissingIndex];
    const direction = directionBetween(startRoom.position, nextPosition);
    return startRoom.exits.find((exit) => exit.direction === direction)?.position ?? null;
  }
  return routeToExploredRoom(state, startRoom, destinationKey);
}

function routeTowardCartographerSurvey(
  state: AdventureState,
  startRoom: DungeonRoom,
): Position | null {
  const targets = state.cartographerSurveyTargets ?? [];
  const visited = state.cartographerSurveyVisited ?? [];
  const paths = state.cartographerSurveyPaths ?? [];
  const nextTargetIndex = targets.findIndex((target) =>
    !visited.some((position) => position.x === target.x && position.y === target.y)
  );
  if (nextTargetIndex < 0) {
    const cartographerRoom = Object.values(state.rooms).find((room) => room.kind === "cartographer");
    if (!cartographerRoom || cartographerRoom.key === startRoom.key) return null;
    return routeToExploredRoom(state, startRoom, cartographerRoom.key);
  }

  const path = paths[nextTargetIndex] ?? [targets[nextTargetIndex]];
  const firstMissingIndex = path.findIndex((position) => !state.rooms[roomKey(position)]);
  if (firstMissingIndex < 0) {
    const destinationKey = roomKey(targets[nextTargetIndex]);
    return destinationKey === startRoom.key
      ? null
      : routeToExploredRoom(state, startRoom, destinationKey);
  }
  const launchPosition = firstMissingIndex === 0 ? path[0] : path[firstMissingIndex - 1];
  const launchKey = roomKey(launchPosition);
  if (startRoom.key !== launchKey) return routeToExploredRoom(state, startRoom, launchKey);
  const direction = directionBetween(launchPosition, path[firstMissingIndex]);
  return startRoom.exits.find((exit) => exit.direction === direction)?.position ?? null;
}

function routeToExploredRoom(
  state: AdventureState,
  startRoom: DungeonRoom,
  destinationKey: string,
): Position | null {
  const queue = [startRoom.key];
  const previous = new Map<string, string | null>([[startRoom.key, null]]);
  while (queue.length > 0) {
    const key = queue.shift();
    if (!key || key === destinationKey) break;
    for (const exit of state.rooms[key].exits) {
      const neighborKey = neighborRoomKey(state.rooms[key], exit.direction);
      if (!state.rooms[neighborKey] || previous.has(neighborKey)) continue;
      previous.set(neighborKey, key);
      queue.push(neighborKey);
    }
  }
  if (!previous.has(destinationKey)) return null;
  let nextRoomKey = destinationKey;
  while (previous.get(nextRoomKey) !== startRoom.key) {
    const prior = previous.get(nextRoomKey);
    if (!prior) return null;
    nextRoomKey = prior;
  }
  const nextRoom = state.rooms[nextRoomKey];
  return startRoom.exits.find((exit) =>
    startRoom.position.x + DIRECTION_OFFSETS[exit.direction].x === nextRoom.position.x &&
    startRoom.position.y + DIRECTION_OFFSETS[exit.direction].y === nextRoom.position.y
  )?.position ?? null;
}

function questExitDistance(
  state: AdventureState,
  room: DungeonRoom,
  exit: AdventureExit,
): number {
  if (!state.questTarget) return 0;
  const offset = DIRECTION_OFFSETS[exit.direction];
  return manhattanRoomDistance(
    { x: room.position.x + offset.x, y: room.position.y + offset.y },
    state.questTarget.position,
  );
}

function routeToNearestFrontier(state: AdventureState, startRoom: DungeonRoom): Position | null {
  const queue = [startRoom.key];
  const previous = new Map<string, string | null>([[startRoom.key, null]]);
  let destinationKey: string | null = null;

  while (queue.length > 0) {
    const key = queue.shift();
    if (!key) break;
    const room = state.rooms[key];
    if (key !== startRoom.key && room.exits.some((exit) => !state.rooms[neighborRoomKey(room, exit.direction)])) {
      destinationKey = key;
      break;
    }
    for (const exit of room.exits) {
      const neighborKey = neighborRoomKey(room, exit.direction);
      if (!state.rooms[neighborKey] || previous.has(neighborKey)) continue;
      previous.set(neighborKey, key);
      queue.push(neighborKey);
    }
  }

  if (!destinationKey) return null;
  let nextRoomKey = destinationKey;
  while (previous.get(nextRoomKey) !== startRoom.key) {
    const prior = previous.get(nextRoomKey);
    if (!prior) return null;
    nextRoomKey = prior;
  }
  const nextRoom = state.rooms[nextRoomKey];
  return startRoom.exits.find((exit) =>
    startRoom.position.x + DIRECTION_OFFSETS[exit.direction].x === nextRoom.position.x &&
    startRoom.position.y + DIRECTION_OFFSETS[exit.direction].y === nextRoom.position.y
  )?.position ?? null;
}

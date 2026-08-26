import type { Position } from "@/game/types";
import {
  DIRECTIONS,
  DIRECTION_OFFSETS,
  biasedExitOrder,
  centeredExitPosition,
  directionBetween,
  inwardPosition,
  neighborRoomKey,
  oppositeDirection,
  positionsEqual,
  roomKey,
} from "./geometry";
import { cloneDungeonRoom } from "./state";
import { isBlockedTile } from "./tileRules";
import type {
  AdventureExit,
  AdventureQuestTarget,
  AdventureState,
  AdventureTile,
  DungeonRoom,
  ExitDirection,
  RandomSource,
} from "./types";

export function chooseExitDirections(
  _ring: number,
  position: Position,
  requiredExit: ExitDirection | null,
  existingRooms: Record<string, DungeonRoom>,
  random: RandomSource,
  questTarget: AdventureQuestTarget | null = null,
  preventFrontierMerges = false,
): ExitDirection[] {
  const selected = mandatoryNeighborExits(position, requiredExit, existingRooms);
  const questDirection = nextQuestRouteDirection(position, questTarget);
  if (questDirection && !selected.includes(questDirection)) selected.push(questDirection);
  let desired = Math.max(
    selected.length,
    rollRoomExitCount(random),
  );
  if (!hasOtherUnexploredFrontier(position, existingRooms, questTarget)) {
    desired = Math.min(4, Math.max(desired, selected.length + 1));
  }
  const candidates = biasedExitOrder(DIRECTIONS.filter((direction) =>
    !selected.includes(direction)
    && !isBlockedQuestTargetEntrance(position, direction, questTarget)
    && (!preventFrontierMerges || !frontierAlreadyHasEntrance(position, direction, existingRooms))
    && !isReservedMermanThronePosition({
      x: position.x + DIRECTION_OFFSETS[direction].x,
      y: position.y + DIRECTION_OFFSETS[direction].y,
    }, existingRooms)
  ), requiredExit, random);

  for (const direction of candidates) {
    if (selected.length >= desired) break;
    const offset = DIRECTION_OFFSETS[direction];
    const neighbor = existingRooms[roomKey({ x: position.x + offset.x, y: position.y + offset.y })];
    if (neighbor) continue;
    selected.push(direction);
  }

  return selected;
}

export function canReserveMermanThrone(
  offeringPosition: Position,
  bossDirection: ExitDirection,
  existingRooms: Record<string, DungeonRoom>,
): boolean {
  const offset = DIRECTION_OFFSETS[bossDirection];
  const target = { x: offeringPosition.x + offset.x, y: offeringPosition.y + offset.y };
  return !existingRooms[roomKey(target)]
    && !frontierAlreadyHasEntrance(offeringPosition, bossDirection, existingRooms)
    && !isReservedMermanThronePosition(target, existingRooms);
}

export function offeringReservingPosition(
  existingRooms: Record<string, DungeonRoom>,
  position: Position,
): DungeonRoom | undefined {
  return Object.values(existingRooms).find((room) => {
    if (room.kind !== "offering" || !room.offeringBossDirection) return false;
    const offset = DIRECTION_OFFSETS[room.offeringBossDirection];
    return room.position.x + offset.x === position.x
      && room.position.y + offset.y === position.y;
  });
}

export function isReservedMermanThronePosition(
  position: Position,
  existingRooms: Record<string, DungeonRoom>,
): boolean {
  return Boolean(offeringReservingPosition(existingRooms, position));
}

export function rollRoomExitCount(random: RandomSource = Math.random): 1 | 2 | 3 | 4 {
  const roll = random();
  if (roll < 0.5) return 2;
  if (roll < 0.65) return 1;
  if (roll < 0.9) return 3;
  return 4;
}

export function hasOtherUnexploredFrontier(
  generatingPosition: Position,
  existingRooms: Record<string, DungeonRoom>,
  questTarget: AdventureQuestTarget | null = null,
): boolean {
  const generatingKey = roomKey(generatingPosition);
  const bounds = dungeonRoomBounds(existingRooms);
  return Object.values(existingRooms).some((room) => room.exits.some((exit) => {
    const offset = DIRECTION_OFFSETS[exit.direction];
    const target = {
      x: room.position.x + offset.x,
      y: room.position.y + offset.y,
    };
    const targetKey = roomKey(target);
    return targetKey !== generatingKey
      && !existingRooms[targetKey]
      && isOutsideDungeonBounds(target, bounds)
      && isAllowedFrontierTarget(target, existingRooms, questTarget)
      && frontierContinuationCapacity(target, room.key, existingRooms, generatingKey) > 0;
  }));
}

export function hasViableUnexploredFrontier(
  rooms: Record<string, DungeonRoom>,
  questTarget: AdventureQuestTarget | null = null,
  preferredRoomKey: string | null = null,
): boolean {
  const bounds = dungeonRoomBounds(rooms);
  const reachableRoomKeys = preferredRoomKey
    ? reachableDungeonRoomKeys(rooms, preferredRoomKey)
    : new Set(Object.keys(rooms));
  return Object.values(rooms).some((room) => reachableRoomKeys.has(room.key) && room.exits.some((exit) => {
    const offset = DIRECTION_OFFSETS[exit.direction];
    const target = {
      x: room.position.x + offset.x,
      y: room.position.y + offset.y,
    };
    const targetKey = roomKey(target);
    return !rooms[targetKey]
      && isOutsideDungeonBounds(target, bounds)
      && isAllowedFrontierTarget(target, rooms, questTarget)
      && frontierContinuationCapacity(target, room.key, rooms) > 0;
  }));
}

export function repairAdventureFrontier(state: AdventureState): AdventureState {
  const rooms = ensureDungeonFrontier(
    state.rooms,
    state.currentRoomKey,
    state.questTarget,
    state.chalkMappedExits,
    state.cartographerSurveyPaths,
  );
  return rooms === state.rooms ? state : { ...state, rooms };
}

export function ensureDungeonFrontier(
  rooms: Record<string, DungeonRoom>,
  preferredRoomKey: string,
  questTarget: AdventureQuestTarget | null,
  chalkMappedExits: Record<string, ExitDirection[]> = {},
  cartographerSurveyPaths: Position[][] = [],
): Record<string, DungeonRoom> {
  // A quest route is a stronger invariant than the ordinary frontier. Older
  // in-memory expeditions and rooms reached through a side branch may already
  // occupy a reserved route coordinate without carrying the route's outgoing
  // exit. Repair every generated edge of the reserved path before considering
  // whether some unrelated frontier is still viable.
  rooms = ensureQuestRouteConnections(rooms, questTarget);
  rooms = ensureMappedRoomConnections(rooms, chalkMappedExits);
  rooms = ensureReservedPathConnections(rooms, cartographerSurveyPaths);
  if (rooms[preferredRoomKey]?.kind === "towerExterior") return rooms;
  if (hasViableUnexploredFrontier(rooms, questTarget, preferredRoomKey)) return rooms;

  const bounds = dungeonRoomBounds(rooms);
  const reachableRoomKeys = reachableDungeonRoomKeys(rooms, preferredRoomKey);
  const candidates = Object.values(rooms)
    .filter((room) => reachableRoomKeys.has(room.key))
    .filter(isFrontierExpandableRoom)
    .sort((left, right) =>
      Number(right.key === preferredRoomKey) - Number(left.key === preferredRoomKey)
      || Number(isDungeonBoundaryRoom(right.position, bounds)) - Number(isDungeonBoundaryRoom(left.position, bounds))
      || right.number - left.number
    );
  for (const room of candidates) {
    const available = DIRECTIONS
      .filter((direction) => !room.exits.some((exit) => exit.direction === direction))
      .map((direction) => {
        const offset = DIRECTION_OFFSETS[direction];
        const target = { x: room.position.x + offset.x, y: room.position.y + offset.y };
        return {
          direction,
          target,
          capacity: frontierContinuationCapacity(target, room.key, rooms),
        };
      })
      .filter(({ target, capacity }) =>
        !rooms[roomKey(target)]
        && isOutsideDungeonBounds(target, bounds)
        && capacity > 0
        && isAllowedFrontierTarget(target, rooms, questTarget)
      )
      .sort((left, right) => right.capacity - left.capacity ||
        DIRECTIONS.indexOf(left.direction) - DIRECTIONS.indexOf(right.direction));
    const selected = available[0];
    if (!selected) continue;

    const repaired = cloneDungeonRoom(room);
    const exit: AdventureExit = {
      direction: selected.direction,
      position: centeredExitPosition(repaired.width, selected.direction),
    };
    repaired.exits.push(exit);
    carveExitApproach(repaired.tiles, exit);
    repaired.tiles[exit.position.y][exit.position.x] = {
      kind: "exit",
      exitDirection: exit.direction,
    };
    return { ...rooms, [repaired.key]: repaired };
  }
  return rooms;
}

function ensureReservedPathConnections(
  rooms: Record<string, DungeonRoom>,
  paths: Position[][],
): Record<string, DungeonRoom> {
  let repairedRooms = rooms;
  for (const path of paths) {
    for (let index = 0; index < path.length - 1; index += 1) {
      const from = path[index];
      const to = path[index + 1];
      const direction = directionBetween(from, to);
      if (!direction) continue;
      repairedRooms = ensureDungeonRoomExit(repairedRooms, roomKey(from), direction);
      repairedRooms = ensureDungeonRoomExit(repairedRooms, roomKey(to), oppositeDirection(direction));
    }
  }
  return repairedRooms;
}

function ensureMappedRoomConnections(
  rooms: Record<string, DungeonRoom>,
  mappedExits: Record<string, ExitDirection[]>,
): Record<string, DungeonRoom> {
  let repairedRooms = rooms;
  for (const [key, directions] of Object.entries(mappedExits)) {
    for (const direction of directions) {
      repairedRooms = ensureDungeonRoomExit(repairedRooms, key, direction);
    }
  }
  return repairedRooms;
}

function ensureQuestRouteConnections(
  rooms: Record<string, DungeonRoom>,
  questTarget: AdventureQuestTarget | null,
): Record<string, DungeonRoom> {
  if (!questTarget || questTarget.path.length === 0) return rooms;
  const route = [{ x: 0, y: 0 }, ...questTarget.path];
  let repairedRooms = rooms;

  for (let index = 0; index < route.length - 1; index += 1) {
    const from = route[index];
    const to = route[index + 1];
    const direction = directionBetween(from, to);
    if (!direction) continue;
    repairedRooms = ensureDungeonRoomExit(repairedRooms, roomKey(from), direction);
    repairedRooms = ensureDungeonRoomExit(
      repairedRooms,
      roomKey(to),
      oppositeDirection(direction),
    );
  }
  return repairedRooms;
}

function ensureDungeonRoomExit(
  rooms: Record<string, DungeonRoom>,
  key: string,
  direction: ExitDirection,
): Record<string, DungeonRoom> {
  const room = rooms[key];
  if (!room) return rooms;
  const existingExit = room.exits.find((exit) => exit.direction === direction);
  if (existingExit) {
    const exitTile = room.tiles[existingExit.position.y]?.[existingExit.position.x];
    const inward = inwardPosition(existingExit.position, existingExit.direction);
    const inwardTile = room.tiles[inward.y]?.[inward.x];
    const hasWorkingExitTile = exitTile?.exitDirection === direction
      && (
        exitTile.kind === "exit"
        || exitTile.kind === "lotteryGate"
        || exitTile.kind === "diceGate"
        || exitTile.kind === "clayGate"
        || exitTile.kind === "forgeGate"
        || exitTile.kind === "woodenDoor"
      );
    const hasOpenApproach = inwardTile && !isBlockedTile(inwardTile);
    if (hasWorkingExitTile && hasOpenApproach) return rooms;

    const repaired = cloneDungeonRoom(room);
    if (!hasOpenApproach) carveExitApproach(repaired.tiles, existingExit);
    if (!hasWorkingExitTile) {
      repaired.tiles[existingExit.position.y][existingExit.position.x] = {
        kind: "exit",
        exitDirection: direction,
      };
    }
    return { ...rooms, [key]: repaired };
  }
  const repaired = cloneDungeonRoom(room);
  const exit: AdventureExit = {
    direction,
    position: centeredExitPosition(repaired.width, direction),
  };
  repaired.exits.push(exit);
  carveExitApproach(repaired.tiles, exit);
  repaired.tiles[exit.position.y][exit.position.x] = {
    kind: "exit",
    exitDirection: direction,
  };
  return { ...rooms, [key]: repaired };
}

function isFrontierExpandableRoom(room: DungeonRoom): boolean {
  if (
    room.kind === "normal"
    || room.kind === "regen"
    || room.kind === "waterPortal"
  ) return true;
  if (room.kind === "lottery") return room.lotteryResolved === true;
  if (room.kind === "dice") return room.diceRolled === true && room.diceRolling !== true;
  return false;
}

interface DungeonRoomBounds {
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
}

function dungeonRoomBounds(rooms: Record<string, DungeonRoom>): DungeonRoomBounds {
  const values = Object.values(rooms).filter((room) => !room.mapHidden);
  if (values.length === 0) {
    return { minimumX: 0, maximumX: 0, minimumY: 0, maximumY: 0 };
  }
  return {
    minimumX: Math.min(...values.map((room) => room.position.x)),
    maximumX: Math.max(...values.map((room) => room.position.x)),
    minimumY: Math.min(...values.map((room) => room.position.y)),
    maximumY: Math.max(...values.map((room) => room.position.y)),
  };
}

function isOutsideDungeonBounds(position: Position, bounds: DungeonRoomBounds): boolean {
  return position.x < bounds.minimumX
    || position.x > bounds.maximumX
    || position.y < bounds.minimumY
    || position.y > bounds.maximumY;
}

function isDungeonBoundaryRoom(position: Position, bounds: DungeonRoomBounds): boolean {
  return position.x === bounds.minimumX
    || position.x === bounds.maximumX
    || position.y === bounds.minimumY
    || position.y === bounds.maximumY;
}

function reachableDungeonRoomKeys(
  rooms: Record<string, DungeonRoom>,
  startingRoomKey: string,
): Set<string> {
  if (!rooms[startingRoomKey]) return new Set();
  const reachable = new Set<string>([startingRoomKey]);
  const queue = [startingRoomKey];
  while (queue.length > 0) {
    const key = queue.shift();
    if (!key) break;
    const room = rooms[key];
    for (const exit of room.exits) {
      const neighborKey = neighborRoomKey(room, exit.direction);
      if (!rooms[neighborKey] || reachable.has(neighborKey)) continue;
      reachable.add(neighborKey);
      queue.push(neighborKey);
    }
  }
  return reachable;
}

function isAllowedFrontierTarget(
  target: Position,
  rooms: Record<string, DungeonRoom>,
  questTarget: AdventureQuestTarget | null,
): boolean {
  return (!questTarget || !positionsEqual(target, questTarget.position))
    && !isReservedMermanThronePosition(target, rooms);
}

function frontierContinuationCapacity(
  target: Position,
  sourceRoomKey: string,
  rooms: Record<string, DungeonRoom>,
  excludedRoomKey: string | null = null,
): number {
  return DIRECTIONS.filter((direction) => {
    const offset = DIRECTION_OFFSETS[direction];
    const nextKey = roomKey({ x: target.x + offset.x, y: target.y + offset.y });
    return nextKey !== sourceRoomKey
      && nextKey !== excludedRoomKey
      && !rooms[nextKey];
  }).length;
}

function frontierAlreadyHasEntrance(
  position: Position,
  direction: ExitDirection,
  existingRooms: Record<string, DungeonRoom>,
): boolean {
  const offset = DIRECTION_OFFSETS[direction];
  const target = { x: position.x + offset.x, y: position.y + offset.y };
  for (const neighborDirection of DIRECTIONS) {
    const neighborOffset = DIRECTION_OFFSETS[neighborDirection];
    const neighbor = existingRooms[roomKey({
      x: target.x + neighborOffset.x,
      y: target.y + neighborOffset.y,
    })];
    if (neighbor?.exits.some((exit) => exit.direction === oppositeDirection(neighborDirection))) {
      return true;
    }
  }
  return false;
}

export function mandatoryNeighborExits(
  position: Position,
  requiredExit: ExitDirection | null,
  existingRooms: Record<string, DungeonRoom>,
): ExitDirection[] {
  const selected = new Set<ExitDirection>();
  if (requiredExit) selected.add(requiredExit);
  for (const direction of DIRECTIONS) {
    const offset = DIRECTION_OFFSETS[direction];
    const neighbor = existingRooms[roomKey({
      x: position.x + offset.x,
      y: position.y + offset.y,
    })];
    if (neighbor?.exits.some((exit) => exit.direction === oppositeDirection(direction))) {
      selected.add(direction);
    }
  }
  return DIRECTIONS.filter((direction) => selected.has(direction));
}

function nextQuestRouteDirection(
  position: Position,
  target: AdventureQuestTarget | null,
): ExitDirection | null {
  if (!target) return null;
  const index = target.path.findIndex((step) => positionsEqual(step, position));
  const next = index < 0
    ? positionsEqual(position, { x: 0, y: 0 }) ? target.path[0] : null
    : target.path[index + 1];
  if (!next) return null;
  return directionBetween(position, next);
}

function isBlockedQuestTargetEntrance(
  position: Position,
  direction: ExitDirection,
  target: AdventureQuestTarget | null,
): boolean {
  if (!target) return false;
  const offset = DIRECTION_OFFSETS[direction];
  const neighbor = { x: position.x + offset.x, y: position.y + offset.y };
  if (!positionsEqual(neighbor, target.position)) return false;
  const predecessor = target.path[target.path.length - 2];
  return !positionsEqual(position, predecessor);
}


function carveExitApproach(tiles: AdventureTile[][], exit: AdventureExit): void {
  const inward = inwardPosition(exit.position, exit.direction);
  tiles[inward.y][inward.x] = { kind: "floor" };
}

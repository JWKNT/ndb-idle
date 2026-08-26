import type { QuestId } from "../../content/quests";
import type { Position } from "../types";
import {
  DIRECTIONS,
  DIRECTION_OFFSETS,
  carveExitApproach,
  centeredExitPosition,
  directionBetween,
  oppositeDirection,
  positionsEqual,
  ringForPosition,
  roomKey,
  shuffled,
} from "./geometry";
import { cloneAdventureForRoom, cloneDungeonRoom } from "./state";
import type {
  AdventureExit,
  AdventureQuestTarget,
  AdventureState,
  DungeonRoom,
  ExitDirection,
  RandomSource,
} from "./types";

export function createQuestTarget(
  questId: QuestId,
  depth: number,
  random: RandomSource,
): AdventureQuestTarget {
  const candidates: Position[] = [];
  for (let y = -depth; y <= depth; y += 1) {
    for (let x = -depth; x <= depth; x += 1) {
      const distance = Math.abs(x) + Math.abs(y);
      if (Math.max(Math.abs(x), Math.abs(y)) === depth && distance <= depth * 2 - 1) {
        candidates.push({ x, y });
      }
    }
  }
  const position = candidates[Math.floor(random() * candidates.length)] ?? { x: depth, y: 0 };
  const directions: ExitDirection[] = [
    ...Array.from({ length: Math.abs(position.x) }, () => position.x > 0 ? "east" : "west" as ExitDirection),
    ...Array.from({ length: Math.abs(position.y) }, () => position.y > 0 ? "south" : "north" as ExitDirection),
  ];
  for (let index = directions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [directions[index], directions[swapIndex]] = [directions[swapIndex], directions[index]];
  }
  // Reserve a short self-avoiding dogleg or two instead of making every marked
  // route a shortest Manhattan staircase. This keeps the guarantee of a legal,
  // reasonably direct path while allowing it to look like an organic dungeon
  // route on the map.
  const detourCount = depth >= 8 ? 2 : 1;
  for (let detour = 0; detour < detourCount; detour += 1) {
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const edgeIndex = Math.floor(random() * directions.length);
      const forward = directions[edgeIndex];
      if (!forward) break;
      const perpendicular = forward === "north" || forward === "south"
        ? (["east", "west"] as ExitDirection[])
        : (["north", "south"] as ExitDirection[]);
      const side = perpendicular[Math.floor(random() * perpendicular.length)] ?? perpendicular[0];
      const candidate = [
        ...directions.slice(0, edgeIndex),
        side,
        forward,
        oppositeDirection(side),
        ...directions.slice(edgeIndex + 1),
      ];
      if (!isValidQuestRoute(candidate, position, depth)) continue;
      directions.splice(0, directions.length, ...candidate);
      break;
    }
  }
  const path: Position[] = [];
  const cursor = { x: 0, y: 0 };
  for (const direction of directions) {
    const offset = DIRECTION_OFFSETS[direction];
    cursor.x += offset.x;
    cursor.y += offset.y;
    path.push({ ...cursor });
  }
  return {
    questId,
    position: { ...position },
    path,
  };
}
function isValidQuestRoute(
  directions: ExitDirection[],
  target: Position,
  maximumDepth: number,
): boolean {
  const cursor = { x: 0, y: 0 };
  const visited = new Set([roomKey(cursor)]);
  for (let index = 0; index < directions.length; index += 1) {
    const offset = DIRECTION_OFFSETS[directions[index]];
    cursor.x += offset.x;
    cursor.y += offset.y;
    if (Math.max(Math.abs(cursor.x), Math.abs(cursor.y)) > maximumDepth) return false;
    const atTarget = positionsEqual(cursor, target);
    if (atTarget && index !== directions.length - 1) return false;
    const key = roomKey(cursor);
    if (visited.has(key)) return false;
    visited.add(key);
  }
  return positionsEqual(cursor, target);
}

export function activateHammerQuestAtBlacksmith(
  state: AdventureState,
  random: RandomSource = Math.random,
): { state: AdventureState; error?: string } {
  if (!state.hammerQuestPurchased) {
    return { state, error: "Purchase the Hammer quest from the Blacksmith first." };
  }
  if (state.hammerRecovered) {
    return { state, error: "Return the recovered Hammer to the Blacksmith." };
  }
  if (state.questTarget?.questId === "retrieve-hammer") return { state };
  const room = currentAdventureRoom(state);
  if (room.kind !== "blacksmith") {
    return { state, error: "Visit the Blacksmith's workshop to activate this quest." };
  }
  const next = cloneAdventureForRoom(state, room.key);
  const activated = activateHammerQuest(next, currentAdventureRoom(next), random);
  return activated
    ? { state: next }
    : { state, error: "The Blacksmith could not find a safe route to the vault in this expedition." };
}

export function activateMinerQuestAtBlacksmith(
  state: AdventureState,
  random: RandomSource = Math.random,
): { state: AdventureState; error?: string } {
  if (state.questTarget?.questId === "find-miner") return { state };
  const room = currentAdventureRoom(state);
  if (room.kind !== "blacksmith") {
    return { state, error: "Visit the Blacksmith's workshop to mark the Miner cave." };
  }
  const next = cloneAdventureForRoom(state, room.key);
  const path = createHammerQuestPath(next.rooms, currentAdventureRoom(next), random);
  if (!path) {
    return { state, error: "No safe Miner route remained in this expedition. It will be marked on the next one." };
  }
  connectExistingHammerRouteRooms(next, path);
  reserveHammerVaultDeadEnd(next, path);
  next.questTarget = {
    questId: "find-miner",
    position: { ...path[path.length - 1] },
    path,
  };
  return { state: next };
}

function activateHammerQuest(
  state: AdventureState,
  blacksmithRoom: DungeonRoom,
  random: RandomSource,
): boolean {
  const path = createHammerQuestPath(state.rooms, blacksmithRoom, random);
  if (!path) return false;
  connectExistingHammerRouteRooms(state, path);
  reserveHammerVaultDeadEnd(state, path);
  state.questTarget = {
    questId: "retrieve-hammer",
    position: { ...path[path.length - 1] },
    path,
  };
  return true;
}

function createHammerQuestPath(
  rooms: Record<string, DungeonRoom>,
  blacksmithRoom: DungeonRoom,
  random: RandomSource,
): Position[] | null {
  const preferredDistance = 5 + Math.floor(Math.max(0, Math.min(0.999999, random())) * 6);
  const distances = [
    preferredDistance,
    ...shuffled([5, 6, 7, 8, 9, 10].filter((distance) => distance !== preferredDistance), random),
  ];

  for (const distance of distances) {
    const path: Position[] = [{ ...blacksmithRoom.position }];
    const used = new Set([roomKey(blacksmithRoom.position)]);
    const extend = (remaining: number): boolean => {
      if (remaining === 0) return true;
      const current = path[path.length - 1];
      for (const direction of shuffled(DIRECTIONS, random)) {
        const offset = DIRECTION_OFFSETS[direction];
        const next = { x: current.x + offset.x, y: current.y + offset.y };
        const key = roomKey(next);
        if (ringForPosition(next) !== 3 || used.has(key)) continue;
        const existingRoom = rooms[key];
        const isVault = remaining === 1;
        // The fixed vault layout has its only doorway in the south wall, so the
        // final route step must approach it from below. Every earlier step may
        // pass through an ordinary explored room; activation connects those
        // rooms instead of failing merely because this zone is well explored.
        if (isVault && (direction !== "north" || existingRoom)) continue;
        if (
          !isVault
          && existingRoom
          && existingRoom.kind !== "normal"
          && existingRoom.kind !== "regen"
          && existingRoom.kind !== "blacksmith"
        ) continue;
        path.push(next);
        used.add(key);
        if (extend(remaining - 1)) return true;
        used.delete(key);
        path.pop();
      }
      return false;
    };
    if (extend(distance)) return path.map((position) => ({ ...position }));
  }
  return null;
}

function connectExistingHammerRouteRooms(
  state: AdventureState,
  path: Position[],
): void {
  const clonedRoomKeys = new Set<string>();
  const mutableRoom = (position: Position): DungeonRoom | null => {
    const key = roomKey(position);
    const room = state.rooms[key];
    if (!room) return null;
    if (!clonedRoomKeys.has(key)) {
      state.rooms[key] = cloneDungeonRoom(room);
      clonedRoomKeys.add(key);
    }
    return state.rooms[key];
  };

  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const direction = directionBetween(from, to);
    if (!direction) continue;
    const fromRoom = mutableRoom(from);
    if (fromRoom) ensureRoomExit(fromRoom, direction);
    const toRoom = mutableRoom(to);
    if (toRoom) ensureRoomExit(toRoom, oppositeDirection(direction));
  }
}

function ensureRoomExit(room: DungeonRoom, direction: ExitDirection): void {
  if (room.exits.some((exit) => exit.direction === direction)) return;
  const exit: AdventureExit = {
    direction,
    position: centeredExitPosition(room.width, direction),
  };
  room.exits.push(exit);
  carveExitApproach(room.tiles, exit);
  room.tiles[exit.position.y][exit.position.x] = {
    kind: "exit",
    exitDirection: direction,
  };
}

function reserveHammerVaultDeadEnd(
  state: AdventureState,
  path: Position[],
): void {
  const target = path[path.length - 1];
  const predecessor = path[path.length - 2];
  if (!target || !predecessor) return;
  for (const direction of DIRECTIONS) {
    const offset = DIRECTION_OFFSETS[direction];
    const neighborPosition = { x: target.x + offset.x, y: target.y + offset.y };
    if (positionsEqual(neighborPosition, predecessor)) continue;
    const neighborKey = roomKey(neighborPosition);
    const neighbor = state.rooms[neighborKey];
    if (!neighbor) continue;
    const entranceDirection = oppositeDirection(direction);
    const entrance = neighbor.exits.find((exit) => exit.direction === entranceDirection);
    if (!entrance) continue;
    const repaired = cloneDungeonRoom(neighbor);
    repaired.exits = repaired.exits.filter((exit) => exit.direction !== entranceDirection);
    repaired.tiles[entrance.position.y][entrance.position.x] = { kind: "wall" };
    state.rooms[neighborKey] = repaired;
  }
}


function currentAdventureRoom(state: AdventureState): DungeonRoom {
  return state.rooms[state.currentRoomKey];
}

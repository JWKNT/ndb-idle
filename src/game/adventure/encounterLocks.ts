import type { Position } from "../types";
import { unlockLotteryRoomIfResolved } from "./lottery";
import { DIRECTION_OFFSETS, oppositeDirection, roomKey } from "./geometry";
import { cloneAdventureForRoom, cloneDungeonRoom } from "./state";
import type {
  AdventureExit,
  AdventureState,
  AdventureTileKind,
  DungeonRoom,
  ExitDirection,
} from "./types";

type EncounterGateKind = "lotteryGate" | "diceGate" | "clayGate" | "forgeGate";

/**
 * Seals or opens every doorway on both sides of an encounter room. A gate on
 * only the encounter side still lets a second explorer cross from the adjacent
 * room, so reciprocal doorway tiles carry the owning room key as well.
 */
export function updateLockedRoomBoundary(
  rooms: Record<string, DungeonRoom>,
  lockedRoomKey: string,
  gateKind: EncounterGateKind,
  locked: boolean,
): Record<string, DungeonRoom> {
  const lockedRoom = rooms[lockedRoomKey];
  if (!lockedRoom) return rooms;
  let nextRooms = rooms;
  const mutableRooms = new Map<string, DungeonRoom>();
  const mutableRoom = (key: string): DungeonRoom | null => {
    const source = nextRooms[key];
    if (!source) return null;
    const existing = mutableRooms.get(key);
    if (existing) return existing;
    const clone = cloneDungeonRoom(source);
    mutableRooms.set(key, clone);
    nextRooms = { ...nextRooms, [key]: clone };
    return clone;
  };
  const setDoorway = (
    targetRoomKey: string,
    exit: AdventureExit,
    allowLegacyLocalGate: boolean,
  ) => {
    const targetRoom = mutableRoom(targetRoomKey);
    if (!targetRoom) return;
    const current = targetRoom.tiles[exit.position.y]?.[exit.position.x];
    if (!current) return;
    if (locked) {
      targetRoom.tiles[exit.position.y][exit.position.x] = {
        kind: gateKind,
        exitDirection: exit.direction,
        gateRoomKey: lockedRoomKey,
      };
      return;
    }
    if (
      current.gateRoomKey === lockedRoomKey
      || (allowLegacyLocalGate && current.kind === gateKind)
    ) {
      targetRoom.tiles[exit.position.y][exit.position.x] = {
        kind: "exit",
        exitDirection: exit.direction,
      };
    }
  };

  for (const exit of lockedRoom.exits) {
    setDoorway(lockedRoomKey, exit, true);
    const neighborKey = roomKey({
      x: lockedRoom.position.x + DIRECTION_OFFSETS[exit.direction].x,
      y: lockedRoom.position.y + DIRECTION_OFFSETS[exit.direction].y,
    });
    const neighbor = nextRooms[neighborKey];
    const reciprocal = neighbor?.exits.find(
      (candidate) => candidate.direction === oppositeDirection(exit.direction),
    );
    if (neighbor && reciprocal) setDoorway(neighborKey, reciprocal, false);
  }
  return nextRooms;
}

export function updateStateLockedRoomBoundary(
  state: AdventureState,
  lockedRoomKey: string,
  gateKind: EncounterGateKind,
  locked: boolean,
): DungeonRoom {
  state.rooms = updateLockedRoomBoundary(state.rooms, lockedRoomKey, gateKind, locked);
  return state.rooms[lockedRoomKey];
}

/**
 * Before combat begins, an arena is a one-way staging room: the doorway used
 * to discover it stays open while every other doorway is gated on both sides.
 */
export function updateForgeArenaWaitingBoundary(
  rooms: Record<string, DungeonRoom>,
  arenaRoomKey: string,
  entranceDirection: ExitDirection,
): Record<string, DungeonRoom> {
  let nextRooms = updateLockedRoomBoundary(rooms, arenaRoomKey, "forgeGate", true);
  const arena = nextRooms[arenaRoomKey];
  const entrance = arena?.exits.find((exit) => exit.direction === entranceDirection);
  if (!arena || !entrance) return nextRooms;

  const openedArena = cloneDungeonRoom(arena);
  openedArena.tiles[entrance.position.y][entrance.position.x] = {
    kind: "exit",
    exitDirection: entrance.direction,
  };
  nextRooms = { ...nextRooms, [arenaRoomKey]: openedArena };

  const neighborKey = roomKey({
    x: arena.position.x + DIRECTION_OFFSETS[entrance.direction].x,
    y: arena.position.y + DIRECTION_OFFSETS[entrance.direction].y,
  });
  const neighbor = nextRooms[neighborKey];
  const reciprocal = neighbor?.exits.find(
    (candidate) => candidate.direction === oppositeDirection(entrance.direction),
  );
  if (neighbor && reciprocal) {
    const openedNeighbor = cloneDungeonRoom(neighbor);
    openedNeighbor.tiles[reciprocal.position.y][reciprocal.position.x] = {
      kind: "exit",
      exitDirection: reciprocal.direction,
    };
    nextRooms = { ...nextRooms, [neighborKey]: openedNeighbor };
  }
  return nextRooms;
}

export function resolveLotteryRoomIfCleared(state: AdventureState, room: DungeonRoom): boolean {
  if (!unlockLotteryRoomIfResolved(room)) return false;
  updateStateLockedRoomBoundary(state, room.key, "lotteryGate", false);
  return true;
}

export function resolveForgeArenaIfCleared(state: AdventureState, room: DungeonRoom): boolean {
  if (
    room.kind !== "forgeArena"
    || !room.forgeArenaStarted
    || room.forgeArenaResolved
    || findTiles(room, "enemy").length > 0
  ) return false;
  room.forgeArenaResolved = true;
  state.forgeArenasCleared = Math.max(
    state.forgeArenasCleared ?? 0,
    room.forgeArenaOrdinal ?? (state.forgeArenasCleared ?? 0) + 1,
  );
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      const tile = room.tiles[y][x];
      if (tile.kind === "forgeGate" && tile.exitDirection) {
        room.tiles[y][x] = { kind: "exit", exitDirection: tile.exitDirection };
      }
    }
  }
  updateStateLockedRoomBoundary(state, room.key, "forgeGate", false);
  return true;
}

function openDiceRoomGates(room: DungeonRoom): void {
  if (room.kind !== "dice") return;
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      const tile = room.tiles[y][x];
      if (tile.kind === "diceGate" && tile.exitDirection) {
        room.tiles[y][x] = { kind: "exit", exitDirection: tile.exitDirection };
      }
    }
  }
}

export function settleDiceRoomRoll(state: AdventureState): AdventureState {
  const room = currentAdventureRoom(state);
  if (room.kind !== "dice" || !room.diceRolling || !room.diceRolled) return state;
  const next = cloneAdventureForRoom(state, room.key);
  const nextRoom = currentAdventureRoom(next);
  nextRoom.diceRolling = false;
  openDiceRoomGates(nextRoom);
  updateStateLockedRoomBoundary(next, nextRoom.key, "diceGate", false);
  const total = nextRoom.diceValue ?? (nextRoom.diceValues?.[0] ?? 1) + (nextRoom.diceValues?.[1] ?? 1);
  next.log = [
    `The dice land on ${nextRoom.diceValues?.[0] ?? 1} and ${nextRoom.diceValues?.[1] ?? 1}. Every gate reopens! A weakening curse lowers non-vital stats by 25% for ${total} party turns. The dice call this a prize. The dice are LIARS.`,
    ...next.log,
  ].slice(0, 8);
  return next;
}

function currentAdventureRoom(state: AdventureState): DungeonRoom {
  return state.rooms[state.currentRoomKey];
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

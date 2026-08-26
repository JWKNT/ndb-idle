import type { Position } from "@/game/types";
import {
  isOnRoom,
  manhattanDistance,
  neighbors,
  parsePositionKey,
  positionKey,
} from "./geometry";
import { isBlockedTile, movementCost } from "./tileRules";
import type { DungeonRoom } from "./types";

export function reachableWalkableTileKeys(room: DungeonRoom, start: Position): Set<string> {
  if (!isOnRoom(room, start) || isBlockedTile(room.tiles[start.y][start.x])) return new Set();
  const queue = [start];
  const visited = new Set([positionKey(start)]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const next of neighbors(current)) {
      const key = positionKey(next);
      if (visited.has(key) || !isOnRoom(room, next) || isBlockedTile(room.tiles[next.y][next.x])) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return visited;
}

export function countWalkableTiles(room: DungeonRoom): number {
  let walkable = 0;
  for (const row of room.tiles) {
    for (const tile of row) if (!isBlockedTile(tile)) walkable += 1;
  }
  return walkable;
}

export function firstWalkableTile(room: DungeonRoom): Position | null {
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (!isBlockedTile(room.tiles[y][x])) return { x, y };
    }
  }
  return null;
}

export function allWalkableTilesConnected(room: DungeonRoom, start: Position): boolean {
  return reachableWalkableTileKeys(room, start).size === countWalkableTiles(room);
}

export function allNonWallTilesReachable(
  room: DungeonRoom,
  start: Position = firstWalkableTile(room) ?? { x: 0, y: 0 },
): boolean {
  if (isBlockedTile(room.tiles[start.y]?.[start.x] ?? { kind: "wall" })) return false;
  return allWalkableTilesConnected(room, start);
}

export function repairRoomConnectivity(room: DungeonRoom, start: Position): void {
  for (let attempt = 0; attempt < room.width * room.height; attempt += 1) {
    if (allNonWallTilesReachable(room, start)) break;
    if (carveShortestComponentConnection(room, start) === 0) break;
  }
}

function carveShortestComponentConnection(room: DungeonRoom, start: Position): number {
  const connected = reachableWalkableTileKeys(room, start);
  const targets = new Set<string>();
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      const key = positionKey({ x, y });
      if (!isBlockedTile(room.tiles[y][x]) && !connected.has(key)) targets.add(key);
    }
  }
  if (targets.size === 0) return 0;

  const frontier = [...connected].map((key) => ({ position: parsePositionKey(key), cost: 0 }));
  const best = new Map<string, number>([...connected].map((key) => [key, 0]));
  const previous = new Map<string, string | null>([...connected].map((key) => [key, null]));
  let destinationKey: string | null = null;

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost || a.position.y - b.position.y || a.position.x - b.position.x);
    const current = frontier.shift();
    if (!current) break;
    const currentKey = positionKey(current.position);
    if (targets.has(currentKey)) {
      destinationKey = currentKey;
      break;
    }
    for (const next of neighbors(current.position)) {
      if (!isOnRoom(room, next)) continue;
      const tile = room.tiles[next.y][next.x];
      if (tile.kind === "cage" || tile.kind === "shopkeeperCage") continue;
      if (
        tile.kind === "wall"
        && (next.x === 0 || next.y === 0 || next.x === room.width - 1 || next.y === room.height - 1)
      ) continue;
      const nextKey = positionKey(next);
      const cost = current.cost + (tile.kind === "wall" ? 1_000 : 1);
      if (cost >= (best.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
      best.set(nextKey, cost);
      previous.set(nextKey, currentKey);
      frontier.push({ position: next, cost });
    }
  }
  if (!destinationKey) return 0;

  let carved = 0;
  let cursor: string | null = destinationKey;
  while (cursor && previous.get(cursor) !== null) {
    const position = parsePositionKey(cursor);
    if (room.tiles[position.y][position.x].kind === "wall") {
      room.tiles[position.y][position.x] = { kind: "floor" };
      carved += 1;
    }
    cursor = previous.get(cursor) ?? null;
  }
  return carved;
}

export function cheapestFirstStep(
  room: DungeonRoom,
  start: Position,
  targets: Position[],
  occupiedPositions: Position[] = [],
  avoidManualInteractions = false,
  allowedSpecialPortals: readonly ("waterPortal" | "forgePortal")[] = [],
  avoidOptionalEncounters = false,
  avoidGold = false,
  preferDirectRoute = false,
): Position | null {
  if (targets.length === 0) return null;
  const targetKeys = new Set(targets.map(positionKey));
  const occupied = new Set(occupiedPositions.map(positionKey));
  const frontier: Array<{ position: Position; cost: number; first: Position | null }> = [
    { position: start, cost: 0, first: null },
  ];
  const best = new Map<string, number>([[positionKey(start), 0]]);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost || a.position.y - b.position.y || a.position.x - b.position.x);
    const current = frontier.shift();
    if (!current) break;
    if (targetKeys.has(positionKey(current.position)) && current.first) return current.first;

    for (const next of neighbors(current.position)) {
      const nextTile = isOnRoom(room, next) ? room.tiles[next.y][next.x] : null;
      const nextKey = positionKey(next);
      if (
        !isOnRoom(room, next)
        || occupied.has(nextKey)
        || !nextTile
        || (avoidManualInteractions && nextTile.kind === "offering")
        || (avoidManualInteractions
          && (nextTile.kind === "waterPortal" || nextTile.kind === "forgePortal")
          && !allowedSpecialPortals.includes(nextTile.kind))
      ) continue;
      // Interactive characters are solid scenery, but pathfinding may still
      // bump the character as its final step so moveInAdventure can interact.
      // Treating NPCs as ordinary floor lets routes cross through them and can
      // trap both auto movement and keyboard-controlled explorers.
      if (targetKeys.has(nextKey)) return current.first ?? next;
      if (isBlockedTile(nextTile)) continue;
      const cost = current.cost + movementCost(
        nextTile,
        avoidOptionalEncounters,
        avoidGold,
        preferDirectRoute,
      );
      if (cost >= (best.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
      best.set(nextKey, cost);
      frontier.push({ position: next, cost, first: current.first ?? next });
    }
  }
  return null;
}

export function nearestFreePlayerPosition(
  room: DungeonRoom,
  preferred: Position,
  occupiedPositions: Position[],
): Position {
  const occupied = new Set(occupiedPositions.map(positionKey));
  const candidates: Position[] = [];
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].kind === "floor" && !occupied.has(positionKey({ x, y }))) {
        candidates.push({ x, y });
      }
    }
  }
  return candidates.sort((a, b) =>
    manhattanDistance(a, preferred) - manhattanDistance(b, preferred)
      || a.y - b.y
      || a.x - b.x
  )[0] ?? { ...preferred };
}

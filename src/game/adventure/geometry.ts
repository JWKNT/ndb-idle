import type { Position } from "@/game/types";
import type {
  AdventureExit,
  AdventureTile,
  DungeonRoom,
  DungeonTheme,
  ExitDirection,
  RandomSource,
} from "./types";

export const DIRECTIONS: ExitDirection[] = ["north", "east", "south", "west"];

export const DIRECTION_OFFSETS: Record<ExitDirection, Position> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

const STRAIGHT_EXIT_WEIGHT = 0.2;

export function directionLabel(direction: ExitDirection): string {
  return direction[0].toUpperCase();
}

export function roomKey(position: Position): string {
  return `${position.x},${position.y}`;
}

export function ringForPosition(position: Position): number {
  const distance = Math.max(Math.abs(position.x), Math.abs(position.y));
  return Math.ceil(distance / 3);
}

export function adventureZoneForPosition(
  position: Position,
  completedBattleNumbers: number[] = [],
  dungeonTheme: DungeonTheme = "earth",
): number {
  if (dungeonTheme === "water") return 0;
  const rawZone = ringForPosition(position);
  return completedBattleNumbers.includes(9)
    ? Math.min(5, rawZone)
    : Math.min(4, rawZone);
}

export const positionKey = roomKey;

export function parsePositionKey(key: string): Position {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

export function shuffled<T>(values: T[], random: RandomSource): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function biasedExitOrder(
  values: ExitDirection[],
  entrance: ExitDirection | null,
  random: RandomSource,
): ExitDirection[] {
  if (!entrance) return shuffled(values, random);
  const straightThrough = oppositeDirection(entrance);
  const remaining = [...values];
  const ordered: ExitDirection[] = [];
  while (remaining.length > 1) {
    const totalWeight = remaining.reduce(
      (total, direction) => total + (direction === straightThrough ? STRAIGHT_EXIT_WEIGHT : 1),
      0,
    );
    let roll = Math.max(0, Math.min(0.999999999, random())) * totalWeight;
    let selectedIndex = remaining.length - 1;
    for (let index = 0; index < remaining.length; index += 1) {
      roll -= remaining[index] === straightThrough ? STRAIGHT_EXIT_WEIGHT : 1;
      if (roll < 0) {
        selectedIndex = index;
        break;
      }
    }
    ordered.push(remaining.splice(selectedIndex, 1)[0]);
  }
  if (remaining.length === 1) ordered.push(remaining[0]);
  return ordered;
}

export function isOnRoom(room: DungeonRoom, position: Position): boolean {
  return position.x >= 0 && position.x < room.width && position.y >= 0 && position.y < room.height;
}

export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function neighbors(position: Position): Position[] {
  return [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y },
  ];
}

export function oppositeDirection(direction: ExitDirection): ExitDirection {
  if (direction === "north") return "south";
  if (direction === "east") return "west";
  if (direction === "south") return "north";
  return "east";
}

export function directionBetween(from: Position, to: Position): ExitDirection | null {
  const x = to.x - from.x;
  const y = to.y - from.y;
  if (x === 1 && y === 0) return "east";
  if (x === -1 && y === 0) return "west";
  if (x === 0 && y === 1) return "south";
  if (x === 0 && y === -1) return "north";
  return null;
}

export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function chooseExitPosition(
  size: number,
  direction: ExitDirection,
  random: RandomSource,
): Position {
  const logicalCoordinates = Array.from(
    { length: (size - 1) / 2 },
    (_, index) => index * 2 + 1,
  );
  const coordinate = logicalCoordinates[Math.floor(random() * logicalCoordinates.length)] ?? 1;
  if (direction === "north") return { x: coordinate, y: 0 };
  if (direction === "east") return { x: size - 1, y: coordinate };
  if (direction === "south") return { x: coordinate, y: size - 1 };
  return { x: 0, y: coordinate };
}

export function centeredExitPosition(size: number, direction: ExitDirection): Position {
  const coordinate = Math.floor(size / 2);
  if (direction === "north") return { x: coordinate, y: 0 };
  if (direction === "east") return { x: size - 1, y: coordinate };
  if (direction === "south") return { x: coordinate, y: size - 1 };
  return { x: 0, y: coordinate };
}

export function inwardPosition(position: Position, direction: ExitDirection): Position {
  const inward = DIRECTION_OFFSETS[oppositeDirection(direction)];
  return { x: position.x + inward.x, y: position.y + inward.y };
}

export function centerPosition(room: Pick<DungeonRoom, "width" | "height">): Position {
  return { x: Math.floor(room.width / 2), y: Math.floor(room.height / 2) };
}

export function neighborRoomKey(room: DungeonRoom, direction: ExitDirection): string {
  const offset = DIRECTION_OFFSETS[direction];
  return roomKey({ x: room.position.x + offset.x, y: room.position.y + offset.y });
}

export function carveExitApproach(tiles: AdventureTile[][], exit: AdventureExit): void {
  const inward = inwardPosition(exit.position, exit.direction);
  tiles[inward.y][inward.x] = { kind: "floor" };
}

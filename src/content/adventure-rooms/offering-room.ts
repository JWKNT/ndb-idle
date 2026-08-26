import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position, StatKey } from "../../game/types";

const OFFERING_POSITIONS: Position[] = [
  { x: 4, y: 2 },
  { x: 6, y: 4 },
  { x: 4, y: 6 },
  { x: 2, y: 4 },
];

export interface OfferingRoomLayout {
  tiles: AdventureTile[][];
}

export function createOfferingRoomTiles(
  entranceDirection: ExitDirection,
  doorOpen: boolean,
  offeringStats: StatKey[] = ["hp", "attack", "luck", "defense"],
): OfferingRoomLayout {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
    })),
  );

  for (const position of [
    { x: 4, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 4, y: 5 },
  ]) {
    const rotated = rotateForEntrance(position, entranceDirection);
    tiles[rotated.y][rotated.x] = { kind: "wall" };
  }

  for (const [index, position] of OFFERING_POSITIONS.entries()) {
    const stat = offeringStats[index];
    if (!stat) continue;
    const rotated = rotateForEntrance(position, entranceDirection);
    tiles[rotated.y][rotated.x] = { kind: "offering", offeringStat: stat };
  }

  for (let index = 0; index < 5; index += 1) {
    const rotated = rotateForEntrance({ x: index + 2, y: 0 }, entranceDirection);
    tiles[rotated.y][rotated.x] = {
      kind: "woodenDoor",
      doorOpen,
      bossBarrier: false,
      doorDirection: oppositeDirection(entranceDirection),
      doorPart: index,
    };
  }

  return { tiles };
}

function rotateForEntrance(position: Position, entrance: ExitDirection): Position {
  const dx = position.x - 4;
  const dy = position.y - 4;
  if (entrance === "south") return { ...position };
  if (entrance === "north") return { x: 4 - dx, y: 4 - dy };
  if (entrance === "west") return { x: 4 - dy, y: 4 + dx };
  return { x: 4 + dy, y: 4 - dx };
}

function oppositeDirection(direction: ExitDirection): ExitDirection {
  if (direction === "north") return "south";
  if (direction === "east") return "west";
  if (direction === "south") return "north";
  return "east";
}

import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position } from "../../game/types";

export interface MermanThroneRoomLayout {
  tiles: AdventureTile[][];
  mermanPositions: Position[];
}

export function createMermanThroneRoomTiles(
  entranceDirection: ExitDirection,
  doorOpen = false,
): MermanThroneRoomLayout {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
    })),
  );

  for (const position of [
    { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
    { x: 1, y: 2 }, { x: 7, y: 2 },
    { x: 1, y: 3 }, { x: 7, y: 3 },
    { x: 2, y: 4 }, { x: 6, y: 4 },
  ]) {
    const rotated = rotateForEntrance(position, entranceDirection);
    tiles[rotated.y][rotated.x] = { kind: "wall" };
  }

  const throne = rotateForEntrance({ x: 4, y: 1 }, entranceDirection);
  tiles[throne.y][throne.x] = { kind: "wall", decoration: "waterThrone" };

  for (let index = 0; index < 5; index += 1) {
    const rotated = rotateForEntrance({ x: index + 2, y: 8 }, entranceDirection);
    tiles[rotated.y][rotated.x] = {
      kind: "woodenDoor",
      doorOpen,
      bossBarrier: false,
      doorDirection: entranceDirection,
      doorPart: 4 - index,
    };
  }

  return {
    tiles,
    mermanPositions: [2, 4, 6].map((x) => rotateForEntrance({ x, y: 3 }, entranceDirection)),
  };
}

function rotateForEntrance(position: Position, entrance: ExitDirection): Position {
  const dx = position.x - 4;
  const dy = position.y - 4;
  if (entrance === "south") return { ...position };
  if (entrance === "north") return { x: 4 - dx, y: 4 - dy };
  if (entrance === "west") return { x: 4 - dy, y: 4 + dx };
  return { x: 4 + dy, y: 4 - dx };
}

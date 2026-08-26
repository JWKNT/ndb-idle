import type { AdventureTile } from "@/game/adventure/types";
import type { Position } from "@/game/types";

export interface HammerVaultRoomLayout {
  tiles: AdventureTile[][];
  mummyPositions: Position[];
  chestPosition: Position;
  gatePosition: Position;
}

export function createHammerVaultRoomTiles(): HammerVaultRoomLayout {
  const size = 13;
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === size - 1 || y === size - 1 ? "wall" : "floor",
      wallVariant: x === 0 || y === 0 || x === size - 1 || y === size - 1
        ? "clay-brick"
        : undefined,
    })),
  );

  // Three tomb-like bays at the rear, followed by a broad fighting floor.
  for (let y = 1; y <= 4; y += 1) {
    tiles[y][4] = { kind: "wall", wallVariant: "clay-brick" };
    tiles[y][8] = { kind: "wall", wallVariant: "clay-brick" };
  }
  for (let x = 5; x <= 7; x += 1) tiles[6][x] = { kind: "wall", wallVariant: "clay-brick" };
  tiles[7][6] = { kind: "wall", wallVariant: "clay-brick" };

  const mummyPositions = [{ x: 2, y: 2 }, { x: 9, y: 2 }];
  mummyPositions.forEach((position, index) => {
    const enemyId = `hammer-mummy-${index + 1}`;
    const footprint = [
      { x: position.x, y: position.y, enemyPart: 0 as const },
      { x: position.x + 1, y: position.y, enemyPart: 1 as const },
      { x: position.x, y: position.y + 1, enemyPart: 2 as const },
      { x: position.x + 1, y: position.y + 1, enemyPart: 3 as const },
    ];
    for (const part of footprint) {
      tiles[part.y][part.x] = {
        kind: "enemy",
        enemyId,
        enemyKind: "mummy",
        enemyPart: part.enemyPart,
      };
    }
  });

  const chestPosition = { x: 6, y: 2 };
  const gatePosition = { x: 6, y: 12 };
  tiles[gatePosition.y][gatePosition.x] = { kind: "clayGate", exitDirection: "south" };
  return { tiles, mummyPositions, chestPosition, gatePosition };
}

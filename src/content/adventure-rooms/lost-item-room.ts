import type { AdventureTile } from "@/game/adventure/types";

export function createLostItemRoomTiles(): AdventureTile[][] {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x > 0 && x < 8 && y > 0 && y < 8
        && (x === 4 || y === 4 || (x >= 3 && x <= 5 && y >= 3 && y <= 5))
        ? "floor"
        : "wall",
    })),
  );
  tiles[4][4] = { kind: "rodKeeper" };
  return tiles;
}

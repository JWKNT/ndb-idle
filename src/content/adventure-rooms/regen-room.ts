import type { AdventureTile } from "@/game/adventure/types";

export function createRegenRoomTiles(size = 9): AdventureTile[][] {
  const center = Math.floor(size / 2);
  const springStart = center - 1;
  const springEnd = center + 1;
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return { kind: "wall" };
      if (x >= springStart && x <= springEnd && y >= springStart && y <= springEnd) {
        return {
          kind: "regen",
          regenPartX: x - springStart,
          regenPartY: y - springStart,
        };
      }
      return { kind: "floor" };
    }),
  );
  for (const position of [
    { x: center - 2, y: center - 2 },
    { x: center + 2, y: center - 2 },
    { x: center - 2, y: center + 2 },
    { x: center + 2, y: center + 2 },
  ]) {
    tiles[position.y][position.x].decoration = "springReeds";
  }
  return tiles;
}

import type { AdventureTile } from "@/game/adventure/types";

export function createDiceRoomTiles(size: number): AdventureTile[][] {
  const center = Math.floor(size / 2);
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === size - 1 || y === size - 1
        ? "wall"
        : "floor",
    })),
  );
  // Two distinct 3x3 dice share the middle band, separated by the room's
  // exact center tile where the explorer starts the roll.
  const dieTop = center - 1;
  const dieStarts = [center - 3, center + 1] as const;
  dieStarts.forEach((startX, diceIndex) => {
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        tiles[dieTop + y][startX + x] = {
          kind: "diceDisplay",
          dicePartX: x,
          dicePartY: y,
          diceIndex: diceIndex as 0 | 1,
        };
      }
    }
  });
  tiles[center][center] = { kind: "dicePedestal" };
  return tiles;
}

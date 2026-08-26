import type { AdventureTile } from "@/game/adventure/types";

export const MIMIC_TREASURE_CHANCE = 0.2;

export function createTreasureRoomTiles(
  mimicDisguise = false,
  size = 9,
): AdventureTile[][] {
  const center = Math.floor(size / 2);
  const accentRows = new Set([center - 2, center + 2]);
  const accentColumns = new Set([center - 1, center + 1]);
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return { kind: "wall" };
      if (x === center && y === center) return { kind: "treasureChest", mimicDisguise };
      if (accentRows.has(y) && accentColumns.has(x)) return { kind: "wall" };
      return { kind: "floor" };
    }),
  );
}

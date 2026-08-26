import type { Terrain } from "../../game/types";

export function battleTerrain(width: number, height: number): Terrain[][] {
  const neutralStart = Math.floor((width - 3) / 2);
  const neutralEnd = neutralStart + 3;
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, (_, x) =>
      x < neutralStart ? "player" : x < neutralEnd ? "neutral" : "enemy"
    ),
  );
}

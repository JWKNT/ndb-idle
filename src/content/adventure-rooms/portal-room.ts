import type { AdventureTile } from "@/game/adventure/types";

export function createPortalRoomTiles(
  portalKind: "portal" | "waterPortal" | "forgePortal" = "portal",
  size = 9,
  wallVariant?: AdventureTile["wallVariant"],
): AdventureTile[][] {
  const center = Math.floor(size / 2);
  const portalStart = center - 1;
  const portalEnd = center + 1;
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
        return { kind: "wall", wallVariant };
      }
      if (x >= portalStart && x <= portalEnd && y >= portalStart && y <= portalEnd) {
        return {
          kind: portalKind,
          portalPartX: x - portalStart,
          portalPartY: y - portalStart,
        };
      }
      return { kind: "floor" };
    }),
  );
  for (const position of [
    { x: center, y: center - 2 },
    { x: center + 2, y: center },
    { x: center, y: center + 2 },
    { x: center - 2, y: center },
  ]) {
    tiles[position.y][position.x].decoration = "portalRune";
  }
  return tiles;
}

import type { AdventureTile, ExitDirection } from "@/game/adventure/types";

export function createOddityBrewerRoomTiles(entryDirection: ExitDirection): AdventureTile[][] {
  const size = 9;
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === size - 1 || y === size - 1 ? "wall" : "floor",
    })),
  );
  const place = (x: number, y: number, kind: AdventureTile["kind"]) => {
    const position = rotate({ x, y }, entryDirection);
    tiles[position.y][position.x] = { kind };
  };
  place(6, 4, "oddityBrewer");
  place(6, 2, "potionCauldron");
  place(2, 2, "potionShelf");
  place(2, 6, "potionShelf");
  place(5, 6, "potionTable");
  for (const { x, y, decoration } of [
    { x: 3, y: 2, decoration: "potionBottleCrate" as const },
    { x: 3, y: 6, decoration: "potionHerbs" as const },
    { x: 5, y: 2, decoration: "earthEmberPile" as const },
    { x: 4, y: 4, decoration: "shopRug" as const },
  ]) {
    const position = rotate({ x, y }, entryDirection);
    tiles[position.y][position.x].decoration = decoration;
  }
  return tiles;
}

function rotate(position: { x: number; y: number }, entry: ExitDirection) {
  const dx = position.x - 4;
  const dy = position.y - 4;
  if (entry === "west") return position;
  if (entry === "east") return { x: 4 - dx, y: 4 - dy };
  if (entry === "north") return { x: 4 + dy, y: 4 - dx };
  return { x: 4 - dy, y: 4 + dx };
}

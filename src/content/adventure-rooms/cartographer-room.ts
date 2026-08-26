import type { AdventureTile, ExitDirection } from "@/game/adventure/types";

export function createCartographerRoomTiles(entryDirection: ExitDirection): AdventureTile[][] {
  const size = 9;
  const tiles = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x): AdventureTile => ({
    kind: x === 0 || y === 0 || x === size - 1 || y === size - 1 ? "wall" : "floor",
  })));
  const npc = rotate({ x: 6, y: 4 }, entryDirection);
  // Leave the square in front of the Cartographer open for conversation.
  const table = rotate({ x: 6, y: 3 }, entryDirection);
  tiles[npc.y][npc.x] = { kind: "cartographer" };
  tiles[table.y][table.x] = { kind: "mapTable" };
  for (const { position, decoration } of [
    { position: { x: 2, y: 2 }, decoration: "cartographerScrolls" as const },
    { position: { x: 2, y: 6 }, decoration: "cartographerTripod" as const },
    { position: { x: 4, y: 2 }, decoration: "cartographerCompass" as const },
    { position: { x: 4, y: 6 }, decoration: "cartographerScrolls" as const },
    { position: { x: 3, y: 4 }, decoration: "shopRug" as const },
  ]) {
    const p = rotate(position, entryDirection);
    tiles[p.y][p.x].decoration = decoration;
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

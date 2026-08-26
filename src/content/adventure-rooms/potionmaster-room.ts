import type { AdventureTile } from "@/game/adventure/types";
import type { Position } from "@/game/types";

export interface PotionmasterRoomLayout {
  tiles: AdventureTile[][];
  potionmasterPosition: Position;
}

export function createPotionmasterRoomTiles(): PotionmasterRoomLayout {
  const size = 11;
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === size - 1 || y === size - 1 ? "wall" : "floor",
      wallVariant: x === 0 || y === 0 || x === size - 1 || y === size - 1
        ? "volcanic"
        : undefined,
    })),
  );
  const potionmasterPosition = { x: 7, y: 5 };
  const fixtures: Array<{ position: Position; kind: AdventureTile["kind"] }> = [
    { position: { x: 2, y: 2 }, kind: "potionShelf" },
    { position: { x: 3, y: 2 }, kind: "potionShelf" },
    { position: { x: 7, y: 2 }, kind: "potionShelf" },
    { position: { x: 8, y: 2 }, kind: "potionShelf" },
    { position: { x: 3, y: 5 }, kind: "potionCauldron" },
    { position: { x: 5, y: 4 }, kind: "potionTable" },
    { position: { x: 2, y: 8 }, kind: "potionTable" },
    { position: { x: 8, y: 8 }, kind: "potionCauldron" },
  ];
  for (const fixture of fixtures) {
    tiles[fixture.position.y][fixture.position.x] = { kind: fixture.kind };
  }
  for (const { position, decoration } of [
    { position: { x: 2, y: 4 }, decoration: "potionHerbs" as const },
    { position: { x: 8, y: 4 }, decoration: "potionBottleCrate" as const },
    { position: { x: 5, y: 7 }, decoration: "potionHerbs" as const },
    { position: { x: 7, y: 7 }, decoration: "potionBottleCrate" as const },
    { position: { x: 4, y: 6 }, decoration: "earthEmberPile" as const },
  ]) {
    tiles[position.y][position.x].decoration = decoration;
  }
  tiles[potionmasterPosition.y][potionmasterPosition.x] = { kind: "potionmaster" };
  return { tiles, potionmasterPosition };
}

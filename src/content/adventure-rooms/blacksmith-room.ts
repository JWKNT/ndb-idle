import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position } from "@/game/types";

export interface BlacksmithRoomLayout {
  tiles: AdventureTile[][];
  blacksmithPosition: Position;
}

export function createBlacksmithRoomTiles(_entryDirection: ExitDirection): BlacksmithRoomLayout {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
      wallVariant: x === 0 || y === 0 || x === 8 || y === 8 ? "clay-brick" : undefined,
    })),
  );
  const blacksmithPosition = { x: 6, y: 4 };
  const workshopFixtures: Array<{ position: Position; kind: AdventureTile["kind"] }> = [
    { position: { x: 2, y: 2 }, kind: "blacksmithToolRack" },
    { position: { x: 3, y: 2 }, kind: "blacksmithSupplies" },
    { position: { x: 6, y: 2 }, kind: "blacksmithForge" },
    { position: { x: 5, y: 3 }, kind: "blacksmithAnvil" },
    { position: { x: 2, y: 6 }, kind: "blacksmithSupplies" },
    { position: { x: 5, y: 6 }, kind: "blacksmithWorkbench" },
    { position: { x: 6, y: 6 }, kind: "blacksmithToolRack" },
  ];
  for (const fixture of workshopFixtures) {
    const position = fixture.position;
    tiles[position.y][position.x] = { kind: fixture.kind };
  }
  tiles[blacksmithPosition.y][blacksmithPosition.x] = { kind: "blacksmith" };
  return { tiles, blacksmithPosition };
}

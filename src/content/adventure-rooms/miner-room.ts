import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position } from "@/game/types";

export interface MinerRoomLayout {
  tiles: AdventureTile[][];
  minerPosition: Position;
}

export function createMinerRoomTiles(entryDirection: ExitDirection): MinerRoomLayout {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
      wallVariant: x === 0 || y === 0 || x === 8 || y === 8 ? "clay-brick" : undefined,
    })),
  );
  const rotate = (position: Position): Position => rotateFromSouth(position, entryDirection);
  const minerPosition = rotate({ x: 4, y: 2 });
  const fixtures: Array<{ position: Position; kind: "caveRock" | "caveGem" }> = [
    { position: { x: 2, y: 2 }, kind: "caveRock" },
    { position: { x: 6, y: 2 }, kind: "caveGem" },
    { position: { x: 2, y: 4 }, kind: "caveGem" },
    { position: { x: 6, y: 4 }, kind: "caveRock" },
    { position: { x: 3, y: 6 }, kind: "caveRock" },
    { position: { x: 6, y: 6 }, kind: "caveGem" },
  ];
  for (const fixture of fixtures) {
    const position = rotate(fixture.position);
    tiles[position.y][position.x] = { kind: fixture.kind };
  }
  for (const { position: source, decoration } of [
    { position: { x: 4, y: 3 }, decoration: "miningRails" as const },
    { position: { x: 4, y: 4 }, decoration: "miningMinecart" as const },
    { position: { x: 4, y: 6 }, decoration: "miningRails" as const },
    { position: { x: 2, y: 6 }, decoration: "miningTimber" as const },
    { position: { x: 6, y: 6 }, decoration: "miningLantern" as const },
    { position: { x: 2, y: 3 }, decoration: "miningOreVein" as const },
    { position: { x: 6, y: 3 }, decoration: "miningRubble" as const },
  ]) {
    const position = rotate(source);
    if (tiles[position.y][position.x].kind === "floor") tiles[position.y][position.x].decoration = decoration;
  }
  tiles[minerPosition.y][minerPosition.x] = { kind: "miner" };
  return { tiles, minerPosition };
}

function rotateFromSouth(position: Position, entryDirection: ExitDirection): Position {
  const dx = position.x - 4;
  const dy = position.y - 4;
  if (entryDirection === "south") return position;
  if (entryDirection === "north") return { x: 4 - dx, y: 4 - dy };
  if (entryDirection === "west") return { x: 4 - dy, y: 4 + dx };
  return { x: 4 + dy, y: 4 - dx };
}

import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position } from "@/game/types";

export const TOWER_EXTERIOR_SIZE = 31;
export const TOWER_DOOR_WIDTH = 7;
export const TOWER_DOOR_HEIGHT = 5;

export function createTowerExteriorRoomTiles(_entryDirection: ExitDirection = "south"): AdventureTile[][] {
  const size = TOWER_EXTERIOR_SIZE;
  const tiles = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => ({
      kind: x === 0 || x === size - 1 ? "gardenTree" : "floor",
      floorVariant: "tower-grass",
    })),
  );

  // The tower is embedded into the northern boundary and continues beyond the
  // room, so even the first full view can never reveal its roof.
  for (let y = 0; y <= 9; y += 1) {
    const inset = y < 3 ? 2 : 0;
    for (let x = 3 + inset; x <= 27 - inset; x += 1) {
      tiles[y][x] = { kind: "towerWall" };
    }
  }

  const doorLeft = 12;
  const doorTop = 5;
  for (let partY = 0; partY < TOWER_DOOR_HEIGHT; partY += 1) {
    for (let partX = 0; partX < TOWER_DOOR_WIDTH; partX += 1) {
      tiles[doorTop + partY][doorLeft + partX] = {
        kind: "towerDoor",
        towerPartX: partX,
        towerPartY: partY,
      };
    }
  }

  // The lowest garden tiles still bear the volcanic scar of zone 4. A narrow
  // stone causeway is the only calm route away from the threshold.
  for (let y = 27; y < size; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      tiles[y][x] = { kind: "floor", floorVariant: "tower-magma" };
    }
  }

  for (let y = 10; y <= 29; y += 1) {
    const halfWidth = y <= 14 ? 3 : y <= 23 ? 2 : 1;
    for (let x = 15 - halfWidth; x <= 15 + halfWidth; x += 1) {
      tiles[y][x] = { kind: "floor", floorVariant: "tower-path" };
    }
  }

  // Two irregular reflecting pools break up the gardens without closing the
  // processional path or making any walkable pocket unreachable.
  for (const left of [3, 23]) {
    for (let y = 16; y <= 20; y += 1) {
      for (let x = left; x <= left + 4; x += 1) {
        const corner = (x === left || x === left + 4) && (y === 16 || y === 20);
        if (!corner) tiles[y][x] = { kind: "gardenWater" };
      }
    }
  }

  const fixtures: Array<{ position: Position; kind: AdventureTile["kind"] }> = [
    { position: { x: 10, y: 11 }, kind: "gardenStatue" },
    { position: { x: 20, y: 11 }, kind: "gardenStatue" },
    { position: { x: 5, y: 18 }, kind: "gardenFountain" },
    { position: { x: 25, y: 18 }, kind: "gardenFountain" },
    { position: { x: 10, y: 19 }, kind: "gardenBench" },
    { position: { x: 20, y: 19 }, kind: "gardenBench" },
    { position: { x: 9, y: 14 }, kind: "gardenFlowers" },
    { position: { x: 21, y: 14 }, kind: "gardenFlowers" },
    { position: { x: 10, y: 23 }, kind: "gardenFlowers" },
    { position: { x: 20, y: 23 }, kind: "gardenFlowers" },
    { position: { x: 3, y: 11 }, kind: "gardenTree" },
    { position: { x: 27, y: 11 }, kind: "gardenTree" },
    { position: { x: 6, y: 13 }, kind: "gardenTree" },
    { position: { x: 24, y: 13 }, kind: "gardenTree" },
    { position: { x: 4, y: 23 }, kind: "gardenTree" },
    { position: { x: 26, y: 23 }, kind: "gardenTree" },
    { position: { x: 8, y: 25 }, kind: "gardenTree" },
    { position: { x: 22, y: 25 }, kind: "gardenTree" },
  ];
  for (const fixture of fixtures) tiles[fixture.position.y][fixture.position.x] = { kind: fixture.kind };

  const scenery: Array<{ position: Position; decoration: NonNullable<AdventureTile["decoration"]> }> = [
    { position: { x: 11, y: 12 }, decoration: "towerBanner" },
    { position: { x: 19, y: 12 }, decoration: "towerBanner" },
    { position: { x: 13, y: 15 }, decoration: "gardenLantern" },
    { position: { x: 17, y: 15 }, decoration: "gardenLantern" },
    { position: { x: 12, y: 21 }, decoration: "gardenLantern" },
    { position: { x: 18, y: 21 }, decoration: "gardenLantern" },
    { position: { x: 3, y: 14 }, decoration: "gardenHedge" },
    { position: { x: 7, y: 17 }, decoration: "gardenHedge" },
    { position: { x: 23, y: 17 }, decoration: "gardenHedge" },
    { position: { x: 27, y: 14 }, decoration: "gardenHedge" },
    { position: { x: 6, y: 24 }, decoration: "gardenLeaves" },
    { position: { x: 11, y: 25 }, decoration: "gardenLeaves" },
    { position: { x: 19, y: 25 }, decoration: "gardenLeaves" },
    { position: { x: 24, y: 24 }, decoration: "gardenLeaves" },
  ];
  for (const { position, decoration } of scenery) {
    if (tiles[position.y][position.x].kind === "floor") tiles[position.y][position.x].decoration = decoration;
  }

  // The room has exactly one entrance. Every zone-4 frontier arrives here and
  // returns through this same southern threshold.
  for (let x = 0; x < size; x += 1) {
    tiles[size - 1][x] = x === 15
      ? { kind: "exit", exitDirection: "south", floorVariant: "tower-magma" }
      : { kind: "wall", wallVariant: "volcanic" };
  }
  tiles[size - 2][15] = { kind: "floor", floorVariant: "tower-path" };
  return tiles;
}

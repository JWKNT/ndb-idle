import type { AdventureEnemyKind, AdventureExit, AdventureTile } from "@/game/adventure/types";
import type { GearSlot } from "@/game/gear";
import type { PotionId } from "@/game/potions";
import type { Position } from "@/game/types";
import { adventureEnemyStats } from "@/game/adventure/enemies";

export const FORGE_ROOM_SIZE = 11;
export const FORGE_ARENA_POOL: AdventureEnemyKind[] = [
  "forgeling", "chain-forgeling", "bellows-forgeling", "hammer-forgeling",
];

export function createForgeRoomTiles(): AdventureTile[][] {
  return Array.from({ length: FORGE_ROOM_SIZE }, (_, y) =>
    Array.from({ length: FORGE_ROOM_SIZE }, (_, x): AdventureTile =>
      x === 0 || y === 0 || x === FORGE_ROOM_SIZE - 1 || y === FORGE_ROOM_SIZE - 1
        ? { kind: "wall", wallVariant: "forge" }
        : { kind: "floor" }
    )
  );
}

/** Adds restrained, symmetrical workshop clutter without closing the room. */
export function decorateForgeNormalRoom(tiles: AdventureTile[][], variant: number): void {
  const oddLayout = variant % 2 === 1;
  const pillars: Position[] = oddLayout
    ? [{ x: 2, y: 3 }, { x: 8, y: 3 }, { x: 2, y: 7 }, { x: 8, y: 7 }]
    : [{ x: 3, y: 2 }, { x: 7, y: 2 }, { x: 3, y: 8 }, { x: 7, y: 8 }];
  for (const position of pillars) {
    tiles[position.y][position.x] = { kind: "wall", wallVariant: "forge" };
  }
  const props: Array<[Position, AdventureTile["kind"]]> = oddLayout
    ? [
        [{ x: 3, y: 3 }, "blacksmithSupplies"],
        [{ x: 7, y: 3 }, "blacksmithToolRack"],
        [{ x: 3, y: 7 }, "blacksmithWorkbench"],
        [{ x: 7, y: 7 }, "blacksmithAnvil"],
      ]
    : [
        [{ x: 2, y: 3 }, "blacksmithToolRack"],
        [{ x: 8, y: 3 }, "blacksmithSupplies"],
        [{ x: 2, y: 7 }, "blacksmithAnvil"],
        [{ x: 8, y: 7 }, "blacksmithWorkbench"],
      ];
  for (const [position, kind] of props) tiles[position.y][position.x] = { kind };
}

export function createForgeBlueprintRoomTiles(): AdventureTile[][] {
  const height = 13;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: FORGE_ROOM_SIZE }, (_, x): AdventureTile =>
      x === 0 || y === 0 || x === FORGE_ROOM_SIZE - 1 || y === height - 1
        ? { kind: "wall", wallVariant: "forge" }
        : { kind: "floor" }
    )
  );
  // The plans sit in a narrow nook cut into the back wall. Paired pillars and
  // workshop relics frame the final 4x4 floor recipe without obscuring it.
  for (let x = 1; x <= 9; x += 1) tiles[3][x] = { kind: "wall", wallVariant: "forge" };
  for (let y = 1; y <= 3; y += 1) {
    for (let x = 4; x <= 6; x += 1) tiles[y][x] = { kind: "floor" };
  }
  tiles[2][5] = { kind: "forgeBlueprintChest" };
  for (const position of [
    { x: 1, y: 5 }, { x: 9, y: 5 },
    { x: 1, y: 7 }, { x: 9, y: 7 },
    { x: 1, y: 9 }, { x: 9, y: 9 },
  ]) {
    tiles[position.y][position.x] = { kind: "wall", wallVariant: "forge" };
  }
  tiles[1][2] = { kind: "blacksmithToolRack" };
  tiles[1][8] = { kind: "blacksmithSupplies" };
  tiles[11][2] = { kind: "blacksmithWorkbench" };
  tiles[11][8] = { kind: "blacksmithAnvil" };
  return tiles;
}

/**
 * A repeat-visit vault that preserves the tower-key clue after the one-time
 * Blueprint reliquary disappears. Unlike that 11x13 objective room, vaults
 * use the Forge's ordinary 11x11 footprint (a 9x9 interior) and place their
 * reward in the center.
 */
export function createForgeTreasureRoomTiles(
  reward: { gearSlot?: GearSlot; potionId?: PotionId },
): AdventureTile[][] {
  const tiles = createForgeRoomTiles();

  tiles[5][5] = { kind: "treasureChest", ...reward };

  // Keep the 4x4 clue readable while giving the room the feel of a compact,
  // well-used vault. Odd-coordinate furnishings do not cover recipe markers.
  tiles[1][1] = { kind: "blacksmithToolRack" };
  tiles[1][9] = { kind: "blacksmithSupplies" };
  tiles[9][1] = { kind: "blacksmithWorkbench" };
  tiles[9][9] = { kind: "blacksmithAnvil" };
  for (const position of [
    { x: 1, y: 3 }, { x: 9, y: 3 },
    { x: 1, y: 7 }, { x: 9, y: 7 },
  ]) {
    tiles[position.y][position.x] = { kind: "wall", wallVariant: "forge" };
  }
  return tiles;
}

export function sealForgeArena(tiles: AdventureTile[][], exits: AdventureExit[]): void {
  exits.forEach((exit) => {
    tiles[exit.position.y][exit.position.x] = { kind: "forgeGate", exitDirection: exit.direction };
  });
}

export function spawnForgeArenaEnemies(
  tiles: AdventureTile[][],
  roomKey: string,
  ordinal: number,
  random: () => number,
): void {
  const corners: Position[] = [{ x: 2, y: 2 }, { x: 8, y: 2 }, { x: 2, y: 8 }, { x: 8, y: 8 }];
  corners.forEach((position, index) => {
    const offset = Math.floor(Math.max(0, Math.min(.999999, random())) * FORGE_ARENA_POOL.length);
    const kind = FORGE_ARENA_POOL[(offset + ordinal + index) % FORGE_ARENA_POOL.length];
    tiles[position.y][position.x] = {
      kind: "enemy",
      enemyId: `forge-arena-${ordinal}-${roomKey}-${index + 1}`,
      enemyKind: kind,
      enemyHp: adventureEnemyStats(4, kind).hp,
      spriteFacing: position.x < 5 ? "right" : "left",
    };
  });
}

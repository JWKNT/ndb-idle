import { findTiles } from "./combatRules";
import { centerPosition } from "./geometry";
import type { DungeonRoom } from "./types";

export function openHammerVaultGate(room: DungeonRoom): void {
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      const tile = room.tiles[y][x];
      if (tile.kind === "clayGate" && tile.exitDirection) {
        room.tiles[y][x] = { kind: "exit", exitDirection: tile.exitDirection };
      }
    }
  }
}
export function revealHammerChestIfCleared(room: DungeonRoom): boolean {
  if (room.kind !== "hammerVault" || findTiles(room, "enemy").length > 0) return false;
  const position = room.hammerChestPosition ?? { x: 6, y: 2 };
  if (room.tiles[position.y]?.[position.x]?.kind === "openedChest") return false;
  room.tiles[position.y][position.x] = { kind: "hammerChest" };
  return true;
}

export function releaseShopkeeperIfCleared(room: DungeonRoom): boolean {
  if (room.kind !== "shopkeeper" || findTiles(room, "enemy").length > 0) return false;
  const cages = findTiles(room, "shopkeeperCage");
  for (const position of cages) room.tiles[position.y][position.x] = { kind: "shopkeeper" };
  return cages.length > 0;
}

export function rescueSpiderCount(room: DungeonRoom): number {
  if (room.kind !== "rescue") return 0;
  return findTiles(room, "enemy").filter((position) =>
    room.tiles[position.y][position.x].enemyKind === "spider"
  ).length;
}

export function releaseWormIfCleared(room: DungeonRoom): boolean {
  if (room.kind !== "rescue" || rescueSpiderCount(room) > 0) return false;
  const cages = findTiles(room, "cage");
  for (const position of cages) room.tiles[position.y][position.x] = { kind: "floor" };
  return cages.length > 0;
}

export function revealTridentChest(room: DungeonRoom): void {
  if (room.kind !== "mermanThrone") return;
  const center = centerPosition(room);
  room.tiles[center.y][center.x] = { kind: "tridentChest" };
}

export function openMermanThroneDoor(room: DungeonRoom): void {
  if (room.kind !== "mermanThrone") return;
  for (const row of room.tiles) {
    for (const tile of row) {
      if (tile.kind === "woodenDoor") {
        tile.doorOpen = true;
        tile.bossBarrier = false;
      }
    }
  }
}

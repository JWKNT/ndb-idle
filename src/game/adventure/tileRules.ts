import type { AdventureTile } from "./types";

export function isBlockedTile(tile: AdventureTile): boolean {
  return tile.kind === "wall"
    || tile.kind === "cage"
    || tile.kind === "lostItemChest"
    || tile.kind === "shopkeeperCage"
    || tile.kind === "shopkeeper"
    || tile.kind === "rodKeeper"
    || tile.kind === "blacksmith"
    || tile.kind === "blacksmithForge"
    || tile.kind === "blacksmithAnvil"
    || tile.kind === "blacksmithWorkbench"
    || tile.kind === "blacksmithToolRack"
    || tile.kind === "blacksmithSupplies"
    || tile.kind === "potionmaster"
    || tile.kind === "oddityBrewer"
    || tile.kind === "potionCauldron"
    || tile.kind === "potionShelf"
    || tile.kind === "potionTable"
    || tile.kind === "miner"
    || tile.kind === "cartographer"
    || tile.kind === "angler"
    || tile.kind === "diceDisplay"
    || tile.kind === "gardenTree"
    || tile.kind === "gardenFountain"
    || tile.kind === "gardenStatue"
    || tile.kind === "gardenWater"
    || tile.kind === "gardenFlowers"
    || tile.kind === "gardenBench"
    || tile.kind === "towerWall"
    || tile.kind === "towerDoor"
    || tile.kind === "caveRock"
    || tile.kind === "caveGem"
    || tile.kind === "lotteryGate"
    || tile.kind === "diceGate"
    || tile.kind === "forgeGate"
    || tile.kind === "clayGate"
    || tile.kind === "clayBoulder"
    || (tile.kind === "woodenDoor" && (!tile.doorOpen || Boolean(tile.bossBarrier)));
}

export function movementCost(
  tile: AdventureTile,
  avoidOptionalEncounters = false,
  avoidGold = false,
  preferDirectRoute = false,
): number {
  if (avoidGold && tile.kind === "gold") return 1_000;
  if (
    avoidOptionalEncounters
    && (tile.kind === "gold" || tile.kind === "enemy" || tile.kind === "treasureChest")
  ) return 1_000;
  if (preferDirectRoute && tile.kind === "enemy") return 1;
  if (tile.kind === "trap" && tile.revealed) return 35;
  if (tile.kind === "enemy") return 18;
  return 1;
}

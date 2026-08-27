import type { AdventureTileKind, DungeonRoomKind, DungeonTheme } from "./types";
import type { AdventureEnemyKind } from "./types";

type TileMovement = "walkable" | "blocked" | "conditional";
type TileRole = "terrain" | "pickup" | "conversation" | "combat" | "portal" | "puzzle" | "exit";
type TilePresentation = "floor" | "sprite" | "composite" | "hidden";

/**
 * Adventure tiles are unusually varied, so additions must still make the
 * three universal decisions every tile needs before bespoke behavior is added.
 */
export const ADVENTURE_TILE_CONTRACTS: Record<AdventureTileKind, {
  movement: TileMovement;
  role: TileRole;
  presentation: TilePresentation;
}> = {
  floor: { movement: "walkable", role: "terrain", presentation: "floor" },
  wall: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gold: { movement: "walkable", role: "pickup", presentation: "sprite" },
  treasureChest: { movement: "walkable", role: "pickup", presentation: "sprite" },
  lostItemChest: { movement: "walkable", role: "conversation", presentation: "sprite" },
  rodKeeper: { movement: "walkable", role: "conversation", presentation: "sprite" },
  tridentChest: { movement: "walkable", role: "pickup", presentation: "sprite" },
  openedChest: { movement: "walkable", role: "terrain", presentation: "sprite" },
  cage: { movement: "blocked", role: "terrain", presentation: "sprite" },
  trap: { movement: "walkable", role: "terrain", presentation: "hidden" },
  regen: { movement: "walkable", role: "terrain", presentation: "composite" },
  portal: { movement: "walkable", role: "portal", presentation: "composite" },
  waterPortal: { movement: "walkable", role: "portal", presentation: "composite" },
  forgePortal: { movement: "walkable", role: "portal", presentation: "composite" },
  forgeGate: { movement: "conditional", role: "puzzle", presentation: "composite" },
  forgeBlueprintChest: { movement: "walkable", role: "pickup", presentation: "sprite" },
  offering: { movement: "walkable", role: "puzzle", presentation: "composite" },
  woodenDoor: { movement: "conditional", role: "terrain", presentation: "composite" },
  shopkeeperCage: { movement: "blocked", role: "terrain", presentation: "sprite" },
  shopkeeper: { movement: "walkable", role: "conversation", presentation: "sprite" },
  blacksmith: { movement: "walkable", role: "conversation", presentation: "sprite" },
  blacksmithForge: { movement: "blocked", role: "terrain", presentation: "sprite" },
  blacksmithAnvil: { movement: "blocked", role: "terrain", presentation: "sprite" },
  blacksmithWorkbench: { movement: "blocked", role: "terrain", presentation: "sprite" },
  blacksmithToolRack: { movement: "blocked", role: "terrain", presentation: "sprite" },
  blacksmithSupplies: { movement: "blocked", role: "terrain", presentation: "sprite" },
  miner: { movement: "walkable", role: "conversation", presentation: "sprite" },
  caveRock: { movement: "blocked", role: "terrain", presentation: "sprite" },
  caveGem: { movement: "blocked", role: "terrain", presentation: "sprite" },
  hammerChest: { movement: "walkable", role: "pickup", presentation: "sprite" },
  clayGate: { movement: "conditional", role: "puzzle", presentation: "sprite" },
  clayBoulder: { movement: "blocked", role: "terrain", presentation: "sprite" },
  lotteryWheel: { movement: "walkable", role: "puzzle", presentation: "composite" },
  lotteryGate: { movement: "conditional", role: "puzzle", presentation: "composite" },
  dicePedestal: { movement: "walkable", role: "puzzle", presentation: "composite" },
  diceDisplay: { movement: "blocked", role: "puzzle", presentation: "composite" },
  diceGate: { movement: "conditional", role: "puzzle", presentation: "composite" },
  potionmaster: { movement: "walkable", role: "conversation", presentation: "sprite" },
  oddityBrewer: { movement: "walkable", role: "conversation", presentation: "sprite" },
  potionCauldron: { movement: "blocked", role: "terrain", presentation: "sprite" },
  potionShelf: { movement: "blocked", role: "terrain", presentation: "sprite" },
  potionTable: { movement: "blocked", role: "terrain", presentation: "sprite" },
  cartographer: { movement: "walkable", role: "conversation", presentation: "sprite" },
  mapTable: { movement: "blocked", role: "terrain", presentation: "sprite" },
  angler: { movement: "walkable", role: "conversation", presentation: "sprite" },
  anglerNet: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gardenTree: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gardenFountain: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gardenStatue: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gardenWater: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gardenFlowers: { movement: "blocked", role: "terrain", presentation: "sprite" },
  gardenBench: { movement: "blocked", role: "terrain", presentation: "sprite" },
  towerWall: { movement: "blocked", role: "terrain", presentation: "sprite" },
  towerDoor: { movement: "conditional", role: "puzzle", presentation: "sprite" },
  enemy: { movement: "blocked", role: "combat", presentation: "composite" },
  exit: { movement: "walkable", role: "exit", presentation: "sprite" },
};

/** A theme must choose its fixed enemy family or explicitly remain ring-based. */
export const DUNGEON_THEME_BASE_ENEMIES: Record<DungeonTheme, AdventureEnemyKind | null> = {
  earth: null,
  water: "octopus",
  forge: "forgeling",
};

type RoomFamily = "procedural" | "quest" | "npc" | "puzzle" | "portal" | "landmark";

/** New room kinds must state whether generic automation is sufficient. */
export const DUNGEON_ROOM_CONTRACTS: Record<DungeonRoomKind, {
  family: RoomFamily;
  autoRouting: "generic" | "custom";
}> = {
  normal: { family: "procedural", autoRouting: "generic" },
  treasure: { family: "procedural", autoRouting: "generic" },
  regen: { family: "procedural", autoRouting: "generic" },
  rescue: { family: "quest", autoRouting: "custom" },
  portal: { family: "portal", autoRouting: "generic" },
  waterPortal: { family: "portal", autoRouting: "custom" },
  lostItem: { family: "quest", autoRouting: "custom" },
  offering: { family: "puzzle", autoRouting: "custom" },
  mermanThrone: { family: "quest", autoRouting: "custom" },
  shopkeeper: { family: "quest", autoRouting: "custom" },
  blacksmith: { family: "npc", autoRouting: "custom" },
  miner: { family: "quest", autoRouting: "custom" },
  hammerVault: { family: "quest", autoRouting: "custom" },
  lottery: { family: "puzzle", autoRouting: "custom" },
  dice: { family: "puzzle", autoRouting: "custom" },
  potionmaster: { family: "npc", autoRouting: "custom" },
  oddityBrewer: { family: "npc", autoRouting: "custom" },
  cartographer: { family: "npc", autoRouting: "custom" },
  angler: { family: "npc", autoRouting: "custom" },
  towerExterior: { family: "landmark", autoRouting: "custom" },
  forgePortal: { family: "portal", autoRouting: "custom" },
  forgeNormal: { family: "procedural", autoRouting: "generic" },
  forgeArena: { family: "puzzle", autoRouting: "custom" },
  forgeTreasure: { family: "procedural", autoRouting: "generic" },
  forgeBlueprint: { family: "landmark", autoRouting: "custom" },
};

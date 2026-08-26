import type { AdventureTile, DungeonRoom, DungeonTheme } from "@/game/adventure/types";
import type { SpriteName } from "./sprites";

const GRASS_TEXTURES = ["floorGrassA", "floorGrassB", "floorGrassC"] as const;
const SEWER_TEXTURES = ["floorSewerA", "floorSewerB", "floorSewerC"] as const;
const NEST_TEXTURES = ["floorNestA", "floorNestB", "floorNestC"] as const;
const SAND_TEXTURES = ["floorSandA", "floorSandB", "floorSandC"] as const;
const DEEP_TEXTURES = ["floorDeepA", "floorDeepB", "floorDeepC"] as const;
const VOLCANO_TEXTURES = ["floorVolcanoA", "floorVolcanoB", "floorVolcanoC"] as const;
const FORGE_TEXTURES = ["floorForgeA", "floorForgeA", "floorForgeA", "floorForgeB"] as const;

export function adventureFloorTexture(
  room: DungeonRoom,
  tile: AdventureTile,
  x: number,
  y: number,
  theme: DungeonTheme,
): SpriteName | null {
  if (
    tile.kind === "wall"
    || tile.kind === "regen"
    || tile.kind === "portal"
    || tile.kind === "waterPortal"
    || tile.kind === "forgePortal"
    || tile.kind === "forgeGate"
    || tile.kind === "lotteryWheel"
    || tile.kind === "lotteryGate"
  ) return null;
  if (tile.floorVariant === "sunlight") return "floorGrassSunlight";
  if (tile.floorVariant === "tower-path") return "floorTowerPath";
  if (tile.floorVariant === "tower-magma") {
    const variant = textureHash(room.position.x, room.position.y, x, y) % VOLCANO_TEXTURES.length;
    return VOLCANO_TEXTURES[variant];
  }
  if (tile.floorVariant === "tower-grass" || room.kind === "towerExterior") {
    const variant = textureHash(room.position.x, room.position.y, x, y) % GRASS_TEXTURES.length;
    return GRASS_TEXTURES[variant];
  }

  const choices = theme === "forge"
    ? FORGE_TEXTURES
    : theme === "water"
    ? SAND_TEXTURES
    : room.position.x === 0 && room.position.y === 0
      ? GRASS_TEXTURES
      : room.ring === 1
        ? DEEP_TEXTURES
        : room.ring === 2
          ? NEST_TEXTURES
          : room.ring === 3
            ? SEWER_TEXTURES
            : VOLCANO_TEXTURES;
  const variant = textureHash(room.position.x, room.position.y, x, y) % choices.length;
  return choices[variant];
}

function textureHash(roomX: number, roomY: number, tileX: number, tileY: number): number {
  let hash = 2166136261;
  for (const value of [roomX, roomY, tileX, tileY]) {
    hash ^= value + 128;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

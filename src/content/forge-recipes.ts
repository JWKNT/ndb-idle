export const FORGE_EQUIPMENT_RECIPE_IDS = [
  "leggings",
  "chestplate",
  "helmet",
  "boots",
  "sword",
  "heavy-sword",
] as const;

export type ForgeEquipmentRecipeId = (typeof FORGE_EQUIPMENT_RECIPE_IDS)[number];
export type ForgeRecipeId = ForgeEquipmentRecipeId | "tower-key";
export type ForgeRecipeSymbol = "X" | "R" | "F" | "D" | "G";
export type ForgeRecipePattern = readonly [string, string, string, string];

/**
 * The patterns are presented as a 4x4 crafting grid. The Forge arenas place
 * those sixteen cells across the room floor, leaving a walkable tile between
 * each marker.
 */
export const FORGE_RECIPE_PATTERNS: Record<ForgeRecipeId, ForgeRecipePattern> = {
  leggings: [
    "RRRR",
    "RFFR",
    "RXXR",
    "RXXR",
  ],
  chestplate: [
    "RXXR",
    "RRRR",
    "RFFR",
    "RRRR",
  ],
  helmet: [
    "XRRX",
    "RFFR",
    "RXXR",
    "XXXX",
  ],
  boots: [
    "RXXR",
    "FXXF",
    "RXXR",
    "XXXX",
  ],
  sword: [
    "XXXR",
    "FXRX",
    "XRXX",
    "DXFX",
  ],
  "heavy-sword": [
    "XXRR",
    "FRRR",
    "XRRX",
    "DXFX",
  ],
  "tower-key": [
    "XXXX",
    "RRRR",
    "RXRG",
    "XXXX",
  ],
};

const FORGE_ARENA_RECIPE_COORDINATES: readonly number[] = [2, 4, 6, 8];

export function randomForgeEquipmentRecipe(random: () => number): ForgeEquipmentRecipeId {
  const value = Math.max(0, Math.min(0.999999, random()));
  return FORGE_EQUIPMENT_RECIPE_IDS[
    Math.floor(value * FORGE_EQUIPMENT_RECIPE_IDS.length)
  ] ?? "leggings";
}

export function forgeRecipeMarkerAt(
  recipeId: ForgeRecipeId,
  x: number,
  y: number,
): ForgeRecipeSymbol | null {
  const column = FORGE_ARENA_RECIPE_COORDINATES.indexOf(x);
  const rows = FORGE_ARENA_RECIPE_COORDINATES;
  const row = rows.indexOf(y);
  if (column < 0 || row < 0) return null;
  return (FORGE_RECIPE_PATTERNS[recipeId][row]?.[column] as ForgeRecipeSymbol | undefined) ?? null;
}

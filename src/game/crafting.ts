import {
  FORGE_RECIPE_IDS,
  FORGE_RECIPE_PATTERNS,
  type ForgeEquipmentRecipeId,
  type ForgeRecipeId,
  type ForgeRecipeSymbol,
} from "@/content/forge-recipes";
import { createRingGear, restoreRingGear, type GearItem, type GearSlot } from "./gear";
import { canAddUniqueInventoryItem } from "./inventory-capacity";
import type { MaterialId } from "./items";
import type { ProgressionState } from "./progression/types";

export const CRAFTING_GRID_SIZE = 4;
export const CRAFTING_GRID_CELLS = CRAFTING_GRID_SIZE * CRAFTING_GRID_SIZE;
export type CraftingGrid = Array<MaterialId | null>;

export interface CraftingRecipeMatch {
  recipeId: ForgeRecipeId;
  level: 1 | 2 | 3 | 4;
  name: string;
  slot: GearSlot | null;
  ingredients: CraftingGrid;
}

export interface CraftingResult {
  state: ProgressionState;
  item?: GearItem;
  keyItem?: "tower-key";
  error?: string;
}

type CraftedKeyItemId = "tower-key";
type CraftingRecipeOutput =
  | { kind: "equipment"; slot: GearSlot; name: string }
  | { kind: "key-item"; keyItem: CraftedKeyItemId; name: string };

/** A new recipe pattern is incomplete until its result behavior is declared. */
export const CRAFTING_RECIPE_OUTPUTS: Record<ForgeRecipeId, CraftingRecipeOutput> = {
  leggings: { kind: "equipment", slot: "leggings", name: "Leggings" },
  chestplate: { kind: "equipment", slot: "chestplate", name: "Chestplate" },
  helmet: { kind: "equipment", slot: "helmet", name: "Helmet" },
  boots: { kind: "equipment", slot: "boots", name: "Boots" },
  sword: { kind: "equipment", slot: "sword", name: "Sweeping Sword" },
  "heavy-sword": { kind: "equipment", slot: "sword", name: "Heavy Sword" },
  "tower-key": { kind: "key-item", keyItem: "tower-key", name: "Tower Key" },
};

type CraftingIngredientSymbol = Exclude<ForgeRecipeSymbol, "X">;

/**
 * Forge floor clues show the level-four recipes. Lower levels preserve the
 * metal and handle positions, replacing only the monster-hide binding with
 * the material earned in that level's adventure zone.
 */
const RECIPE_MATERIALS_BY_LEVEL: Record<1 | 2 | 3 | 4, Record<CraftingIngredientSymbol, MaterialId>> = {
  1: { R: "rusty-metal", F: "rat-pelt", D: "driftwood", G: "rusty-gear" },
  2: { R: "rusty-metal", F: "ant-chitin", D: "driftwood", G: "rusty-gear" },
  3: { R: "rusty-metal", F: "clay", D: "driftwood", G: "rusty-gear" },
  4: { R: "rusty-metal", F: "fire-alligator-hide", D: "driftwood", G: "rusty-gear" },
};

export function craftingPattern(
  recipeId: ForgeRecipeId,
  level: 1 | 2 | 3 | 4,
): CraftingGrid {
  return FORGE_RECIPE_PATTERNS[recipeId].flatMap((row) => [...row].map((symbol) => {
    if (symbol === "X") return null;
    return RECIPE_MATERIALS_BY_LEVEL[level][symbol as CraftingIngredientSymbol] ?? null;
  }));
}

export function matchCraftingRecipe(grid: readonly (MaterialId | null)[]): CraftingRecipeMatch | null {
  if (grid.length !== CRAFTING_GRID_CELLS) return null;
  for (const level of [1, 2, 3, 4] as const) {
    for (const recipeId of FORGE_RECIPE_IDS) {
      const output = CRAFTING_RECIPE_OUTPUTS[recipeId];
      if (output.kind === "key-item" && level !== 4) continue;
      const ingredients = craftingPattern(recipeId, level);
      if (ingredients.every((ingredient, index) => ingredient === grid[index])) {
        return {
          recipeId,
          level,
          name: output.kind === "equipment" ? `Level ${level} ${output.name}` : output.name,
          slot: output.kind === "equipment" ? output.slot : null,
          ingredients,
        };
      }
    }
  }
  return null;
}

export function craftItem(state: ProgressionState, grid: readonly (MaterialId | null)[]): CraftingResult {
  if (!state.craftingUnlocked) return { state, error: "Crafting has not been unlocked." };
  const recipe = matchCraftingRecipe(grid);
  if (!recipe) return { state, error: "That arrangement is not a known recipe." };
  const output = CRAFTING_RECIPE_OUTPUTS[recipe.recipeId];
  if (output.kind === "key-item") {
    switch (output.keyItem) {
      case "tower-key":
        if (state.towerKeyOwned) return { state, error: "The Tower Key has already been crafted." };
        break;
      default: {
        const unhandled: never = output.keyItem;
        throw new Error(`Unhandled crafted key item: ${unhandled}`);
      }
    }
  }
  if (output.kind === "equipment" && !canAddUniqueInventoryItem(state)) {
    return { state, error: "The inventory is full." };
  }

  const required = ingredientCounts(recipe.ingredients);
  const missing = Object.entries(required).find(([id, quantity]) =>
    (state.materials[id as MaterialId] ?? 0) < quantity
  );
  if (missing) return { state, error: `Not enough ${missing[0].replaceAll("-", " ")}.` };

  const materials = { ...state.materials };
  Object.entries(required).forEach(([id, quantity]) => {
    materials[id as MaterialId] -= quantity;
  });
  if (output.kind === "key-item") {
    switch (output.keyItem) {
      case "tower-key":
        return {
          state: { ...state, materials, towerKeyOwned: true },
          keyItem: "tower-key",
        };
      default: {
        const unhandled: never = output.keyItem;
        throw new Error(`Unhandled crafted key item: ${unhandled}`);
      }
    }
  }

  const equipmentRecipeId = recipe.recipeId as ForgeEquipmentRecipeId;
  const sourceKey = nextCraftedItemSourceKey(state, equipmentRecipeId, recipe.level, output.slot);
  const baseItem = createRingGear(output.slot, recipe.level, sourceKey, state.completedRaids);
  const item: GearItem = {
    ...restoreRingGear({
      ...baseItem,
      weaponAbilityId: recipe.recipeId === "sword"
        ? "sweep"
        : recipe.recipeId === "heavy-sword"
          ? "heavy-slam"
          : undefined,
    }, state.completedRaids),
    name: recipe.name,
  };

  return {
    state: {
      ...state,
      materials,
      inventory: [...state.inventory, item],
    },
    item,
  };
}

function nextCraftedItemSourceKey(
  state: ProgressionState,
  recipeId: ForgeEquipmentRecipeId,
  level: 1 | 2 | 3 | 4,
  slot: GearSlot,
): string {
  const prefix = `crafted-${recipeId}-${level}-`;
  let ordinal = 1;
  while (state.inventory.some((item) => item.id === `treasure-${prefix}${ordinal}-${slot}-r${level}`)) {
    ordinal += 1;
  }
  return `${prefix}${ordinal}`;
}

function ingredientCounts(grid: readonly (MaterialId | null)[]): Partial<Record<MaterialId, number>> {
  const counts: Partial<Record<MaterialId, number>> = {};
  grid.forEach((id) => {
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}

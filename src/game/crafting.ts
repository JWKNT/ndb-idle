import {
  FORGE_EQUIPMENT_RECIPE_IDS,
  FORGE_RECIPE_PATTERNS,
  type ForgeEquipmentRecipeId,
  type ForgeRecipeId,
  type ForgeRecipeSymbol,
} from "@/content/forge-recipes";
import { createRingGear, type GearItem, type GearSlot } from "./gear";
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

const RECIPE_SLOTS: Record<ForgeEquipmentRecipeId, GearSlot> = {
  leggings: "leggings",
  chestplate: "chestplate",
  helmet: "helmet",
  boots: "boots",
  sword: "sword",
  "heavy-sword": "sword",
};

const RECIPE_NAMES: Record<ForgeEquipmentRecipeId, string> = {
  leggings: "Leggings",
  chestplate: "Chestplate",
  helmet: "Helmet",
  boots: "Boots",
  sword: "Sweeping Sword",
  "heavy-sword": "Heavy Sword",
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
    for (const recipeId of FORGE_EQUIPMENT_RECIPE_IDS) {
      const ingredients = craftingPattern(recipeId, level);
      if (ingredients.every((ingredient, index) => ingredient === grid[index])) {
        return {
          recipeId,
          level,
          name: `Level ${level} ${RECIPE_NAMES[recipeId]}`,
          slot: RECIPE_SLOTS[recipeId],
          ingredients,
        };
      }
    }
  }
  const towerKeyIngredients = craftingPattern("tower-key", 4);
  if (towerKeyIngredients.every((ingredient, index) => ingredient === grid[index])) {
    return {
      recipeId: "tower-key",
      level: 4,
      name: "Tower Key",
      slot: null,
      ingredients: towerKeyIngredients,
    };
  }
  return null;
}

export function craftItem(state: ProgressionState, grid: readonly (MaterialId | null)[]): CraftingResult {
  if (!state.craftingUnlocked) return { state, error: "Crafting has not been unlocked." };
  const recipe = matchCraftingRecipe(grid);
  if (!recipe) return { state, error: "That arrangement is not a known recipe." };
  if (recipe.recipeId === "tower-key" && state.towerKeyOwned) {
    return { state, error: "The Tower Key has already been crafted." };
  }
  if (recipe.recipeId !== "tower-key" && !canAddUniqueInventoryItem(state)) {
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
  if (recipe.recipeId === "tower-key") {
    return {
      state: { ...state, materials, towerKeyOwned: true },
      keyItem: "tower-key",
    };
  }

  const sourceKey = nextCraftedItemSourceKey(state, recipe.recipeId, recipe.level);
  const baseItem = createRingGear(recipe.slot!, recipe.level, sourceKey, state.completedRaids);
  const item: GearItem = recipe.recipeId === "sword"
    ? { ...baseItem, name: recipe.name, weaponAbilityId: "sweep" }
    : recipe.recipeId === "heavy-sword"
      ? { ...baseItem, name: recipe.name, weaponAbilityId: "heavy-slam" }
      : { ...baseItem, name: recipe.name };

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
): string {
  const prefix = `crafted-${recipeId}-${level}-`;
  let ordinal = 1;
  while (state.inventory.some((item) => item.id === `treasure-${prefix}${ordinal}-${RECIPE_SLOTS[recipeId]}-r${level}`)) {
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

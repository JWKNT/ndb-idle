import { describe, expect, it } from "vitest";
import {
  FORGE_EQUIPMENT_RECIPE_IDS,
  forgeRecipeMarkerAt,
  randomForgeEquipmentRecipe,
} from "@/content/forge-recipes";
import { emptyMaterialCounts } from "./items";
import { defaultProgression, sellGear } from "./progression";
import { craftItem, craftingPattern, matchCraftingRecipe } from "./crafting";

describe("Forge crafting clues", () => {
  it("chooses a Forge equipment clue from the complete six-recipe pool", () => {
    expect(randomForgeEquipmentRecipe(() => 0)).toBe("leggings");
    expect(randomForgeEquipmentRecipe(() => 0.999999)).toBe("heavy-sword");
    expect(FORGE_EQUIPMENT_RECIPE_IDS).toHaveLength(6);
  });

  it("lays arena recipes on a spaced 4x4 floor grid", () => {
    expect([
      [2, 2], [4, 2], [6, 2], [8, 2],
      [2, 4], [4, 4], [6, 4], [8, 4],
      [2, 6], [4, 6], [6, 6], [8, 6],
      [2, 8], [4, 8], [6, 8], [8, 8],
    ].map(([x, y]) => forgeRecipeMarkerAt("leggings", x, y)).join(""))
      .toBe("RRRRRFFRRXXRRXXR");
    expect(forgeRecipeMarkerAt("leggings", 3, 2)).toBeNull();
  });

  it("moves the fixed Rusty Gear clue below the blueprint-room nook", () => {
    expect(forgeRecipeMarkerAt("tower-key", 8, 6)).toBe("G");
    expect(forgeRecipeMarkerAt("tower-key", 8, 4)).toBe("R");
    expect(forgeRecipeMarkerAt("tower-key", 2, 2)).toBe("X");
  });

  it("substitutes the zone drop while preserving metal and handles in level 1-3 recipes", () => {
    expect(new Set(craftingPattern("helmet", 1).filter(Boolean))).toEqual(new Set(["rusty-metal", "rat-pelt"]));
    expect(new Set(craftingPattern("helmet", 2).filter(Boolean))).toEqual(new Set(["rusty-metal", "ant-chitin"]));
    expect(new Set(craftingPattern("helmet", 3).filter(Boolean))).toEqual(new Set(["rusty-metal", "clay"]));
    expect(new Set(craftingPattern("sword", 1).filter(Boolean))).toEqual(new Set(["rusty-metal", "rat-pelt", "driftwood"]));
  });

  it("recognizes every level 1-3 armor and weapon recipe", () => {
    for (const level of [1, 2, 3] as const) {
      for (const recipeId of FORGE_EQUIPMENT_RECIPE_IDS) {
        expect(matchCraftingRecipe(craftingPattern(recipeId, level))).toMatchObject({
          recipeId,
          level,
        });
      }
    }
  });

  it("crafts the level 4 heavy sword from its exact Forge floor recipe", () => {
    const grid = craftingPattern("heavy-sword", 4);
    expect(matchCraftingRecipe(grid)).toMatchObject({
      recipeId: "heavy-sword",
      level: 4,
      name: "Level 4 Heavy Sword",
    });
    const state = {
      ...defaultProgression(),
      craftingUnlocked: true,
      materials: {
        ...emptyMaterialCounts(),
        "rusty-metal": 7,
        "fire-alligator-hide": 2,
        driftwood: 1,
      },
    };
    const result = craftItem(state, grid);
    expect(result.error).toBeUndefined();
    expect(result.item).toMatchObject({
      name: "Level 4 Heavy Sword",
      slot: "sword",
      ring: 4,
      weaponAbilityId: "heavy-slam",
      bonuses: { attack: 15 },
    });
    expect(result.state.materials["rusty-metal"]).toBe(0);
    expect(result.state.materials["fire-alligator-hide"]).toBe(0);
    expect(result.state.materials.driftwood).toBe(0);
  });

  it("always gives crafted weapon families matching names, abilities, and bonuses", () => {
    for (const recipeId of ["sword", "heavy-sword"] as const) {
      const grid = craftingPattern(recipeId, 3);
      const state = {
        ...defaultProgression(),
        craftingUnlocked: true,
        completedRaids: [1, 2, 3, 4, 5, 6, 7, 8],
        materials: Object.fromEntries(
          Object.entries(emptyMaterialCounts()).map(([id, quantity]) => [
            id,
            quantity + grid.filter((ingredient) => ingredient === id).length,
          ]),
        ) as ReturnType<typeof emptyMaterialCounts>,
      };
      const result = craftItem(state, grid);
      expect(result.item).toMatchObject({
        name: recipeId === "sword" ? "Level 3 Sweeping Sword" : "Level 3 Heavy Sword",
        weaponAbilityId: recipeId === "sword" ? "sweep" : "heavy-slam",
        bonuses: { attack: 12 },
      });
      expect(result.item?.bonuses.spAttack).toBeUndefined();
    }
  });

  it("keeps crafted item ids unique after an earlier copy is sold", () => {
    const grid = craftingPattern("boots", 1);
    const stockedMaterials = () => ({
      ...emptyMaterialCounts(),
      "rusty-metal": 8,
      "rat-pelt": 2,
    });
    let state = { ...defaultProgression(), craftingUnlocked: true, materials: stockedMaterials() };
    const first = craftItem(state, grid);
    state = { ...first.state, materials: stockedMaterials() };
    const second = craftItem(state, grid);
    state = sellGear(second.state, first.item!.id).state;
    state = { ...state, materials: stockedMaterials() };
    const third = craftItem(state, grid);

    expect(third.error).toBeUndefined();
    expect(new Set(third.state.inventory.map((item) => item.id)).size).toBe(third.state.inventory.length);
    expect(third.item!.id).not.toBe(second.item!.id);
  });

  it("crafts the Tower Key from six Rusty Metal and the unsellable Rusty Gear", () => {
    const grid = craftingPattern("tower-key", 4);
    expect(grid.filter((ingredient) => ingredient === "rusty-metal")).toHaveLength(6);
    expect(grid.filter((ingredient) => ingredient === "rusty-gear")).toHaveLength(1);
    expect(matchCraftingRecipe(grid)).toMatchObject({
      recipeId: "tower-key",
      name: "Tower Key",
      slot: null,
    });
    const state = {
      ...defaultProgression(),
      craftingUnlocked: true,
      materials: {
        ...emptyMaterialCounts(),
        "rusty-metal": 6,
        "rusty-gear": 1,
      },
    };
    const result = craftItem(state, grid);
    expect(result.error).toBeUndefined();
    expect(result.keyItem).toBe("tower-key");
    expect(result.state.towerKeyOwned).toBe(true);
    expect(result.state.materials["rusty-metal"]).toBe(0);
    expect(result.state.materials["rusty-gear"]).toBe(0);
    expect(craftItem(result.state, grid).error).toMatch(/already been crafted/i);
  });
});

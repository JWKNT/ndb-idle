import Decimal from "break_eternity.js";
import type { ProgressionState } from "./types";
import { addInventoryStack } from "@/game/inventory-capacity";

export function discoverBlacksmith(state: ProgressionState): ProgressionState {
  return state.blacksmithUnlocked && state.shopUnlocked
    ? state
    : { ...state, blacksmithUnlocked: true, shopUnlocked: true };
}

export function purchaseHammerQuest(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  if (!state.blacksmithUnlocked) return { state, error: "Find the Blacksmith first." };
  if (state.hammerQuestPurchased) return { state, error: "The Hammer quest is already owned." };
  if (state.materials.clay < 20) return { state, error: "The Blacksmith needs 20 Clay." };
  return {
    state: {
      ...state,
      materials: { ...state.materials, clay: state.materials.clay - 20 },
      hammerQuestPurchased: true,
      hammerQuestAttemptActive: false,
      hammerQuestFailed: false,
    },
  };
}

export function beginHammerQuestAttempt(state: ProgressionState): ProgressionState {
  if (!state.hammerQuestPurchased || state.hammerReturned) return state;
  return {
    ...state,
    hammerQuestAttemptActive: true,
    hammerQuestFailed: false,
    hammerRecovered: false,
  };
}

export function failHammerQuestAttempt(state: ProgressionState): ProgressionState {
  if (state.hammerReturned) return state;
  if (!state.hammerQuestAttemptActive && !state.hammerRecovered) return state;
  return {
    ...state,
    hammerQuestAttemptActive: false,
    hammerQuestFailed: true,
    hammerRecovered: false,
  };
}

export function recoverBlacksmithHammer(state: ProgressionState): ProgressionState {
  return state.hammerRecovered ? state : {
    ...state,
    hammerQuestAttemptActive: true,
    hammerQuestFailed: false,
    hammerRecovered: true,
  };
}

export function returnBlacksmithHammer(state: ProgressionState): ProgressionState {
  if (!state.hammerRecovered) return state;
  return {
    ...state,
    hammerQuestAttemptActive: false,
    hammerQuestFailed: false,
    hammerRecovered: false,
    hammerReturned: true,
  };
}

export function purchaseBlacksmithHealingPotion(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  if (!state.blacksmithUnlocked) return { state, error: "Find the Blacksmith first." };
  if (state.materials.clay < 50) return { state, error: "The Blacksmith needs 50 Clay." };
  const paidState = {
    ...state,
    materials: { ...state.materials, clay: state.materials.clay - 50 },
  };
  const added = addInventoryStack(paidState, "blacksmith-healing-potion");
  if (added.added === 0) return { state, error: "That stack or the inventory is full." };
  return { state: added.state };
}

export function purchasePickaxe(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  if (!state.hammerReturned) return { state, error: "Return the Blacksmith's Hammer first." };
  if (state.pickaxeOwned) return { state, error: "The Pickaxe is already owned." };
  if (state.gold.lt(2_000)) return { state, error: "The Blacksmith needs 2,000 gold." };
  if (state.materials.clay < 20) return { state, error: "The Blacksmith needs 20 Clay." };
  if (state.materials.driftwood < 20) return { state, error: "The Blacksmith needs 20 Driftwood." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(new Decimal(2_000)),
      materials: {
        ...state.materials,
        clay: state.materials.clay - 20,
        driftwood: state.materials.driftwood - 20,
      },
      pickaxeOwned: true,
      purchasedQuestIds: state.purchasedQuestIds.includes("find-miner")
        ? state.purchasedQuestIds
        : [...state.purchasedQuestIds, "find-miner"],
      activeQuestId: state.activeQuestId ?? "find-miner",
    },
  };
}

export function recoverForgeBlueprints(state: ProgressionState): ProgressionState {
  return state.forgeBlueprintsRecovered
    ? state
    : {
        ...state,
        forgeBlueprintsRecovered: true,
        activeQuestId: state.activeQuestId === "enter-tower" ? null : state.activeQuestId,
      };
}

export function deliverForgeBlueprints(state: ProgressionState): ProgressionState {
  if (!state.forgeBlueprintsRecovered || state.forgeBlueprintsDelivered) return state;
  return {
    ...state,
    forgeBlueprintsRecovered: false,
    forgeBlueprintsDelivered: true,
    activeQuestId: state.activeQuestId === "enter-tower" ? null : state.activeQuestId,
    completedQuestIds: state.completedQuestIds.includes("enter-tower")
      ? state.completedQuestIds
      : [...state.completedQuestIds, "enter-tower"],
  };
}

export function purchaseCraftingTable(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  if (!state.forgeBlueprintsDelivered) return { state, error: "Bring the Blacksmith's Blueprints first." };
  if (state.craftingUnlocked) return { state, error: "The Crafting Table is already owned." };
  if (state.gold.lt(200_000)) return { state, error: "The Blacksmith needs 200,000 gold." };
  if (state.materials["rusty-metal"] < 20) return { state, error: "The Blacksmith needs 20 Rusty Metal." };
  if (state.materials.clay < 100) return { state, error: "The Blacksmith needs 100 Clay." };
  if (state.materials.seaweed < 10) return { state, error: "The Blacksmith needs 10 Seaweed." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(200_000),
      materials: {
        ...state.materials,
        "rusty-metal": state.materials["rusty-metal"] - 20,
        clay: state.materials.clay - 100,
        seaweed: state.materials.seaweed - 10,
      },
      craftingUnlocked: true,
    },
  };
}

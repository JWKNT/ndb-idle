import { grantInventoryStack, potionStackId } from "@/game/inventory-capacity";
import type { MaterialId } from "@/game/items";
import type { ProgressionState } from "./types";

export const ODDITY_BREWER_MATERIAL_COST = 10;
export const ODDITY_BREWER_POTION_REWARD = 3;

const REQUIRED_MATERIALS = [
  "eye-of-frog",
  "mutated-rat-tail",
  "fire-ant-chitin",
] as const satisfies readonly MaterialId[];

export function oddityBrewerRequiredMaterials(): readonly MaterialId[] {
  return REQUIRED_MATERIALS;
}

export function oddityBrewerRequirementsMet(state: ProgressionState): boolean {
  return REQUIRED_MATERIALS.every((id) => state.materials[id] >= ODDITY_BREWER_MATERIAL_COST);
}

export function completeOddityBrewerExchange(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  if (state.oddityBrewerCompleted) {
    return { state, error: "Charles has already completed this batch." };
  }
  if (!oddityBrewerRequirementsMet(state)) {
    return { state, error: "Charles still needs 10 of each ingredient." };
  }
  const materials = { ...state.materials };
  for (const id of REQUIRED_MATERIALS) materials[id] -= ODDITY_BREWER_MATERIAL_COST;
  const paid = { ...state, materials, oddityBrewerCompleted: true };
  return {
    state: grantInventoryStack(paid, potionStackId("mystery-1"), ODDITY_BREWER_POTION_REWARD),
  };
}

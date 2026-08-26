import { addInventoryStack, materialStackId, potionStackId } from "@/game/inventory-capacity";
import type { MaterialId } from "@/game/items";
import { POTION_IDS, POTION_META, type PotionId } from "@/game/potions";
import type { ProgressionState } from "./types";

export const POTIONMASTER_MATERIAL_COST = 50;
export const POTIONMASTER_MAGIC_BAIT_REWARD = 100;
export const POTIONMASTER_POTION_REWARD_COUNT = 4;

const REQUIRED_MATERIALS: readonly MaterialId[] = [
  "rat-pelt",
  "ant-chitin",
  "ink-sac",
  "fire-alligator-hide",
];

const LEVEL_TWO_POTIONS = POTION_IDS.filter((id) => POTION_META[id].level === 2);

export function potionmasterMaterialCost(id: MaterialId): number {
  return id === "ink-sac" || id === "fire-alligator-hide"
    ? 25
    : POTIONMASTER_MATERIAL_COST;
}

export function potionmasterRequirementsMet(state: ProgressionState): boolean {
  return REQUIRED_MATERIALS.every((id) => state.materials[id] >= potionmasterMaterialCost(id));
}

export function completePotionmasterQuest(
  state: ProgressionState,
  random: () => number = Math.random,
): {
  state: ProgressionState;
  potions: PotionId[];
  discarded: number;
  error?: string;
} {
  if (state.potionmasterQuestCompleted) {
    return { state, potions: [], discarded: 0, error: "The Lost Potionmaster's delivery is already complete." };
  }
  if (!potionmasterRequirementsMet(state)) {
    return { state, potions: [], discarded: 0, error: "The Lost Potionmaster is still missing requested materials." };
  }

  let next: ProgressionState = {
    ...state,
    materials: { ...state.materials },
    potionmasterQuestCompleted: true,
  };
  for (const id of REQUIRED_MATERIALS) next.materials[id] -= potionmasterMaterialCost(id);

  const potions: PotionId[] = [];
  let discarded = 0;
  for (let index = 0; index < POTIONMASTER_POTION_REWARD_COUNT; index += 1) {
    const roll = Math.max(0, Math.min(0.999999, random()));
    const id = LEVEL_TWO_POTIONS[Math.floor(roll * LEVEL_TWO_POTIONS.length)] ?? "haste-2";
    potions.push(id);
    const added = addInventoryStack(next, potionStackId(id));
    next = added.state;
    discarded += added.discarded;
  }
  const bait = addInventoryStack(
    next,
    materialStackId("magic-bait"),
    POTIONMASTER_MAGIC_BAIT_REWARD,
  );
  next = bait.state;
  discarded += bait.discarded;
  return { state: next, potions, discarded };
}

export function potionmasterRequiredMaterials(): readonly MaterialId[] {
  return REQUIRED_MATERIALS;
}

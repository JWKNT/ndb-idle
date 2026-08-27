import { FISHING_BAIT_IDS, MATERIAL_META, type MaterialId } from "@/game/items";
import { milestoneGearHasEffect } from "@/game/gear";
import type { PlayerId } from "@/game/types";
import type { ProgressionState } from "./types";

export function startFishing(
  state: ProgressionState,
  memberId: PlayerId,
  baitId: MaterialId,
  mode: "manual" | "auto" = "manual",
  random: () => number = Math.random,
): { state: ProgressionState; error?: string } {
  if (!state.fishingRod) return { state, error: "Recover the Fishing Rod first." };
  if (!state.party[memberId]) return { state, error: "That member is not in the party." };
  if (state.fishingAssignment) return { state, error: "A party member is already fishing." };
  if (!FISHING_BAIT_IDS.includes(baitId as typeof FISHING_BAIT_IDS[number])) {
    return { state, error: "That item cannot be used as bait." };
  }
  if (state.materials[baitId] <= 0) return { state, error: "That bait is not in inventory." };
  const reusable = Boolean(MATERIAL_META[baitId].reusableBait);
  const conserveBait = !reusable && memberHasTrident(state, memberId) && random() < 0.2;
  return {
    state: {
      ...state,
      materials: reusable || conserveBait
        ? state.materials
        : { ...state.materials, [baitId]: state.materials[baitId] - 1 },
      selectedAdventureMembers: state.selectedAdventureMembers.filter((id) => id !== memberId),
      fishingAssignment: { memberId, baitId, mode, progressSeconds: 0 },
    },
  };
}

function memberHasTrident(state: ProgressionState, memberId: PlayerId): boolean {
  const weaponId = state.equipment[memberId]?.sword;
  return Boolean(weaponId && state.inventory.some(
    (item) => item.id === weaponId && milestoneGearHasEffect(item, "bait-conservation"),
  ));
}

export function stopFishing(state: ProgressionState): ProgressionState {
  return { ...state, fishingAssignment: null };
}

export function fishingTabUnlocked(state: ProgressionState): boolean {
  return state.fishingRod || state.completedQuestIds.includes("retrieve-lost-item");
}

import { FISH_STATS, type MaterialId } from "@/game/items";
import type { StatKey } from "@/game/types";
import type { ProgressionState } from "./types";

export const ANGLER_MATERIAL_COST: Partial<Record<MaterialId, number>> = {
  "rat-pelt": 10,
  "ant-chitin": 8,
  "ink-sac": 4,
};

export function anglerMaterialsReady(state: ProgressionState): boolean {
  return Object.entries(ANGLER_MATERIAL_COST).every(([id, cost]) =>
    state.materials[id as MaterialId] >= (cost ?? 0));
}

export function deliverAnglerMaterials(
  state: ProgressionState,
  random: () => number = Math.random,
): { state: ProgressionState; error?: string } {
  if (state.anglerMaterialsDelivered) return { state };
  if (!anglerMaterialsReady(state)) return { state, error: "The Angler still needs the requested bait materials." };
  const materials = { ...state.materials };
  for (const [id, cost] of Object.entries(ANGLER_MATERIAL_COST)) {
    materials[id as MaterialId] -= cost ?? 0;
  }
  const requested = FISH_STATS[Math.floor(Math.max(0, Math.min(0.999999, random())) * FISH_STATS.length)] ?? "hp";
  return { state: { ...state, materials, anglerMaterialsDelivered: true, anglerRequestedFish: requested } };
}

export function completeAnglerRequest(state: ProgressionState): { state: ProgressionState; error?: string } {
  const requested = state.anglerRequestedFish;
  if (state.tackleBoxOwned) return { state };
  if (!state.anglerMaterialsDelivered || !requested) return { state, error: "Bring the bait materials first." };
  if (state.fish[requested] <= 0) return { state, error: "Catch the fish family the Angler requested." };
  return {
    state: {
      ...state,
      fish: { ...state.fish, [requested]: state.fish[requested] - 1 },
      anglerRequestedFish: null,
      tackleBoxOwned: true,
      favoredFishStat: requested,
    },
  };
}

export function setFavoredFishStat(state: ProgressionState, stat: StatKey | null): ProgressionState {
  if (!state.tackleBoxOwned || (stat !== null && !FISH_STATS.includes(stat))) return state;
  return { ...state, favoredFishStat: stat };
}

export function rollFishFamily(state: ProgressionState, random: () => number): StatKey {
  const favorite = state.tackleBoxOwned ? state.favoredFishStat : null;
  if (!favorite) return FISH_STATS[Math.floor(random() * FISH_STATS.length)] ?? "luck";
  // Double the favorite's relative weight without changing the bait's catch chance.
  const pool = [...FISH_STATS, favorite];
  return pool[Math.floor(random() * pool.length)] ?? favorite;
}

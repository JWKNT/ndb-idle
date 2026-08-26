import { grantInventoryStack, materialStackId } from "@/game/inventory-capacity";
import type { ProgressionState } from "./types";

export const CARTOGRAPHER_CHALK_REWARD = 1;

export function completeCartographerQuest(state: ProgressionState): ProgressionState {
  if (state.cartographerQuestCompleted) return state;
  return grantInventoryStack(
    { ...state, cartographerQuestCompleted: true },
    materialStackId("mapmaker-chalk"),
    CARTOGRAPHER_CHALK_REWARD,
  );
}

export function consumeMapmakerChalk(state: ProgressionState): { state: ProgressionState; error?: string } {
  if (state.materials["mapmaker-chalk"] <= 0) return { state, error: "No Mapmaker's Chalk remains." };
  return {
    state: {
      ...state,
      materials: {
        ...state.materials,
        "mapmaker-chalk": state.materials["mapmaker-chalk"] - 1,
      },
    },
  };
}

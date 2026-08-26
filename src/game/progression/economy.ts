import Decimal from "break_eternity.js";
import { getPlayer } from "@/content/players";
import {
  ESCAPE_ROPES,
  emptyEscapeRopeCounts,
  maximumPurchasableEscapeRopeLevel,
  type EscapeRopeLevel,
} from "@/game/escape-ropes";
import { FISH_META, MATERIAL_META, type MaterialId } from "@/game/items";
import {
  addInventoryStack,
  escapeRopeStackId,
  materialStackId,
} from "@/game/inventory-capacity";
import type { PlayerId, StatKey } from "@/game/types";
import type { ProgressionState } from "./types";

export function addGold(state: ProgressionState, gold: Decimal): ProgressionState {
  return { ...state, gold: state.gold.add(gold) };
}

export function purchaseEscapeRope(
  state: ProgressionState,
  level: EscapeRopeLevel,
): { state: ProgressionState; error?: string } {
  const maximumLevel = maximumPurchasableEscapeRopeLevel(state.highestAdventureRingVisited);
  if (level > maximumLevel) {
    return {
      state,
      error: `Travel at least ${level + 1} rooms from the entrance before buying a Level ${level} Escape Rope.`,
    };
  }
  const cost = ESCAPE_ROPES[level].cost;
  if (state.gold.lt(cost)) return { state, error: "Not enough gold." };
  const added = addInventoryStack(state, escapeRopeStackId(level));
  if (added.added === 0) return { state, error: "That stack or the inventory is full." };
  return {
    state: { ...added.state, gold: state.gold.sub(cost) },
  };
}

export function consumeEscapeRope(
  state: ProgressionState,
  level: EscapeRopeLevel,
): { state: ProgressionState; error?: string } {
  if ((state.escapeRopes?.[level] ?? 0) <= 0) {
    return { state, error: `No Level ${level} Escape Rope is available.` };
  }
  return {
    state: {
      ...state,
      escapeRopes: {
        ...(state.escapeRopes ?? emptyEscapeRopeCounts()),
        [level]: (state.escapeRopes?.[level] ?? 0) - 1,
      },
    },
  };
}

export function settleAdventureGold(
  state: ProgressionState,
  collectedGold: Decimal,
  keepAll: boolean,
): { state: ProgressionState; banked: Decimal; lost: Decimal } {
  const collected = Decimal.max(0, collectedGold);
  const banked = keepAll ? collected : collected.mul(0.75);
  return {
    state: addGold(state, banked),
    banked,
    lost: collected.sub(banked),
  };
}

export function addMaterial(
  state: ProgressionState,
  materialId: MaterialId,
  amount = 1,
): ProgressionState {
  const quantity = Math.max(0, Math.floor(amount));
  if (quantity === 0) return state;
  return addInventoryStack(state, materialStackId(materialId), quantity).state;
}

export function sellMaterial(
  state: ProgressionState,
  materialId: MaterialId,
  amount = 1,
): { state: ProgressionState; error?: string } {
  const quantity = Math.max(0, Math.floor(amount));
  if (quantity <= 0) return { state, error: "Choose at least one material to sell." };
  if (MATERIAL_META[materialId].sellPrice <= 0) {
    return { state, error: `${MATERIAL_META[materialId].name} cannot be sold.` };
  }
  if (state.materials[materialId] < quantity) {
    return { state, error: "Not enough of that material in inventory." };
  }
  return {
    state: {
      ...state,
      gold: state.gold.add(new Decimal(MATERIAL_META[materialId].sellPrice).mul(quantity)),
      materials: { ...state.materials, [materialId]: state.materials[materialId] - quantity },
    },
  };
}

export function sellFish(
  state: ProgressionState,
  stat: StatKey,
  amount = 1,
): { state: ProgressionState; error?: string } {
  const quantity = Math.max(0, Math.floor(amount));
  if (quantity <= 0) return { state, error: "Choose at least one fish to sell." };
  if (state.fish[stat] < quantity) return { state, error: "Not enough of that fish in inventory." };
  return {
    state: {
      ...state,
      gold: state.gold.add(new Decimal(FISH_META[stat].sellPrice).mul(quantity)),
      fish: { ...state.fish, [stat]: state.fish[stat] - quantity },
    },
  };
}

export function fishBonusCap(state: ProgressionState): number {
  return Math.floor(Math.max(0, ...state.completedRaids) / 2);
}

export function feedFish(
  state: ProgressionState,
  memberId: PlayerId,
  stat: StatKey,
): { state: ProgressionState; error?: string } {
  const member = state.party[memberId];
  if (!member) return { state, error: "That member is not in the party." };
  if (state.fish[stat] <= 0) return { state, error: "That fish is not in inventory." };
  const limit = fishBonusCap(state);
  if (member.fishBonuses[stat] >= limit) {
    return {
      state,
      error: limit === 0
        ? "Complete Battle 2 before feeding permanent stat fish."
        : `${getPlayer(memberId).name} has reached the ${limit}-fish limit for ${stat}.`,
    };
  }
  return {
    state: {
      ...state,
      fish: { ...state.fish, [stat]: state.fish[stat] - 1 },
      party: {
        ...state.party,
        [memberId]: {
          ...member,
          fishBonuses: { ...member.fishBonuses, [stat]: member.fishBonuses[stat] + 1 },
        },
      },
    },
  };
}

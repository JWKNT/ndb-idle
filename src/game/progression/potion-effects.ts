import {
  POTION_DURATION_MS,
  POTION_IDS,
  POTION_META,
  STANDARD_LEVEL_ONE_POTION_IDS,
  emptyPotionCounts,
  type ActiveMysteryPotionEffect,
  type PotionId,
} from "@/game/potions";
import type { ProgressionState } from "./types";
import { addInventoryStack, potionStackId } from "@/game/inventory-capacity";

export const MYSTERY_POTION_DODGE_CHANCE = 0.05;

export function addPotion(
  state: ProgressionState,
  potionId: PotionId,
  quantity = 1,
) {
  return addInventoryStack(state, potionStackId(potionId), quantity);
}

export function purchasePotion(
  state: ProgressionState,
  potionId: PotionId,
): { state: ProgressionState; error?: string } {
  const potion = POTION_META[potionId];
  if (potion.cost <= 0) return { state, error: "That potion cannot be purchased." };
  if (potion.level === 2 && !state.completedRaids.includes(9)) {
    return { state, error: "Complete Battle 9 to unlock Level 2 potions." };
  }
  if (state.gold.lt(potion.cost)) return { state, error: "Not enough gold." };
  const added = addInventoryStack(state, potionStackId(potionId));
  if (added.added === 0) return { state, error: "That stack or the inventory is full." };
  return {
    state: { ...added.state, gold: state.gold.sub(potion.cost) },
  };
}

export function consumePotion(
  state: ProgressionState,
  potionId: PotionId,
  now = Date.now(),
  random: () => number = Math.random,
): { state: ProgressionState; mysteryEffect?: ActiveMysteryPotionEffect; error?: string } {
  if ((state.potions?.[potionId] ?? 0) <= 0) return { state, error: "That potion is not in inventory." };
  const potion = POTION_META[potionId];
  if (potion.effectKind === "mystery") {
    const candidates = [...STANDARD_LEVEL_ONE_POTION_IDS];
    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const roll = Math.max(0, Math.min(0.999999, random()));
      const swapIndex = Math.floor(roll * (index + 1));
      [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
    }
    const mysteryEffect: ActiveMysteryPotionEffect = {
      positive: [candidates[0], candidates[1]],
      negative: candidates[2],
      expiresAt: now + POTION_DURATION_MS,
    };
    return {
      state: {
        ...state,
        potions: {
          ...(state.potions ?? emptyPotionCounts()),
          [potionId]: (state.potions?.[potionId] ?? 0) - 1,
        },
        activeMysteryPotions: [...(state.activeMysteryPotions ?? []), mysteryEffect],
      },
      mysteryEffect,
    };
  }
  if (potion.effectKind !== "stat" && potion.effectKind !== "haste") {
    const unhandled: never = potion.effectKind;
    throw new Error(`Unhandled potion effect kind: ${unhandled}`);
  }
  const currentExpiry = state.activePotions?.[potionId] ?? now;
  return {
    state: {
      ...state,
      potions: {
        ...(state.potions ?? emptyPotionCounts()),
        [potionId]: (state.potions?.[potionId] ?? 0) - 1,
      },
      activePotions: {
        ...(state.activePotions ?? {}),
        [potionId]: Math.max(now, currentExpiry) + POTION_DURATION_MS,
      },
    },
  };
}

export function activePotionRemainingMs(
  state: ProgressionState,
  potionId: PotionId,
  now = Date.now(),
): number {
  return Math.max(0, (state.activePotions?.[potionId] ?? 0) - now);
}

export function adventureSpeedMultiplier(state: ProgressionState, now = Date.now()): number {
  const standardMultiplier = POTION_IDS.reduce((multiplier, id) => {
    const potion = POTION_META[id];
    return potion.speedMultiplier > 1 && activePotionRemainingMs(state, id, now) > 0
      ? Math.max(multiplier, potion.speedMultiplier)
      : multiplier;
  }, 1);
  const mysteryAdjustment = (state.activeMysteryPotions ?? [])
    .filter((effect) => effect.expiresAt > now)
    .reduce((adjustment, effect) => adjustment
      + effect.positive.filter((id) => id === "haste").length * 0.1
      - (effect.negative === "haste" ? 0.05 : 0), 0);
  return Math.max(0.1, standardMultiplier + mysteryAdjustment);
}

export function mysteryPotionDodgeChance(state: ProgressionState, now = Date.now()): number {
  return (state.activeMysteryPotions ?? []).some((effect) => effect.expiresAt > now)
    ? MYSTERY_POTION_DODGE_CHANCE
    : 0;
}

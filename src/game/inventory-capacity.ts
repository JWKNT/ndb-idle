import Decimal from "break_eternity.js";
import { ESCAPE_ROPE_LEVELS, type EscapeRopeLevel } from "./escape-ropes";
import {
  FISH_STATS,
  MATERIAL_IDS,
  type MaterialId,
} from "./items";
import { POTION_IDS, type PotionId } from "./potions";
import type { StatKey } from "./types";
import type { ProgressionState } from "./progression/types";

export const BASE_INVENTORY_SLOTS = 24;
export const INVENTORY_SLOTS_PER_UPGRADE = 2;
export const BASE_STACK_SIZE = 100;
export const STACK_SIZE_PER_UPGRADE = 100;

export type InventoryStackId =
  | `material:${MaterialId}`
  | `fish:${StatKey}`
  | `potion:${PotionId}`
  | `escape-rope:${EscapeRopeLevel}`
  | "blacksmith-healing-potion";

const ALL_STACK_IDS: InventoryStackId[] = [
  ...MATERIAL_IDS.map((id) => `material:${id}` as const),
  ...FISH_STATS.map((stat) => `fish:${stat}` as const),
  ...POTION_IDS.map((id) => `potion:${id}` as const),
  ...ESCAPE_ROPE_LEVELS.map((level) => `escape-rope:${level}` as const),
  "blacksmith-healing-potion",
];

export function materialStackId(id: MaterialId): InventoryStackId {
  return `material:${id}`;
}

export function fishStackId(stat: StatKey): InventoryStackId {
  return `fish:${stat}`;
}

export function potionStackId(id: PotionId): InventoryStackId {
  return `potion:${id}`;
}

export function escapeRopeStackId(level: EscapeRopeLevel): InventoryStackId {
  return `escape-rope:${level}`;
}

export function inventorySlotCapacity(state: ProgressionState): number {
  return BASE_INVENTORY_SLOTS
    + Math.max(0, Math.floor(state.inventorySlotUpgrades ?? 0)) * INVENTORY_SLOTS_PER_UPGRADE;
}

export function inventoryStackCapacity(state: ProgressionState): number {
  return BASE_STACK_SIZE
    + Math.max(0, Math.floor(state.inventoryStackUpgrades ?? 0)) * STACK_SIZE_PER_UPGRADE;
}

export function inventoryUsedSlots(state: ProgressionState): number {
  const equippedIds = new Set(
    Object.values(state.equipment).flatMap((equipment) =>
      equipment ? Object.values(equipment).filter((id): id is string => Boolean(id)) : []
    ),
  );
  const unequippedGear = state.inventory.filter((item) => !equippedIds.has(item.id)).length;
  const occupiedStacks = ALL_STACK_IDS.filter((id) => inventoryStackQuantity(state, id) > 0).length;
  return unequippedGear + occupiedStacks;
}

export function inventoryStackQuantity(state: ProgressionState, id: InventoryStackId): number {
  if (id === "blacksmith-healing-potion") return state.healingPotions ?? 0;
  if (id.startsWith("material:")) {
    return state.materials[id.slice("material:".length) as MaterialId] ?? 0;
  }
  if (id.startsWith("fish:")) {
    return state.fish[id.slice("fish:".length) as StatKey] ?? 0;
  }
  if (id.startsWith("potion:")) {
    return state.potions?.[id.slice("potion:".length) as PotionId] ?? 0;
  }
  return state.escapeRopes?.[Number(id.slice("escape-rope:".length)) as EscapeRopeLevel] ?? 0;
}

export function addInventoryStack(
  state: ProgressionState,
  id: InventoryStackId,
  amount = 1,
): { state: ProgressionState; added: number; discarded: number } {
  const requested = Math.max(0, Math.floor(amount));
  if (requested === 0) return { state, added: 0, discarded: 0 };
  const current = inventoryStackQuantity(state, id);
  if (current === 0 && inventoryUsedSlots(state) >= inventorySlotCapacity(state)) {
    return { state, added: 0, discarded: requested };
  }
  const added = Math.min(requested, Math.max(0, inventoryStackCapacity(state) - current));
  if (added === 0) return { state, added: 0, discarded: requested };
  return {
    state: setInventoryStackQuantity(state, id, current + added),
    added,
    discarded: requested - added,
  };
}

/**
 * Add a non-repeatable progression reward without allowing backpack capacity
 * to soft-lock the save. Ordinary drops still use addInventoryStack and may be
 * discarded; milestone rewards expand the minimum required capacity instead.
 */
export function grantInventoryStack(
  state: ProgressionState,
  id: InventoryStackId,
  amount = 1,
): ProgressionState {
  const requested = Math.max(0, Math.floor(amount));
  if (requested === 0) return state;
  const current = inventoryStackQuantity(state, id);
  return ensureInventoryCapacity(setInventoryStackQuantity(state, id, current + requested));
}

export function canAddUniqueInventoryItem(state: ProgressionState): boolean {
  return inventoryUsedSlots(state) < inventorySlotCapacity(state);
}

export function inventorySlotUpgradeCost(purchases: number): Decimal {
  return roundedUpgradeCost(1_000, 1.35, purchases);
}

export function inventoryStackUpgradeCost(purchases: number): Decimal {
  return roundedUpgradeCost(5_000, 1.8, purchases);
}

export function purchaseInventorySlots(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  const cost = inventorySlotUpgradeCost(state.inventorySlotUpgrades ?? 0);
  if (state.gold.lt(cost)) return { state, error: "Not enough gold." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(cost),
      inventorySlotUpgrades: (state.inventorySlotUpgrades ?? 0) + 1,
    },
  };
}

export function purchaseInventoryStackSize(
  state: ProgressionState,
): { state: ProgressionState; error?: string } {
  const upgrades = Math.max(0, Math.floor(state.inventoryStackUpgrades ?? 0));
  const cost = inventoryStackUpgradeCost(upgrades);
  if (state.gold.lt(cost)) return { state, error: "Not enough gold." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(cost),
      inventoryStackUpgrades: upgrades + 1,
    },
  };
}

export function sanitizeInventoryStackUpgrades(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (!value || typeof value !== "object") return 0;
  // The short-lived per-item model is migrated at its highest purchased tier,
  // which preserves every capacity the player already unlocked.
  return Math.max(0, ...Object.values(value as Record<string, unknown>).map((raw) =>
    typeof raw === "number" && Number.isFinite(raw) ? Math.floor(raw) : 0
  ));
}

/** Preserve older saves that already exceed the newly introduced limits. */
export function ensureInventoryCapacity(state: ProgressionState): ProgressionState {
  const requiredStackUpgrades = Math.max(0, ...ALL_STACK_IDS.map((id) =>
    Math.ceil((inventoryStackQuantity(state, id) - BASE_STACK_SIZE) / STACK_SIZE_PER_UPGRADE)
  ));
  const requiredSlotUpgrades = Math.max(
    0,
    Math.ceil((inventoryUsedSlots(state) - BASE_INVENTORY_SLOTS) / INVENTORY_SLOTS_PER_UPGRADE),
  );
  return {
    ...state,
    inventorySlotUpgrades: Math.max(state.inventorySlotUpgrades ?? 0, requiredSlotUpgrades),
    inventoryStackUpgrades: Math.max(state.inventoryStackUpgrades ?? 0, requiredStackUpgrades),
  };
}

function setInventoryStackQuantity(
  state: ProgressionState,
  id: InventoryStackId,
  quantity: number,
): ProgressionState {
  if (id === "blacksmith-healing-potion") return { ...state, healingPotions: quantity };
  if (id.startsWith("material:")) {
    const materialId = id.slice("material:".length) as MaterialId;
    return { ...state, materials: { ...state.materials, [materialId]: quantity } };
  }
  if (id.startsWith("fish:")) {
    const stat = id.slice("fish:".length) as StatKey;
    return { ...state, fish: { ...state.fish, [stat]: quantity } };
  }
  if (id.startsWith("potion:")) {
    const potionId = id.slice("potion:".length) as PotionId;
    return { ...state, potions: { ...state.potions, [potionId]: quantity } };
  }
  const level = Number(id.slice("escape-rope:".length)) as EscapeRopeLevel;
  return { ...state, escapeRopes: { ...state.escapeRopes, [level]: quantity } };
}

function roundedUpgradeCost(base: number, growth: number, purchases: number): Decimal {
  return new Decimal(base)
    .mul(new Decimal(growth).pow(Math.max(0, Math.floor(purchases))))
    .div(100)
    .ceil()
    .mul(100);
}

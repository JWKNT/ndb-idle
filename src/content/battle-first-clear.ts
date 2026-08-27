import type { MaterialId } from "@/game/items";
import type { MilestoneGearId } from "@/game/gear";
import type { QuestId } from "./quests";
import type { SpriteName } from "./sprites";
import { levels, type BattleNumber } from "./levels";

export type BattleFirstClearEffect =
  | { kind: "none" }
  | { kind: "unlock-adventure" }
  | { kind: "start-quest"; questId: QuestId }
  | { kind: "grant-milestone-gear"; gearId: MilestoneGearId }
  | { kind: "grant-material"; materialId: MaterialId; onlyIfNone?: boolean };

export interface BattleRewardNotice {
  title: string;
  sprite: SpriteName;
  description: string;
  discarded?: {
    title: string;
    description: string;
  };
}

export interface BattleFirstClearContract {
  effect: BattleFirstClearEffect;
  reward: BattleRewardNotice | null;
}

/**
 * The extension gate for Battles. A new Battle must explicitly choose its
 * first-clear state effect and whether it has a click-through reward notice.
 */
export const BATTLE_FIRST_CLEAR_CONTRACTS: Record<BattleNumber, BattleFirstClearContract> = {
  1: {
    effect: { kind: "unlock-adventure" },
    reward: { title: "Lowering Rope obtained", sprite: "loweringRope", description: "Adventure unlocked." },
  },
  2: { effect: { kind: "none" }, reward: null },
  3: {
    effect: { kind: "start-quest", questId: "rescue-shopkeeper" },
    reward: { title: "Quest obtained: Lost Adventurer", sprite: "questScroll", description: "" },
  },
  4: {
    effect: { kind: "none" },
    reward: { title: "Quest unlocked: Rescue Me", sprite: "questScroll", description: "Available from the Shop." },
  },
  5: {
    effect: { kind: "none" },
    reward: { title: "Quest unlocked: Retrieve Lost Item", sprite: "questScroll", description: "" },
  },
  6: {
    effect: { kind: "grant-milestone-gear", gearId: "shaman-ring" },
    reward: {
      title: "Shaman's Ring obtained",
      sprite: "gearShamanRing",
      description: "It has a 20% chance to teleport you away from Adventure damage.",
      discarded: { title: "Shaman's Ring discarded", description: "Backpack full. The Ring was discarded." },
    },
  },
  7: {
    effect: { kind: "none" },
    reward: {
      title: "Bestiary obtained",
      sprite: "bestiary",
      description: "Bestiary unlocked. New creatures can now appear in Adventure.",
    },
  },
  8: {
    effect: { kind: "grant-material", materialId: "rotten-tentacle", onlyIfNone: true },
    reward: {
      title: "Rotten Tentacle obtained",
      sprite: "rottenTentacle",
      description: "Reusable bait that can catch Driftwood and Seaweed.",
      discarded: { title: "Rotten Tentacle discarded", description: "Backpack full. The Tentacle was discarded." },
    },
  },
  9: {
    effect: { kind: "grant-milestone-gear", gearId: "suction-cups" },
    reward: {
      title: "Suction Cups obtained",
      sprite: "gearSuctionCups",
      description: "When a non-boss hits you, there is a 15% chance the Cups grab it.",
      discarded: { title: "Suction Cups discarded", description: "Backpack full. The Suction Cups were discarded." },
    },
  },
  10: {
    effect: { kind: "grant-material", materialId: "rusty-gear" },
    reward: {
      title: "Rusty Gear obtained",
      sprite: "rustyGear",
      description: "Crafting material obtained.",
      discarded: { title: "Rusty Gear discarded", description: "Backpack full. The Rusty Gear was discarded." },
    },
  },
  11: { effect: { kind: "none" }, reward: null },
};

export function isBattleNumber(value: number): value is BattleNumber {
  return levels.some(({ number }) => number === value);
}

export function battleFirstClearContract(level: number): BattleFirstClearContract {
  if (!isBattleNumber(level)) throw new Error(`Missing first-clear contract for Battle ${level}.`);
  return BATTLE_FIRST_CLEAR_CONTRACTS[level];
}

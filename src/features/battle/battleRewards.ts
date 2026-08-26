import { enemySprite } from "@/content/enemy-sprites";
import { getLevel } from "@/content/levels";
import type { RewardPopupContent } from "@/features/shell/RewardPopup";

/** Click-through victory sequence for every first Battle clear. */
export function battleRewardPopups(level: number, rewardDiscarded = false): RewardPopupContent[] {
  const definition = getLevel(level);
  const boss = definition.enemies.find((spawn) => spawn.unit.isRaidBoss)
    ?? definition.enemies.at(-1);
  const defeated: RewardPopupContent = {
    title: `Defeated ${definition.name}`,
    sprite: enemySprite(boss?.unit.id ?? "goblin"),
    description: "",
  };
  let reward: RewardPopupContent | null = null;

  if (level === 1) {
    reward = {
      title: "Lowering Rope obtained",
      sprite: "loweringRope",
      description: "Adventure unlocked.",
    };
  } else if (level === 3) {
    reward = {
      title: "Quest obtained: Lost Adventurer",
      sprite: "questScroll",
      description: "",
    };
  } else if (level === 4) {
    reward = {
      title: "Quest unlocked: Rescue Me",
      sprite: "questScroll",
      description: "Available from the Shop.",
    };
  } else if (level === 5) {
    reward = {
      title: "Quest unlocked: Retrieve Lost Item",
      sprite: "questScroll",
      description: "",
    };
  } else if (level === 6) {
    reward = {
      title: rewardDiscarded ? "Shaman's Ring discarded" : "Shaman's Ring obtained",
      sprite: "gearShamanRing",
      description: rewardDiscarded
        ? "Backpack full. The Ring was discarded."
        : "It has a 20% chance to teleport you away from Adventure damage.",
    };
  } else if (level === 7) {
    reward = {
      title: "Bestiary obtained",
      sprite: "bestiary",
      description: "Bestiary unlocked. New creatures can now appear in Adventure.",
    };
  } else if (level === 8) {
    reward = {
      title: rewardDiscarded ? "Rotten Tentacle discarded" : "Rotten Tentacle obtained",
      sprite: "rottenTentacle",
      description: rewardDiscarded
        ? "Backpack full. The Tentacle was discarded."
        : "Reusable bait that can catch Driftwood and Seaweed.",
    };
  } else if (level === 9) {
    reward = {
      title: rewardDiscarded ? "Suction Cups discarded" : "Suction Cups obtained",
      sprite: "gearSuctionCups",
      description: rewardDiscarded
        ? "Backpack full. The Suction Cups were discarded."
        : "When a non-boss hits you, there is a 15% chance the Cups grab it.",
    };
  } else if (level === 10) {
    reward = {
      title: rewardDiscarded ? "Rusty Gear discarded" : "Rusty Gear obtained",
      sprite: "rustyGear",
      description: rewardDiscarded
        ? "Backpack full. The Rusty Gear was discarded."
        : "Crafting material obtained.",
    };
  }

  return reward ? [defeated, reward] : [defeated];
}

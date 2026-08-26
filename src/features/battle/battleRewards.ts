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
      description: "Adventure unlocked. NDB MEGASOFTWARE has added downward mobility.",
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
      description: "A horrible wet voice is screaming somewhere in the Overgrown Galleries. It sounds expensive.",
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
        ? "Backpack full. The Ring rolled under the UI and ceased to exist."
        : "It has a 20% chance to teleport you away from Adventure damage.",
    };
  } else if (level === 7) {
    reward = {
      title: "Bestiary obtained",
      sprite: "bestiary",
      description: "Frogs, Mutant Rats, Fire Ants, and Charles have entered the corporate ecosystem.",
    };
  } else if (level === 8) {
    reward = {
      title: rewardDiscarded ? "Rotten Tentacle discarded" : "Rotten Tentacle obtained",
      sprite: "rottenTentacle",
      description: rewardDiscarded
        ? "Backpack full. The Tentacle remains on the floor and immediately sticks to it."
        : "Reusable forever to fish up Driftwood and Seaweed.",
    };
  } else if (level === 9) {
    reward = {
      title: rewardDiscarded ? "Suction Cups discarded" : "Suction Cups obtained",
      sprite: "gearSuctionCups",
      description: rewardDiscarded
        ? "Backpack full. The floor is now technically the owner."
        : "When a non-boss hits you, there is a 15% chance the Cups grab it.",
    };
  } else if (level === 10) {
    reward = {
      title: rewardDiscarded ? "Rusty Gear discarded" : "Rusty Gear obtained",
      sprite: "rustyGear",
      description: rewardDiscarded
        ? "Backpack full. The Gear flattened its own receipt and vanished."
        : "Several hundred pounds of spinning tetanus now occupy one backpack square.",
    };
  }

  return reward ? [defeated, reward] : [defeated];
}

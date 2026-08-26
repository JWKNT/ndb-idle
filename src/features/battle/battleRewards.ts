import { enemySprite } from "@/content/enemy-sprites";
import { getLevel } from "@/content/levels";
import type { RewardPopupContent } from "@/features/shell/RewardPopup";

/** Persistent victory copy for every first Battle clear. */
export function battleRewardPopup(level: number, rewardDiscarded = false): RewardPopupContent {
  const definition = getLevel(level);
  const boss = definition.enemies.find((spawn) => spawn.unit.isRaidBoss)
    ?? definition.enemies.at(-1);
  let description = level < 10
    ? ""
    : "Ten Battles beaten, several ecosystems ruined, zero lessons learned.";

  if (level === 1) {
    description = "Lowering Rope obtained. Adventure unlocked! Climb into the giant murder-hole using rope stolen from the man who tried to put you in a smaller murder-hole.";
  } else if (level === 3) {
    description = "Quest obtained: Lost Adventurer.";
  } else if (level === 4) {
    description = "Quest unlocked: Rescue Me. A horrible wet voice is screaming somewhere in the Overgrown Galleries. It sounds expensive.";
  } else if (level === 5) {
    description = "Quest unlocked: Retrieve Lost Item. A Fishing Rod has been lost SO HARD it left this dimension.";
  } else if (level === 6) {
    description = rewardDiscarded
      ? "Backpack full! The Shaman's Ring hit the ground, rolled under the UI, and ceased to exist. Excellent inventory work."
      : "Shaman's Ring obtained! It has a 20% chance to teleport you away from Adventure damage and an 80% chance to be gross Goblin finger-jewelry.";
  } else if (level === 7) {
    description = "Bestiary obtained! Hover over your victims to learn facts that make killing them feel either better or MUCH worse. Frogs, Mutant Rats, and Fire Ants also invaded the early dungeon. Charles wants their loose parts. Do not shake Charles's hand.";
  } else if (level === 8) {
    description = rewardDiscarded
      ? "Backpack full! The Rotten Tentacle remains on the floor, where it immediately sticks to something you can no longer identify."
      : "Rotten Tentacle obtained! Reusable forever to fish up wood and weeds. The fish bite it once, taste it, and make the correct decision.";
  } else if (level === 9) {
    description = rewardDiscarded
      ? "Backpack full! The Suction Cups attached to the floor, which is now technically the owner."
      : "Suction Cups obtained! When a non-boss hits you, there is a 15% chance the Cups grab it. Where are they attached? SHUT UP.";
  } else if (level === 10) {
    description = rewardDiscarded
      ? "Backpack full! The enormous Rusty Gear bounced out, flattened its own receipt, and vanished. Monumental inventory work."
      : "Rusty Gear obtained! Several hundred pounds of spinning tetanus are now inside one backpack square. Logistics applauds.";
  }

  return {
    title: `Defeated ${definition.name}`,
    sprite: enemySprite(boss?.unit.id ?? "goblin"),
    description,
  };
}

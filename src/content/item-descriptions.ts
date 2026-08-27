import type { MilestoneGearId } from "@/game/gear";

/** A milestone item is incomplete until its inventory description exists. */
export const MILESTONE_GEAR_DESCRIPTIONS: Record<MilestoneGearId, string> = {
  trident: "A Merman threw this at your head, so legally it is yours. Right-click to throw it! Bonuses join base stats before Gold training.",
  "undead-gem": "Turns off the Skele-King's coward bubble. Does nothing to living Kings, medium-dead Kings, or stains. Bonuses join base stats before Gold training.",
  "shaman-ring": "20% chance to teleport away from Adventure damage. 80% chance to remain damp Goblin jewelry touching your skin. Bonuses join base stats before Gold training.",
  "suction-cups": "15% chance to grab and paralyze a non-boss attacker. WHERE the Cups grab it is between the Cups and several lawyers. Bonuses join base stats before Gold training.",
};

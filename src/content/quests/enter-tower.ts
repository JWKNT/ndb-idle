import Decimal from "break_eternity.js";

export const enterTowerQuest = {
  id: "enter-tower",
  name: "Enter Tower",
  description: "Enter the marked Forge, clear three arenas, and recover the Blacksmith's Blueprints.",
  cost: new Decimal(100_000),
  unlockBattle: 9,
  shopAvailable: true,
} as const;

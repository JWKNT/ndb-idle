import Decimal from "break_eternity.js";

export const enterTowerQuest = {
  id: "enter-tower",
  name: "Enter Tower",
  description: "Enter the marked Forge, survive three rooms of flaming ankle-goblins, and steal some extremely flammable Blueprints.",
  cost: new Decimal(100_000),
  unlockBattle: 9,
  shopAvailable: true,
} as const;

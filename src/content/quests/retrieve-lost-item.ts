import Decimal from "break_eternity.js";

export const retrieveLostItemQuest = {
  id: "retrieve-lost-item",
  name: "Retrieve Lost Item",
  description: "Enter the marked Water Dungeon portal and recover the lost item.",
  cost: new Decimal(1_000),
  unlockBattle: 5,
  shopAvailable: true,
} as const;

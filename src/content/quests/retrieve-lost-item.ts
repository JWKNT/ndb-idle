import Decimal from "break_eternity.js";

export const retrieveLostItemQuest = {
  id: "retrieve-lost-item",
  name: "Retrieve Lost Item",
  description: "Enter the Water Dungeon portal and recover a Fishing Rod somebody lost ACROSS DIMENSIONS. How bad are they at holding things?",
  cost: new Decimal(1_000),
  unlockBattle: 5,
  shopAvailable: true,
} as const;

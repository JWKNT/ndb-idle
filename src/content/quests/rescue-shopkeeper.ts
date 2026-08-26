import Decimal from "break_eternity.js";

export const rescueShopkeeperQuest = {
  id: "rescue-shopkeeper",
  name: "Lost Adventurer",
  description: "Follow the marker through the Underdrain. Three Skeletons, one cage, one screaming stranger, and one bucket nobody discusses.",
  cost: new Decimal(0),
  unlockBattle: 3,
  shopAvailable: false,
} as const;

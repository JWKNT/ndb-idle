import Decimal from "break_eternity.js";

export const rescueShopkeeperQuest = {
  id: "rescue-shopkeeper",
  name: "Lost Adventurer",
  description: "Follow the marker through the Underdrain, defeat three Skeletons, and rescue the captive.",
  cost: new Decimal(0),
  unlockBattle: 3,
  shopAvailable: false,
} as const;

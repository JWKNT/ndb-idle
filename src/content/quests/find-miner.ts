import Decimal from "break_eternity.js";

export const findMinerQuest = {
  id: "find-miner",
  name: "Find the Miner",
  description: "Bring the Pickaxe to the Miner in the Clay Catacombs.",
  cost: new Decimal(0),
  unlockBattle: 8,
  shopAvailable: false,
} as const;

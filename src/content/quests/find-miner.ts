import Decimal from "break_eternity.js";

export const findMinerQuest = {
  id: "find-miner",
  name: "Find the Miner",
  description: "Bring the Pickaxe to the Miner in the Clay Catacombs before one more headbutted rock turns him into a decorative vegetable.",
  cost: new Decimal(0),
  unlockBattle: 8,
  shopAvailable: false,
} as const;

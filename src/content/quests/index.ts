import { findMinerQuest } from "./find-miner";
import { rescueMeQuest } from "./rescue-me";
import { rescueShopkeeperQuest } from "./rescue-shopkeeper";
import { retrieveLostItemQuest } from "./retrieve-lost-item";
import { enterTowerQuest } from "./enter-tower";

export const quests = [rescueShopkeeperQuest, rescueMeQuest, retrieveLostItemQuest, findMinerQuest, enterTowerQuest] as const;
export type QuestId = typeof quests[number]["id"];

export function getQuest(id: string) {
  return quests.find((quest) => quest.id === id);
}

export { enterTowerQuest, findMinerQuest, rescueMeQuest, rescueShopkeeperQuest, retrieveLostItemQuest };

import { findMinerQuest } from "./find-miner";
import { rescueMeQuest } from "./rescue-me";
import { rescueShopkeeperQuest } from "./rescue-shopkeeper";
import { retrieveLostItemQuest } from "./retrieve-lost-item";
import { enterTowerQuest } from "./enter-tower";
import type { PlayerId } from "../../game/types";

export const quests = [rescueShopkeeperQuest, rescueMeQuest, retrieveLostItemQuest, findMinerQuest, enterTowerQuest] as const;
export type QuestId = typeof quests[number]["id"];

export type QuestCompletionEffect =
  | { kind: "unlock-shop" }
  | { kind: "recruit-player"; playerId: PlayerId }
  | { kind: "unlock-fishing" }
  | { kind: "unlock-mining" };

/** Every quest must explicitly declare all of its cross-system completion effects. */
export const QUEST_COMPLETION_EFFECTS: Record<QuestId, readonly QuestCompletionEffect[]> = {
  "rescue-shopkeeper": [{ kind: "unlock-shop" }],
  "rescue-me": [{ kind: "recruit-player", playerId: "worm" }],
  "retrieve-lost-item": [{ kind: "unlock-fishing" }],
  "find-miner": [
    { kind: "recruit-player", playerId: "miner" },
    { kind: "unlock-mining" },
  ],
  "enter-tower": [],
};

export function getQuest(id: string) {
  return quests.find((quest) => quest.id === id);
}

export { enterTowerQuest, findMinerQuest, rescueMeQuest, rescueShopkeeperQuest, retrieveLostItemQuest };

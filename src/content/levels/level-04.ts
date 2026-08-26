import type { LevelDefinition } from "../../game/types";
import { graveyardBoard, graveyardRandomSpawnPositions } from "../boards/graveyard-board";
import { skeletonBrachiosaurus } from "../enemies/skeleton-brachiosaurus";
import { skeletonGiraffe } from "../enemies/skeleton-giraffe";
import { skeletonHippo } from "../enemies/skeleton-hippo";
import { skeletonKing } from "../enemies/skeleton-king";
import { skeletonRhino } from "../enemies/skeleton-rhino";

export const level04: LevelDefinition = {
  number: 4,
  name: "Skele-King",
  description: "EQUIP the Undead Gem, pop the coward bubble, and reduce the King to non-royal calcium chunks.",
  reward: "0",
  board: graveyardBoard,
  playerPositions: { knight: { x: 0, y: 3 }, worm: { x: 0, y: 4 } },
  randomSpawnPositions: graveyardRandomSpawnPositions,
  enemies: [
    { instanceId: "battle-skele-giraffe-3", unit: skeletonGiraffe, position: { x: 1, y: 2 } },
    { instanceId: "battle-skele-hippo-3", unit: skeletonHippo, position: { x: 3, y: 2 } },
    { instanceId: "battle-skele-rhino-2", unit: skeletonRhino, position: { x: 5, y: 2 } },
    { instanceId: "battle-skele-brachiosaurus-1", unit: skeletonBrachiosaurus, position: { x: 5, y: 4 } },
    { instanceId: "battle-boss-skele-king", unit: skeletonKing, position: { x: 7, y: 3 } },
  ],
};

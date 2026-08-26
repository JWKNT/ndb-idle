import type { LevelDefinition } from "../../game/types";
import { graveyardBoard, graveyardRandomSpawnPositions } from "../boards/graveyard-board";
import { skeleton } from "../enemies/skeleton";
import { skeletonGiraffe } from "../enemies/skeleton-giraffe";
import { skeletonHippo } from "../enemies/skeleton-hippo";

export const level02: LevelDefinition = {
  number: 2,
  name: "Restless Skeleton",
  description: "Defeat every enemy.",
  reward: "0",
  board: graveyardBoard,
  playerPositions: {
    knight: { x: 0, y: 3 },
    worm: { x: 0, y: 4 },
  },
  randomSpawnPositions: graveyardRandomSpawnPositions,
  enemies: [
    { instanceId: "battle-skele-giraffe-1", unit: skeletonGiraffe, position: { x: 1, y: 2 } },
    { instanceId: "battle-skele-hippo-1", unit: skeletonHippo, position: { x: 5, y: 4 } },
    { instanceId: "battle-boss-skeleton", unit: skeleton, position: { x: 7, y: 3 } },
  ],
};

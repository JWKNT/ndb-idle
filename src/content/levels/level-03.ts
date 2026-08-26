import type { LevelDefinition } from "../../game/types";
import { graveyardBoard, graveyardRandomSpawnPositions } from "../boards/graveyard-board";
import { skeletonGiraffe } from "../enemies/skeleton-giraffe";
import { skeletonHippo } from "../enemies/skeleton-hippo";
import { skeletonPrince } from "../enemies/skeleton-prince";
import { skeletonRhino } from "../enemies/skeleton-rhino";

export const level03: LevelDefinition = {
  number: 3,
  name: "Skele-Prince",
  description: "A Skeleton found a crown and became Prince. Finders keepers has gone TOO FAR. Remove his everything.",
  reward: "Quest: Lost Adventurer",
  board: graveyardBoard,
  playerPositions: {
    knight: { x: 0, y: 3 },
    worm: { x: 0, y: 4 },
  },
  randomSpawnPositions: graveyardRandomSpawnPositions,
  enemies: [
    { instanceId: "battle-skele-giraffe-2", unit: skeletonGiraffe, position: { x: 1, y: 2 } },
    { instanceId: "battle-skele-hippo-2", unit: skeletonHippo, position: { x: 3, y: 2 } },
    { instanceId: "battle-skele-rhino-1", unit: skeletonRhino, position: { x: 5, y: 2 } },
    { instanceId: "battle-boss-skele-prince", unit: skeletonPrince, position: { x: 7, y: 3 } },
  ],
};

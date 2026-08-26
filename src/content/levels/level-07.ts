import type { LevelDefinition } from "../../game/types";
import { beastTamerBoard } from "../boards/beast-tamer-board";
import { beastTamer } from "../enemies/beast-tamer";

export const level07: LevelDefinition = {
  number: 7,
  name: "Beast Tamer",
  description: "Smash the cages, kill the petting zoo, then un-tame the Tamer's face with your strongest blunt object.",
  reward: "0",
  board: beastTamerBoard,
  playerPositions: { knight: { x: 1, y: 4 }, worm: { x: 1, y: 5 } },
  enemies: [
    { instanceId: "battle-boss-beast-tamer", unit: beastTamer, position: { x: 11, y: 4 } },
  ],
};

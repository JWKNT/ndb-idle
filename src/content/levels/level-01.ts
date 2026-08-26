import { graveyardBoard } from "../boards/graveyard-board";
import { undertaker } from "../enemies/undertaker";
import type { LevelDefinition } from "../../game/types";

export const level01: LevelDefinition = {
  number: 1,
  name: "Undertaker",
  description: "Defeat the Undertaker.",
  reward: "0",
  board: graveyardBoard,
  playerPositions: {
    knight: { x: 0, y: 3 },
    worm: { x: 0, y: 4 },
  },
  enemies: [
    {
      instanceId: "battle-boss-undertaker",
      unit: undertaker,
      position: { x: 7, y: 3 },
    },
  ],
};

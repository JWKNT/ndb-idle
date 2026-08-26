import type { LevelDefinition } from "../../game/types";
import { goblinBridgeBoard } from "../boards/goblin-bridge-board";
import { goblinChief } from "../enemies/goblin-chief";
import { goblin } from "../enemies/goblin";

export const level05: LevelDefinition = {
  number: 5,
  name: "Goblin Chief",
  description: "Cross the world's least convincing bridge and beat its Goblin landlord to death. Mind the huge missing bits!",
  reward: "0",
  board: goblinBridgeBoard,
  playerPositions: { knight: { x: 0, y: 5 }, worm: { x: 1, y: 5 } },
  enemies: [
    { instanceId: "battle-goblin-5-1", unit: goblin, position: { x: 14, y: 2 } },
    { instanceId: "battle-goblin-5-2", unit: goblin, position: { x: 16, y: 2 } },
    { instanceId: "battle-goblin-5-3", unit: goblin, position: { x: 11, y: 5 } },
    { instanceId: "battle-goblin-5-4", unit: goblin, position: { x: 14, y: 8 } },
    { instanceId: "battle-goblin-5-5", unit: goblin, position: { x: 16, y: 8 } },
    { instanceId: "battle-boss-goblin-chief", unit: goblinChief, position: { x: 17, y: 5 } },
  ],
};

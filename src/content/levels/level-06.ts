import { defineLevel } from "../../game/types";
import { goblinArcherBoard } from "../boards/goblin-archer-board";
import { goblinArcher } from "../enemies/goblin-archer";
import { goblinShaman } from "../enemies/goblin-shaman";
import { goblin } from "../enemies/goblin";

export const level06 = defineLevel({
  number: 6,
  name: "Goblin Shaman",
  description: "Defeat the Goblin Shaman and its guards.",
  reward: "Shaman's Ring",
  board: goblinArcherBoard,
  playerPositions: { knight: { x: 0, y: 5 }, worm: { x: 1, y: 5 } },
  enemies: [
    { instanceId: "battle-goblin-archer-1", unit: goblinArcher, position: { x: 5, y: 0 } },
    { instanceId: "battle-goblin-archer-2", unit: goblinArcher, position: { x: 8, y: 0 } },
    { instanceId: "battle-goblin-archer-3", unit: goblinArcher, position: { x: 5, y: 10 } },
    { instanceId: "battle-goblin-archer-4", unit: goblinArcher, position: { x: 8, y: 10 } },
    { instanceId: "battle-goblin-6-1", unit: goblin, position: { x: 14, y: 0 } },
    { instanceId: "battle-goblin-6-2", unit: goblin, position: { x: 16, y: 0 } },
    { instanceId: "battle-goblin-6-3", unit: goblin, position: { x: 9, y: 5 } },
    { instanceId: "battle-goblin-6-4", unit: goblin, position: { x: 14, y: 10 } },
    { instanceId: "battle-goblin-6-5", unit: goblin, position: { x: 16, y: 10 } },
    { instanceId: "battle-shaman-real", unit: goblinShaman, position: { x: 17, y: 5 } },
  ],
});

import type { LevelDefinition, Position } from "../../game/types";
import { oozeBoard } from "../boards/ooze-board";
import { abyssalOoze } from "../enemies/abyssal-ooze";
import { oozeGuardian } from "../enemies/ooze-guardian";
import { squidKnight } from "../enemies/squid-knight";

const guardianPositions: Position[] = [
  { x: 14, y: 2 },
  { x: 11, y: 8 },
  { x: 18, y: 8 },
];

const standardMobPositions: Position[] = [
  { x: 8, y: 2 }, { x: 8, y: 10 },
  { x: 10, y: 3 }, { x: 10, y: 9 },
  { x: 17, y: 2 }, { x: 17, y: 10 },
];

export const level09: LevelDefinition = {
  number: 9,
  name: "Abyssal Ooze",
  description: "Kill all three Guardians or deal 1 damage until you die at your keyboard with a very smooth clicking finger.",
  reward: "Suction Cups",
  board: oozeBoard,
  playerPositions: {
    knight: { x: 1, y: 6 },
    worm: { x: 1, y: 7 },
    miner: { x: 1, y: 5 },
  },
  enemies: [
    ...standardMobPositions.map((position, index) => ({
      instanceId: `enemy-ooze-squid-knight-${index + 1}`,
      unit: squidKnight,
      position,
    })),
    ...guardianPositions.map((position, index) => ({
      instanceId: `enemy-ooze-guardian-${index + 1}`,
      unit: oozeGuardian,
      position,
    })),
    { instanceId: "battle-boss-abyssal-ooze", unit: abyssalOoze, position: { x: 15, y: 6 } },
  ],
};

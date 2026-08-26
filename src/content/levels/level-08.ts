import type { LevelDefinition } from "../../game/types";
import { squidBoard, squidKnightPositions, squidTentaclePositions } from "../boards/squid-board";
import { abyssalSquid } from "../enemies/abyssal-squid";
import { squidKnight } from "../enemies/squid-knight";
import { squidTentacle } from "../enemies/squid-tentacle";

export const level08: LevelDefinition = {
  number: 8,
  name: "Abyssal Squid",
  description: "Defeat the Tentacles, then defeat the Abyssal Squid.",
  reward: "0",
  board: squidBoard,
  playerPositions: { knight: { x: 2, y: 6 }, worm: { x: 2, y: 7 } },
  enemies: [
    ...squidKnightPositions.map((position, index) => ({
      instanceId: `enemy-squid-knight-${index + 1}`,
      unit: squidKnight,
      position,
    })),
    ...squidTentaclePositions.map((position, index) => ({
      instanceId: `enemy-squid-tentacle-${index + 1}`,
      unit: squidTentacle,
      position,
    })),
    { instanceId: "battle-boss-abyssal-squid", unit: abyssalSquid, position: { x: 13, y: 6 } },
  ],
};

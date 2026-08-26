import type { LevelDefinition, Position } from "../../game/types";
import { rustmireBoard } from "../boards/rustmire-board";
import { barnacleDrone } from "../enemies/barnacle-drone";
import { brineDynamo } from "../enemies/brine-dynamo";
import { rustmireEngine } from "../enemies/rustmire-engine";

const dronePositions: Position[] = [
  { x: 10, y: 1 }, { x: 10, y: 13 },
  // Keep the Colossus's three-wide turn lane open at y=3/y=11. These flankers
  // still mirror one another without pinning the 3x3 boss behind its own line.
  { x: 17, y: 1 }, { x: 17, y: 13 },
  { x: 22, y: 5 }, { x: 22, y: 9 },
];

export const level10: LevelDefinition = {
  number: 10,
  name: "Rusttide Colossus",
  description: "Walk around the giant leaking boat-monster and smash the huge glowing Dynamo. THE GLOWING THING. HIT IT.",
  reward: "Rusty Gear",
  board: rustmireBoard,
  playerPositions: {
    knight: { x: 2, y: 7 },
    worm: { x: 1, y: 6 },
    miner: { x: 1, y: 8 },
  },
  enemies: [
    ...dronePositions.map((position, index) => ({
      instanceId: `enemy-barnacle-drone-${index + 1}`,
      unit: barnacleDrone,
      position,
    })),
    { instanceId: "enemy-brine-dynamo", unit: brineDynamo, position: { x: 24, y: 7 } },
    { instanceId: "battle-boss-rustmire-engine", unit: rustmireEngine, position: { x: 18, y: 7 } },
  ],
};

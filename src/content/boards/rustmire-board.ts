import { defineBoard, type Position } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

const WIDTH = 27;
const HEIGHT = 15;

function rectangle(x: number, y: number, width: number, height: number): Position[] {
  return Array.from({ length: width * height }, (_, index) => ({
    x: x + (index % width),
    y: y + Math.floor(index / width),
  }));
}

// Alternating machinery banks force three distinct turns through the arena.
// Every passage is at least three tiles wide, so the 3x3 Rusttide Colossus can
// travel the same routes as the party instead of being confined to its spawn.
const walls = [
  ...rectangle(6, 0, 3, 5),
  ...rectangle(6, 10, 3, 5),
  ...rectangle(12, 5, 4, 5),
  ...rectangle(19, 0, 3, 5),
  ...rectangle(19, 10, 3, 5),
];

const deploymentTiles = rectangle(0, 5, 5, 5).concat(rectangle(5, 6, 1, 3));

export const rustmireBoard = defineBoard({
  id: "rustmire-board",
  name: "Flooded Foundry",
  width: WIDTH,
  height: HEIGHT,
  terrain: battleTerrain(WIDTH, HEIGHT),
  walls,
  floorTheme: "abyssal-metal",
  wallTheme: "pressure-vat",
  deploymentTiles,
  decorations: [
    { position: { x: 1, y: 2 }, kind: "rustmirePipeCorner" },
    { position: { x: 3, y: 6 }, kind: "rustmireGrate" },
    { position: { x: 5, y: 8 }, kind: "rustmirePuddle" },
    { position: { x: 9, y: 3 }, kind: "rustmireValve" },
    { position: { x: 10, y: 7 }, kind: "rustmirePipeStraight" },
    { position: { x: 11, y: 12 }, kind: "rustmireLamp" },
    { position: { x: 16, y: 2 }, kind: "rustmirePipeJunction" },
    { position: { x: 17, y: 7 }, kind: "rustmireGrate" },
    { position: { x: 18, y: 12 }, kind: "rustmirePuddle" },
    { position: { x: 23, y: 2 }, kind: "rustmireLamp" },
    { position: { x: 24, y: 7 }, kind: "rustmireValve" },
    { position: { x: 25, y: 12 }, kind: "rustmirePipeCorner" },
  ],
});

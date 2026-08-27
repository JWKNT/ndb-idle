import { defineBoard, type Position } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

export const ARCHIPELAGO_WIDTH = 39;
export const ARCHIPELAGO_HEIGHT = 23;

function rectangle(x: number, y: number, width: number, height: number): Position[] {
  return Array.from({ length: width * height }, (_, index) => ({
    x: x + (index % width),
    y: y + Math.floor(index / width),
  }));
}

function ellipse(cx: number, cy: number, rx: number, ry: number): Position[] {
  const positions: Position[] = [];
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const normalizedX = (x - cx) / rx;
      const normalizedY = (y - cy) / ry;
      if (normalizedX ** 2 + normalizedY ** 2 <= 1.08) positions.push({ x, y });
    }
  }
  return positions;
}

function key({ x, y }: Position): string {
  return `${x},${y}`;
}

// A broad western beach tapers out from the previous arena. Every other mound
// is a separate land component; no current party member can cross the ocean.
const land = [
  ...rectangle(0, 7, 6, 9),
  ...rectangle(6, 9, 3, 5),
  { x: 9, y: 11 },
  ...ellipse(15, 5, 4, 3),
  ...ellipse(15, 17, 4, 3),
  ...ellipse(25, 11, 5, 4),
  ...ellipse(34, 3, 3, 2),
  ...ellipse(34, 19, 3, 2),
  ...ellipse(36, 11, 2, 4),
].filter(({ x, y }) => x >= 0 && y >= 0 && x < ARCHIPELAGO_WIDTH && y < ARCHIPELAGO_HEIGHT);

export const archipelagoLand = [...new Map(land.map((position) => [key(position), position])).values()];
const landKeys = new Set(archipelagoLand.map(key));
const gaps = Array.from(
  { length: ARCHIPELAGO_WIDTH * ARCHIPELAGO_HEIGHT },
  (_, index) => ({
    x: index % ARCHIPELAGO_WIDTH,
    y: Math.floor(index / ARCHIPELAGO_WIDTH),
  }),
).filter((position) => !landKeys.has(key(position)));

const deploymentTiles = rectangle(0, 9, 7, 5)
  .filter((position) => landKeys.has(key(position)));

export const archipelagoBoard = defineBoard({
  id: "archipelago-board",
  name: "The Extremely Available Archipelago",
  width: ARCHIPELAGO_WIDTH,
  height: ARCHIPELAGO_HEIGHT,
  terrain: battleTerrain(ARCHIPELAGO_WIDTH, ARCHIPELAGO_HEIGHT),
  walls: [],
  gaps,
  gapTheme: "ocean",
  floorTheme: "sand",
  deploymentTiles,
  decorations: [
    { position: { x: 2, y: 8 }, kind: "beachPalm" },
    { position: { x: 5, y: 14 }, kind: "beachPalm" },
    { position: { x: 7, y: 12 }, kind: "beachDriftwood" },
    { position: { x: 2, y: 12 }, kind: "beachShells" },
    { position: { x: 13, y: 4 }, kind: "beachPalm" },
    { position: { x: 18, y: 6 }, kind: "beachPalm" },
    { position: { x: 15, y: 7 }, kind: "beachShells" },
    { position: { x: 13, y: 17 }, kind: "beachPalm" },
    { position: { x: 18, y: 18 }, kind: "beachPalm" },
    { position: { x: 22, y: 10 }, kind: "beachPalm" },
    { position: { x: 28, y: 12 }, kind: "beachPalm" },
    { position: { x: 25, y: 14 }, kind: "beachDriftwood" },
    { position: { x: 26, y: 8 }, kind: "beachShells" },
    { position: { x: 31, y: 3 }, kind: "beachPalm" },
    { position: { x: 31, y: 19 }, kind: "beachPalm" },
    { position: { x: 35, y: 8 }, kind: "beachPalm" },
    { position: { x: 37, y: 14 }, kind: "beachPalm" },
  ],
});

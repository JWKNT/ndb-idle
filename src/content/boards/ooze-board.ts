import { defineBoard, type Position } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

const layout = [
  "GGGGGWWWWGGGWWWWGGGGG",
  "GGGGWWWWWWBWWWWWWGGGG",
  "GGGWWWWWWWWWWWWWWWGGG",
  "WWWWWGGGWWWWWWWWWWWWW",
  "WWWWGBWWWWWWWWWWWWWWW",
  "WWWGGWWWWWWWWWWWWWWWW",
  "WWWWWWWWWWWWWWWWWWWWW",
  "WWWGGWWWWWWWWWWWWWWWW",
  "WWWWGBWWWWWWWWWWWWWWW",
  "WWWWWGGGWWWWWWWWWWWWW",
  "GGGWWWWWWWWWWWWWWWGGG",
  "GGGGWWWWWWBWWWWWWGGGG",
  "GGGGGWWWWGGGWWWWGGGGG",
] as const;

const width = layout[0].length;
const height = layout.length;

function positionsFor(...kinds: string[]): Position[] {
  return layout.flatMap((row, y) => [...row].flatMap((kind, x) =>
    kinds.includes(kind) ? [{ x, y }] : []
  ));
}

const deploymentTiles = positionsFor("W").filter(({ x, y }) =>
  (x <= 4 && y >= 3 && y <= 9)
  || (x >= 5 && x <= 7 && y >= 5 && y <= 7)
);

export const oozeBoard = defineBoard({
  id: "ooze-board",
  name: "Mired Causeway",
  width,
  height,
  terrain: battleTerrain(width, height),
  walls: [],
  gaps: positionsFor("G", "B"),
  gapTheme: "murky-water",
  floorTheme: "planks",
  wallTheme: "stone",
  deploymentTiles,
  decorations: [
    { position: { x: 6, y: 0 }, kind: "drownedOozeSlick" },
    { position: { x: 3, y: 3 }, kind: "drownedPylon" },
    { position: { x: 7, y: 4 }, kind: "drownedBarnacles" },
    { position: { x: 5, y: 7 }, kind: "drownedOozeSlick" },
    { position: { x: 11, y: 3 }, kind: "drownedKelp" },
    { position: { x: 15, y: 9 }, kind: "drownedPylon" },
    { position: { x: 16, y: 11 }, kind: "drownedOozeSlick" },
  ],
});

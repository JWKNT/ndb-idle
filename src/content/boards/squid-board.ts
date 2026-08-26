import type { BoardDefinition, Position } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

const layout = [
  "GGGGGGGWWGGGGGGGGGWW",
  "GGGGGGGWKWGWWWWWGWKW",
  "GGGGGGGGWWWWWWWWWWWG",
  "GGGGGGGGGWWWBBBWWWGG",
  "WWWWWGGGWWWBBTBBWWWG",
  "WWWWWWWWWWBBSSSBBWWG",
  "WWWWWWWWWWBTSSSTBWWG",
  "WWWWWWWWWWBBSSSBBWWG",
  "WWWWWGGGWWWBBTBBWWWG",
  "GGGGGGGGGWWWBBBWWWGG",
  "GGGGGGGGWWWWWWWWWWWG",
  "GGGGGGGWKWGWWWWWGWKW",
  "GGGGGGGWWGGGGGGGGGWW",
] as const;

const width = layout[0].length;
const height = layout.length;

function positionsFor(...kinds: string[]): Position[] {
  return layout.flatMap((row, y) => [...row].flatMap((kind, x) =>
    kinds.includes(kind) ? [{ x, y }] : []
  ));
}

const deploymentTiles = positionsFor("W").filter(({ x, y }) =>
  (x <= 4 && y >= 4 && y <= 8)
  || (x >= 5 && x <= 7 && y >= 5 && y <= 7)
);

export const squidBoard: BoardDefinition = {
  id: "squid-board",
  name: "Drowned Squidworks",
  width,
  height,
  terrain: battleTerrain(width, height),
  walls: [],
  gaps: positionsFor("G", "B", "T", "S"),
  blueGaps: positionsFor("B", "T", "S"),
  gapTheme: "murky-water",
  floorTheme: "planks",
  wallTheme: "stone",
  deploymentTiles,
  decorations: [
    { position: { x: 7, y: 0 }, kind: "drownedBarnacles" },
    { position: { x: 8, y: 2 }, kind: "drownedKelp" },
    { position: { x: 5, y: 5 }, kind: "drownedCoral" },
    { position: { x: 8, y: 6 }, kind: "drownedMast" },
    { position: { x: 17, y: 5 }, kind: "drownedKelp" },
    { position: { x: 18, y: 2 }, kind: "drownedBarnacles" },
    { position: { x: 18, y: 10 }, kind: "drownedCoral" },
  ],
};

export const squidKnightPositions = positionsFor("K");
export const squidTentaclePositions = positionsFor("T");

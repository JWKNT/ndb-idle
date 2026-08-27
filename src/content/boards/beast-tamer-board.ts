import { defineBoard, type Position } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

const gaps: Position[] = Array.from({ length: 3 }, (_, row) =>
  Array.from({ length: 5 }, (_, column) => ({ x: column + 4, y: row + 3 })),
).flat();

export const beastTamerBoard = defineBoard({
  id: "beast-tamer-board",
  name: "Canopy Menagerie",
  width: 13,
  height: 9,
  terrain: battleTerrain(13, 9),
  walls: [
    { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
    { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 },
  ],
  gaps,
  floorTheme: "leaves",
  wallTheme: "tree-stump",
  decorations: [
    { position: { x: 1, y: 1 }, kind: "goblinRopeCoil" },
    { position: { x: 3, y: 4 }, kind: "goblinTarget" },
    { position: { x: 6, y: 2 }, kind: "goblinBanner" },
    { position: { x: 9, y: 4 }, kind: "goblinPatchedPlanks" },
    { position: { x: 11, y: 7 }, kind: "goblinRopeCoil" },
  ],
});

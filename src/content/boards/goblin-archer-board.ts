import { defineBoard } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

export const goblinArcherBoard = defineBoard({
  id: "goblin-archer-board",
  name: "Goblin Archerworks",
  width: 19,
  height: 11,
  terrain: battleTerrain(19, 11),
  walls: [
    { x: 4, y: 2 }, { x: 10, y: 2 },
    { x: 7, y: 3 },
    { x: 3, y: 4 },
    { x: 6, y: 5 }, { x: 10, y: 5 },
    { x: 4, y: 7 },
    { x: 8, y: 7 }, { x: 12, y: 8 },
    { x: 14, y: 4 }, { x: 15, y: 4 },
    { x: 14, y: 5 }, { x: 15, y: 5 },
    { x: 14, y: 6 }, { x: 15, y: 6 },
  ],
  gaps: [
    { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 },
    { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
    { x: 7, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 },
    { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 },
    { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
    { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 10, y: 10 }, { x: 11, y: 10 },
  ],
  deploymentExclusions: [
    { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
    { x: 4, y: 10 }, { x: 5, y: 10 }, { x: 6, y: 10 }, { x: 7, y: 10 },
  ],
  floorTheme: "leaves",
  wallTheme: "tree-stump",
  decorations: [
    { position: { x: 1, y: 3 }, kind: "goblinTarget" },
    { position: { x: 5, y: 4 }, kind: "goblinPatchedPlanks" },
    { position: { x: 8, y: 3 }, kind: "goblinRopeCoil" },
    { position: { x: 11, y: 6 }, kind: "goblinPatchedPlanks" },
    { position: { x: 13, y: 3 }, kind: "goblinBanner" },
    { position: { x: 17, y: 2 }, kind: "goblinTarget" },
    { position: { x: 16, y: 8 }, kind: "goblinRopeCoil" },
  ],
});

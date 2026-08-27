import { defineBoard } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

export const goblinBridgeBoard = defineBoard({
  id: "goblin-bridge-board",
  name: "Goblin Scaffold",
  width: 19,
  height: 11,
  terrain: battleTerrain(19, 11),
  walls: [
    { x: 14, y: 4 }, { x: 15, y: 4 },
    { x: 14, y: 5 }, { x: 15, y: 5 },
    { x: 14, y: 6 }, { x: 15, y: 6 },
  ],
  gaps: [
    { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 },
    { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 },
    { x: 6, y: 4 }, { x: 7, y: 4 },
    { x: 6, y: 5 }, { x: 7, y: 5 },
    { x: 6, y: 6 }, { x: 7, y: 6 },
    { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
    { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 },
  ],
  floorTheme: "leaves",
  wallTheme: "tree-stump",
  decorations: [
    { position: { x: 1, y: 1 }, kind: "goblinRopeCoil" },
    { position: { x: 5, y: 3 }, kind: "goblinPatchedPlanks" },
    { position: { x: 8, y: 5 }, kind: "goblinBanner" },
    { position: { x: 12, y: 3 }, kind: "goblinPatchedPlanks" },
    { position: { x: 16, y: 3 }, kind: "goblinTarget" },
    { position: { x: 13, y: 8 }, kind: "goblinRopeCoil" },
    { position: { x: 17, y: 9 }, kind: "goblinBanner" },
  ],
});

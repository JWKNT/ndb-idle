import { defineBoard, type Position } from "../../game/types";
import { battleTerrain } from "./battle-terrain";

export const graveyardBoard = defineBoard({
  id: "graveyard-board",
  name: "Mossy Graveyard",
  width: 10,
  height: 7,
  terrain: battleTerrain(10, 7),
  walls: [
    { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 },
    { x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 },
  ],
  floorTheme: "grass",
  wallTheme: "tombstone",
  decorations: [
    // Keep the royal marker beside the boss lane, with a clean outer column
    // beyond it so the enemy side no longer feels pinched against the frame.
    { position: { x: 8, y: 3 }, kind: "graveRoyalBanner" },
  ],
});

export const graveyardRandomSpawnPositions: Position[] = [
  { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 },
  { x: 1, y: 4 }, { x: 3, y: 4 }, { x: 5, y: 4 },
];

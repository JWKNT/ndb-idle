import { graveyardBoard, graveyardRandomSpawnPositions } from "./graveyard-board";
import { goblinBridgeBoard } from "./goblin-bridge-board";
import { goblinArcherBoard } from "./goblin-archer-board";
import { squidBoard } from "./squid-board";
import { beastTamerBoard } from "./beast-tamer-board";
import { oozeBoard } from "./ooze-board";
import { rustmireBoard } from "./rustmire-board";

export const boards = {
  [graveyardBoard.id]: graveyardBoard,
  [goblinBridgeBoard.id]: goblinBridgeBoard,
  [goblinArcherBoard.id]: goblinArcherBoard,
  [squidBoard.id]: squidBoard,
  [beastTamerBoard.id]: beastTamerBoard,
  [oozeBoard.id]: oozeBoard,
  [rustmireBoard.id]: rustmireBoard,
};

export { beastTamerBoard, graveyardBoard, graveyardRandomSpawnPositions, goblinBridgeBoard, goblinArcherBoard, oozeBoard, rustmireBoard, squidBoard };

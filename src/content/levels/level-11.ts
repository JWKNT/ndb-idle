import { defineLevel } from "../../game/types";
import { archipelagoBoard } from "../boards/archipelago-board";
import { coconutBailiff } from "../enemies/coconut-bailiff";
import { reefAuditor } from "../enemies/reef-auditor";
import { vacationEmperor } from "../enemies/vacation-emperor";

export const level11 = defineLevel({
  number: 11,
  name: "Vacation Emperor",
  description: "The water is impassable. No current party member can reach the enemy islands.",
  reward: "0",
  board: archipelagoBoard,
  playerPositions: {
    knight: { x: 3, y: 11 },
    worm: { x: 2, y: 10 },
    miner: { x: 2, y: 12 },
  },
  enemies: [
    { instanceId: "enemy-coconut-bailiff-north", unit: coconutBailiff, position: { x: 15, y: 5 } },
    { instanceId: "enemy-coconut-bailiff-south", unit: coconutBailiff, position: { x: 15, y: 17 } },
    { instanceId: "enemy-coconut-bailiff-center", unit: coconutBailiff, position: { x: 25, y: 11 } },
    { instanceId: "enemy-reef-auditor-center-north", unit: reefAuditor, position: { x: 23, y: 9 } },
    { instanceId: "enemy-reef-auditor-center-south", unit: reefAuditor, position: { x: 27, y: 13 } },
    { instanceId: "enemy-reef-auditor-north", unit: reefAuditor, position: { x: 34, y: 3 } },
    { instanceId: "enemy-reef-auditor-south", unit: reefAuditor, position: { x: 34, y: 19 } },
    { instanceId: "battle-boss-vacation-emperor", unit: vacationEmperor, position: { x: 36, y: 11 } },
  ],
});

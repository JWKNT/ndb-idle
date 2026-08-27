import { knight } from "./knight";
import { miner } from "./miner";
import { worm } from "./worm";
import type { PlayerId, UnitDefinition } from "../../game/types";

export const players = {
  [knight.id]: knight,
  [worm.id]: worm,
  [miner.id]: miner,
} satisfies Record<PlayerId, UnitDefinition>;

export function getPlayer(id: PlayerId) {
  return players[id];
}

export { knight, miner, worm };

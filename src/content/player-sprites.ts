import type { PlayerId } from "@/game/types";
import type { SpriteName } from "./sprites";

/** A new party member must explicitly choose its board sprite. */
export const PLAYER_SPRITES: Record<PlayerId, SpriteName> = {
  knight: "knight",
  worm: "worm",
  miner: "miner",
};

export function playerSprite(id: PlayerId): SpriteName {
  return PLAYER_SPRITES[id];
}

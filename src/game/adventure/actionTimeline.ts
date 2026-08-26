import type { Stats } from "@/game/types";
import { findTiles } from "./combatRules";
import { currentAdventureRoom } from "./creation";
import { cloneAdventureForRoom } from "./state";
import {
  adventurePlayerActorId,
  completeActorTurn,
} from "./turnTimeline";
import type { AdventureState, DungeonRoom } from "./types";

function ageClayBoulders(room: DungeonRoom): void {
  for (const position of findTiles(room, "clayBoulder")) {
    const tile = room.tiles[position.y][position.x];
    const remaining = (tile.boulderTurnsRemaining ?? 10) - 1;
    room.tiles[position.y][position.x] = remaining <= 0
      ? { kind: "floor" }
      : { ...tile, boulderTurnsRemaining: remaining };
  }
}
export function finishAdventureAction(
  state: AdventureState,
  actorId: string,
  playerStats: Stats,
): AdventureState {
  state = cloneAdventureForRoom(state, state.currentRoomKey);
  if (actorId === adventurePlayerActorId(state.playerId) && (state.weaponCooldownRemaining ?? 0) > 0) {
    state.weaponCooldownRemaining = Math.max(0, (state.weaponCooldownRemaining ?? 0) - 1);
  }
  const actionRoom = currentAdventureRoom(state);
  actionRoom.hazardTurn = Math.max(0, Math.floor(actionRoom.hazardTurn ?? 0)) + 1;
  if (findTiles(currentAdventureRoom(state), "clayBoulder").length > 0) {
    ageClayBoulders(currentAdventureRoom(state));
  }
  return completeActorTurn(state, actorId, playerStats);
}

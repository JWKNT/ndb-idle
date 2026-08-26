import {
  createForgeRoomTiles,
  decorateForgeNormalRoom,
} from "@/content/adventure-rooms/forge-room";
import { centeredExitPosition } from "./geometry";
import type { AdventureState, DungeonRoom } from "./types";

/**
 * Retires the one-time Blueprint objective from a cached Forge expedition.
 * This matters when the party returns to the same Forge map after collecting
 * the plans: the cached map predates the key-item reward, but must never offer
 * a second copy or keep displaying the 11x13 reliquary.
 */
export function retireForgeBlueprintObjective(state: AdventureState): AdventureState {
  if (state.dungeonTheme !== "forge") return state;

  let replacedCurrentRoom = false;
  const rooms = Object.fromEntries(Object.entries(state.rooms).map(([key, room]) => {
    if (room.kind !== "forgeBlueprint") {
      return [key, room.forgeBlueprintDirection
        ? { ...room, forgeBlueprintDirection: undefined }
        : room];
    }
    if (key === state.currentRoomKey) replacedCurrentRoom = true;
    return [key, retiredBlueprintRoom(room)];
  }));

  const currentRoom = rooms[state.currentRoomKey];
  const currentTile = currentRoom?.tiles[state.playerPosition.y]?.[state.playerPosition.x];
  const playerPosition = replacedCurrentRoom && currentTile?.kind !== "floor" && currentTile?.kind !== "exit"
    ? { x: 5, y: 5 }
    : { ...state.playerPosition };

  return {
    ...state,
    rooms,
    playerPosition,
    forgeBlueprintTarget: null,
    forgeBlueprintObjectiveEnabled: false,
  };
}

function retiredBlueprintRoom(room: DungeonRoom): DungeonRoom {
  const tiles = createForgeRoomTiles();
  decorateForgeNormalRoom(tiles, room.number);
  const exits = room.exits.map((exit) => ({
    direction: exit.direction,
    position: centeredExitPosition(tiles.length, exit.direction),
  }));
  for (const exit of exits) {
    tiles[exit.position.y][exit.position.x] = {
      kind: "exit",
      exitDirection: exit.direction,
    };
  }
  return {
    ...room,
    width: tiles[0].length,
    height: tiles.length,
    tiles,
    exits,
    kind: "forgeNormal",
    forgeBlueprintDirection: undefined,
    forgeRecipeId: undefined,
  };
}

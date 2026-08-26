import type { AdventureState, DungeonRoom } from "./types";

export function cloneDungeonRoom(room: DungeonRoom): DungeonRoom {
  return {
    ...room,
    position: { ...room.position },
    exits: room.exits.map((exit) => ({ ...exit, position: { ...exit.position } })),
    tiles: room.tiles.map((row) => row.map((tile) => ({ ...tile }))),
    regenUsedBy: [...room.regenUsedBy],
    diceValues: room.diceValues ? [...room.diceValues] as [number, number] : undefined,
  };
}

export function cloneAdventureForRoom(state: AdventureState, key: string): AdventureState {
  const room = state.rooms[key];
  return {
    ...state,
    rooms: {
      ...state.rooms,
      [key]: cloneDungeonRoom(room),
    },
    playerPosition: { ...state.playerPosition },
    log: [...state.log],
    readyAt: { ...state.readyAt },
  };
}

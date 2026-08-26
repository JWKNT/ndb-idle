import type { DungeonRoom } from "@/game/adventure/types";
import type { Position } from "@/game/types";

export const TOWER_EXTERIOR_VIEW_SIZE = 11;

export interface AdventureViewport {
  minimumX: number;
  minimumY: number;
  width: number;
  height: number;
}

export function adventureViewport(
  room: DungeonRoom,
  focus: Position,
): AdventureViewport {
  if (room.kind !== "towerExterior") {
    return { minimumX: 0, minimumY: 0, width: room.width, height: room.height };
  }

  const width = Math.min(TOWER_EXTERIOR_VIEW_SIZE, room.width);
  const height = Math.min(TOWER_EXTERIOR_VIEW_SIZE, room.height);
  return {
    minimumX: clamp(focus.x - Math.floor(width / 2), 0, room.width - width),
    minimumY: clamp(focus.y - Math.floor(height / 2), 0, room.height - height),
    width,
    height,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

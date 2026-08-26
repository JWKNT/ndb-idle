import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position } from "../../game/types";

export interface RescueRoomLayout {
  tiles: AdventureTile[][];
  cagePosition: Position;
  spiderPositions: Position[];
}

export function createRescueRoomTiles(entryDirection: ExitDirection): RescueRoomLayout {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
    })),
  );
  const cagePosition = entryDirection === "west"
    ? { x: 6, y: 4 }
    : entryDirection === "east"
      ? { x: 2, y: 4 }
      : entryDirection === "north"
        ? { x: 4, y: 6 }
        : { x: 4, y: 2 };
  const towardEntrance = entryDirection === "west"
    ? { x: -1, y: 0 }
    : entryDirection === "east"
      ? { x: 1, y: 0 }
      : entryDirection === "north"
        ? { x: 0, y: -1 }
        : { x: 0, y: 1 };
  const lateral = { x: -towardEntrance.y, y: towardEntrance.x };
  const spiderOffsets = [
    { forward: 1, lateral: -2 },
    { forward: 1, lateral: 0 },
    { forward: 1, lateral: 2 },
    { forward: 2, lateral: -1 },
    { forward: 2, lateral: 1 },
    { forward: 3, lateral: -2 },
    { forward: 3, lateral: 2 },
  ];
  const spiderPositions = spiderOffsets.map((offset) => ({
    x: cagePosition.x + towardEntrance.x * offset.forward + lateral.x * offset.lateral,
    y: cagePosition.y + towardEntrance.y * offset.forward + lateral.y * offset.lateral,
  }));
  for (const position of [
    { x: 6, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 6 },
    { x: 6, y: 7 }, { x: 2, y: 1 }, { x: 2, y: 7 },
  ].map(rotateFromWestRoom)) {
    tiles[position.y][position.x].decoration = "cobweb";
  }
  tiles[cagePosition.y][cagePosition.x] = { kind: "cage" };
  spiderPositions.forEach((position, index) => {
    tiles[position.y][position.x] = {
      kind: "enemy",
      enemyId: `quest-spider-${index + 1}`,
      enemyKind: "spider",
    };
  });
  return { tiles, cagePosition, spiderPositions };

  function rotateFromWestRoom(position: Position): Position {
    const dx = position.x - 4;
    const dy = position.y - 4;
    if (entryDirection === "west") return position;
    if (entryDirection === "east") return { x: 4 - dx, y: 4 - dy };
    if (entryDirection === "north") return { x: 4 - dy, y: 4 + dx };
    return { x: 4 + dy, y: 4 - dx };
  }
}

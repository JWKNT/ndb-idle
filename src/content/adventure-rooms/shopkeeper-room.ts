import type { AdventureTile, ExitDirection } from "@/game/adventure/types";
import type { Position } from "../../game/types";

export interface ShopkeeperRoomLayout {
  tiles: AdventureTile[][];
  shopkeeperPosition: Position;
  skeletonPositions: Position[];
}

export function createShopkeeperRoomTiles(entryDirection: ExitDirection): ShopkeeperRoomLayout {
  const tiles = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 9 }, (_, x): AdventureTile => ({
      kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
    })),
  );
  const rotate = (position: Position): Position => rotateFromWest(position, entryDirection);
  const shopkeeperPosition = rotate({ x: 6, y: 4 });
  const skeletonPositions = [
    rotate({ x: 4, y: 2 }),
    rotate({ x: 4, y: 4 }),
    rotate({ x: 4, y: 6 }),
  ];
  for (const position of [rotate({ x: 8, y: 2 }), rotate({ x: 8, y: 6 })]) {
    tiles[position.y][position.x].decoration = "shopShelf";
  }
  for (const position of [rotate({ x: 5, y: 3 }), rotate({ x: 5, y: 4 }), rotate({ x: 5, y: 5 })]) {
    tiles[position.y][position.x].decoration = "shopRug";
  }
  tiles[shopkeeperPosition.y][shopkeeperPosition.x] = { kind: "shopkeeperCage" };
  skeletonPositions.forEach((position, index) => {
    tiles[position.y][position.x] = {
      kind: "enemy",
      enemyId: `shopkeeper-skeleton-${index + 1}`,
      enemyKind: "skeleton",
    };
  });
  return { tiles, shopkeeperPosition, skeletonPositions };
}

function rotateFromWest(position: Position, entryDirection: ExitDirection): Position {
  const dx = position.x - 4;
  const dy = position.y - 4;
  if (entryDirection === "west") return position;
  if (entryDirection === "east") return { x: 4 - dx, y: 4 - dy };
  if (entryDirection === "north") return { x: 4 + dy, y: 4 - dx };
  return { x: 4 - dy, y: 4 + dx };
}

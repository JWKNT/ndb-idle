import type { AdventureTile } from "@/game/adventure/types";

export function createLotteryRoomTiles(size = 9): AdventureTile[][] {
  const center = Math.floor(size / 2);
  const wheelStart = center - 1;
  const wheelEnd = center + 1;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): AdventureTile => {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return { kind: "wall" };
      if (x >= wheelStart && x <= wheelEnd && y >= wheelStart && y <= wheelEnd) {
        return {
          kind: "lotteryWheel",
          lotteryPartX: x - wheelStart,
          lotteryPartY: y - wheelStart,
        };
      }
      return { kind: "floor" };
    }),
  );
}

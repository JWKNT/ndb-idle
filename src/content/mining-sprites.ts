import type { SpriteName } from "./sprites";

interface MiningVisualBand {
  firstRoom: number;
  floor: SpriteName;
  wall: SpriteName;
  rock: SpriteName;
}

const MINING_VISUAL_BANDS: readonly MiningVisualBand[] = [
  { firstRoom: 1, floor: "miningFloor", wall: "miningWall", rock: "miningRock" },
  { firstRoom: 3, floor: "miningFloor2", wall: "miningWall2", rock: "miningRock2" },
  { firstRoom: 5, floor: "miningFloor3", wall: "miningWall3", rock: "miningRock3" },
  { firstRoom: 7, floor: "miningFloor4", wall: "miningWall4", rock: "miningRock4" },
  { firstRoom: 9, floor: "miningFloor5", wall: "miningWall5", rock: "miningRock5" },
];

export function miningVisualBand(roomNumber: number): number {
  const safeRoom = Math.max(1, Math.min(10, Math.floor(roomNumber)));
  return Math.min(5, Math.floor((safeRoom - 1) / 2) + 1);
}

export function miningSpritesForRoom(roomNumber: number): Omit<MiningVisualBand, "firstRoom"> {
  const band = MINING_VISUAL_BANDS[miningVisualBand(roomNumber) - 1] ?? MINING_VISUAL_BANDS[0];
  return { floor: band.floor, wall: band.wall, rock: band.rock };
}

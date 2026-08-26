import Decimal from "break_eternity.js";
import type { Stats } from "@/game/types";
import type { MiningRock, MiningRockContent, MiningState, MiningTile } from "./types";

export const MINING_ROOM_SIZE = 11;
export const MAX_MINING_ROOM = 10;
const INTERIOR_MIN = 1;
const INTERIOR_MAX = MINING_ROOM_SIZE - 2;

export type MiningRandom = () => number;

export function createMiningRoom(
  memberId: MiningState["memberId"],
  roomNumber: number,
  stats: Stats,
  random: MiningRandom = Math.random,
  entrancePosition?: { x: number; y: number },
): MiningState {
  const safeRoom = Math.max(1, Math.min(MAX_MINING_ROOM, Math.floor(roomNumber)));
  const entrance = validMiningEntrance(entrancePosition)
    ? { ...entrancePosition }
    : { x: Math.floor(MINING_ROOM_SIZE / 2), y: MINING_ROOM_SIZE - 1 };
  const doorCandidates = [
    ...Array.from({ length: INTERIOR_MAX }, (_, index) => ({
      door: { x: index + 1, y: 0 },
      front: { x: index + 1, y: 1 },
    })),
    ...Array.from({ length: INTERIOR_MAX }, (_, index) => ({
      door: { x: 0, y: index + 1 },
      front: { x: 1, y: index + 1 },
    })),
    ...Array.from({ length: INTERIOR_MAX }, (_, index) => ({
      door: { x: MINING_ROOM_SIZE - 1, y: index + 1 },
      front: { x: MINING_ROOM_SIZE - 2, y: index + 1 },
    })),
    ...Array.from({ length: INTERIOR_MAX }, (_, index) => index + 1)
      .map((x) => ({
        door: { x, y: MINING_ROOM_SIZE - 1 },
        front: { x, y: MINING_ROOM_SIZE - 2 },
      })),
  ].filter(({ door }) => door.x !== entrance.x || door.y !== entrance.y);
  const doorLayout = doorCandidates[randomIndex(doorCandidates.length, random)] ?? doorCandidates[0];
  const interiorPositions = Array.from({ length: INTERIOR_MAX }, (_, yIndex) =>
    Array.from({ length: INTERIOR_MAX }, (_, xIndex) => ({
      x: xIndex + INTERIOR_MIN,
      y: yIndex + INTERIOR_MIN,
    })),
  ).flat();
  const keyPosition = interiorPositions[randomIndex(interiorPositions.length, random)] ?? interiorPositions[0];
  const tiles: MiningTile[][] = Array.from({ length: MINING_ROOM_SIZE }, (_, y) =>
    Array.from({ length: MINING_ROOM_SIZE }, (_, x): MiningTile => ({
      kind: x === 0 || y === 0 || x === MINING_ROOM_SIZE - 1 || y === MINING_ROOM_SIZE - 1
        ? "wall"
        : "rock",
    })),
  );
  tiles[entrance.y][entrance.x] = { kind: "entrance" };
  const rocks: Record<string, MiningRock> = {};
  for (const position of interiorPositions) {
    const id = `mining-rock-${safeRoom}-${position.x}-${position.y}`;
    const content = position.x === keyPosition.x && position.y === keyPosition.y
      ? "key"
      : rollRockContent(stats.luck, safeRoom, random);
    const maxDurability = miningRockDurability(safeRoom).mul(0.88 + random() * 0.24);
    rocks[id] = {
      id,
      position,
      content,
      durability: maxDurability,
      maxDurability,
      goldAmount: content === "gold" ? rollMiningGold(stats.luck, safeRoom, random) : undefined,
      hidesDoor: position.x === doorLayout.front.x && position.y === doorLayout.front.y,
    };
    tiles[position.y][position.x] = { kind: "rock", rockId: id };
  }
  return {
    memberId,
    roomNumber: safeRoom,
    width: MINING_ROOM_SIZE,
    height: MINING_ROOM_SIZE,
    tiles,
    rocks,
    playerPosition: entrance,
    playerFacing: "right",
    doorPosition: doorLayout.door,
    doorRevealed: false,
    hasKey: false,
    activeRockId: null,
    movementProgress: new Decimal(0),
    staminaRockProgress: 0,
    enemy: null,
    combatProgress: new Decimal(0),
    status: "running",
    log: [],
  };
}

export function miningRockDurability(roomNumber: number): Decimal {
  return new Decimal(18).mul(new Decimal(1.28).pow(Math.max(0, roomNumber - 1)));
}

export function miningGoldChance(luck: Decimal): number {
  const safeLuck = Math.min(1_000_000, Math.max(0, luck.toNumber()));
  return Math.min(0.4, 0.09 + (safeLuck / (safeLuck + 40)) * 0.31);
}

export function miningEnemyChance(roomNumber: number): number {
  const safeRoom = Math.max(1, Math.min(MAX_MINING_ROOM, Math.floor(roomNumber)));
  return safeRoom % 2 === 0 ? 0.055 : 0.035;
}

export function rollMiningGold(
  luck: Decimal,
  roomNumber: number,
  random: MiningRandom = Math.random,
): Decimal {
  const luckMultiplier = Decimal.add(1, Decimal.max(0, luck).mul(0.06));
  const depthValue = new Decimal(30 + roomNumber * 10)
    .mul(new Decimal(1.42).pow(Math.max(0, roomNumber - 1)));
  return depthValue.mul(luckMultiplier).mul(0.8 + random() * 0.4).ceil();
}

function rollRockContent(
  luck: Decimal,
  roomNumber: number,
  random: MiningRandom,
): MiningRockContent {
  const roll = random();
  const enemyChance = miningEnemyChance(roomNumber);
  if (roll < enemyChance) return "enemy";
  if (roll < enemyChance + miningGoldChance(luck)) return "gold";
  return "empty";
}

function randomIndex(length: number, random: MiningRandom): number {
  return Math.min(length - 1, Math.floor(Math.max(0, Math.min(0.999999, random())) * length));
}

function validMiningEntrance(position?: { x: number; y: number }): position is { x: number; y: number } {
  if (!position) return false;
  const onVerticalEdge = (position.x === 0 || position.x === MINING_ROOM_SIZE - 1)
    && position.y > 0
    && position.y < MINING_ROOM_SIZE - 1;
  const onHorizontalEdge = (position.y === 0 || position.y === MINING_ROOM_SIZE - 1)
    && position.x > 0
    && position.x < MINING_ROOM_SIZE - 1;
  return Number.isInteger(position.x) && Number.isInteger(position.y) && (onVerticalEdge || onHorizontalEdge);
}

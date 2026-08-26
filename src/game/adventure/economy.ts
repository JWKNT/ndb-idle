import Decimal from "break_eternity.js";
import type { DungeonTheme, RandomSource } from "./types";

const TREASURE_ROOM_CHANCE = 0.025;
const TREASURE_ROOM_LUCK_BONUS = 0.0015;
const MAX_TREASURE_ROOM_CHANCE = 0.15;

export function generationChances(
  luck: Decimal,
  ring = 1,
  dungeonTheme: DungeonTheme = "earth",
) {
  const luckValue = boundedLuck(luck);
  if (dungeonTheme === "water") {
    return {
      gold: 0.085,
      enemy: 0.17,
      trap: Math.max(0.015, 0.04 - luckValue * 0.002),
    };
  }
  const safeRing = Math.max(0, Math.floor(ring));
  if (safeRing >= 4) {
    return {
      gold: Math.min(0.18, 0.09 + (safeRing - 4) * 0.006),
      enemy: Math.min(0.08, 0.04 + (safeRing - 4) * 0.008),
      trap: 0,
    };
  }
  return {
    gold: Math.min(0.22, 0.075 + safeRing * 0.004),
    enemy: Math.min(0.28, 0.035 + safeRing * 0.025),
    trap: Math.min(
      0.3,
      Math.max(0.012, 0.012 + safeRing * 0.024 - luckValue * 0.0025),
    ),
  };
}

export function hazardAvoidChance(luck: Decimal, ring = 1): number {
  const luckValue = boundedLuck(luck);
  const baseChance = Math.min(0.65, luckValue / (luckValue + 30));
  const depthPenalty = 1 + Math.max(0, Math.floor(ring) - 1) * 0.35;
  return baseChance / depthPenalty;
}

export function treasureRoomChance(luck: Decimal): number {
  return Math.min(
    MAX_TREASURE_ROOM_CHANCE,
    TREASURE_ROOM_CHANCE + boundedLuck(luck) * TREASURE_ROOM_LUCK_BONUS,
  );
}

export function rollGold(
  luck: Decimal,
  ring: number,
  random: RandomSource = Math.random,
): Decimal {
  const base = 2 + Math.floor(random() * 4);
  const depth = Math.max(0, Math.floor(ring));
  const depthMultiplier = depth === 0
    ? new Decimal(1)
    : new Decimal(1.2).mul(new Decimal(1.65).pow(depth - 1));
  return new Decimal(base)
    .mul(new Decimal(1).add(luck.mul(0.12)))
    .mul(depthMultiplier)
    .floor()
    .max(1);
}

export function waterPortalSpawnChance(ringTwoRoomsVisited: number): number {
  const visits = Math.max(1, Math.floor(ringTwoRoomsVisited));
  if (visits >= 15) return 1;
  if (visits < 10) return 0.1;
  return Math.min(1, 0.35 + (visits - 10) * 0.16);
}

export function boundedLuck(luck: Decimal): number {
  return Math.max(0, Math.min(100, luck.toNumber()));
}

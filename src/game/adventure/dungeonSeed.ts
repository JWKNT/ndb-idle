import type { Position } from "@/game/types";
import type { DungeonTheme, RandomSource } from "./types";

const UINT32_RANGE = 0x1_0000_0000;

/**
 * Gives an expedition a stable world identity without trying to allocate its
 * effectively unbounded room graph up front.
 */
export function createDungeonSeed(random: RandomSource = Math.random): number {
  return Math.floor(Math.min(0.999999999999, Math.max(0, random())) * UINT32_RANGE) >>> 0;
}

/**
 * A room's random stream depends only on the expedition and coordinate. That
 * makes the room conceptually pre-seeded even though its tiles and encounters
 * remain dormant until somebody crosses its door.
 */
export function createRoomRandom(
  dungeonSeed: number,
  position: Position,
  theme: DungeonTheme,
): RandomSource {
  let state = coordinateHash(dungeonSeed, position, theme);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function coordinateHash(seed: number, position: Position, theme: DungeonTheme): number {
  let hash = (seed ^ 0x811c9dc5) >>> 0;
  for (const value of [position.x, position.y]) {
    hash ^= value | 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  for (let index = 0; index < theme.length; index += 1) {
    hash ^= theme.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 0x9e3779b9;
}

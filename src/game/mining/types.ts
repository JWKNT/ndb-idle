import type Decimal from "break_eternity.js";
import type { HorizontalFacing, PlayerId, Position } from "@/game/types";

export const MINING_TILE_KINDS = ["wall", "rock", "floor", "entrance", "door"] as const;
export type MiningTileKind = (typeof MINING_TILE_KINDS)[number];
export const MINING_ROCK_CONTENTS = ["empty", "gold", "enemy", "key"] as const;
export type MiningRockContent = (typeof MINING_ROCK_CONTENTS)[number];
export type MiningStatus = "running" | "dead" | "exhausted";

export const MINING_TILE_CONTRACTS: Record<MiningTileKind, {
  movement: "blocked" | "walkable";
  presentation: "terrain" | "rock" | "door";
}> = {
  wall: { movement: "blocked", presentation: "terrain" },
  rock: { movement: "blocked", presentation: "rock" },
  floor: { movement: "walkable", presentation: "terrain" },
  entrance: { movement: "walkable", presentation: "terrain" },
  door: { movement: "walkable", presentation: "door" },
};
export const MINING_ENEMY_DEFINITION_IDS = [
  "cave-bat",
  "glow-scorpion",
  "ore-beetle",
  "gloom-wisp",
  "basalt-wyrm",
] as const;
export type MiningEnemyDefinitionId = (typeof MINING_ENEMY_DEFINITION_IDS)[number];
export const MINING_ENEMY_SPRITES = [
  "caveBat",
  "glowScorpion",
  "oreBeetle",
  "gloomWisp",
  "basaltWyrm",
] as const;
export type MiningEnemySprite = (typeof MINING_ENEMY_SPRITES)[number];

export interface MiningTile {
  kind: MiningTileKind;
  rockId?: string;
}

export interface MiningRock {
  id: string;
  position: Position;
  content: MiningRockContent;
  durability: Decimal;
  maxDurability: Decimal;
  goldAmount?: Decimal;
  hidesDoor: boolean;
}

export interface MiningEnemy {
  id: string;
  definitionId: MiningEnemyDefinitionId;
  sprite: MiningEnemySprite;
  name: string;
  position: Position;
  hp: Decimal;
  maxHp: Decimal;
  attack: Decimal;
  defense: Decimal;
  facing?: HorizontalFacing;
}

export interface MiningState {
  memberId: PlayerId;
  roomNumber: number;
  width: number;
  height: number;
  tiles: MiningTile[][];
  rocks: Record<string, MiningRock>;
  playerPosition: Position;
  playerFacing?: HorizontalFacing;
  doorPosition: Position;
  doorRevealed: boolean;
  hasKey: boolean;
  activeRockId: string | null;
  movementProgress: Decimal;
  staminaRockProgress: number;
  enemy: MiningEnemy | null;
  combatProgress: Decimal;
  status: MiningStatus;
  log: string[];
}

export interface MiningResult {
  state: MiningState;
  hp: Decimal;
  stamina: Decimal;
  goldGained: Decimal;
  defeatedEnemyId?: string;
  died: boolean;
  exhausted: boolean;
  roomAdvanced?: boolean;
  depthLimitReached?: boolean;
}

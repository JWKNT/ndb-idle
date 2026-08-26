import type Decimal from "break_eternity.js";
import type { HorizontalFacing, PlayerId, Position } from "@/game/types";

export type MiningTileKind = "wall" | "rock" | "floor" | "entrance" | "door";
export type MiningRockContent = "empty" | "gold" | "enemy" | "key";
export type MiningStatus = "running" | "dead" | "exhausted";
export type MiningEnemyDefinitionId = "cave-bat" | "glow-scorpion" | "ore-beetle" | "gloom-wisp" | "basalt-wyrm";
export type MiningEnemySprite = "caveBat" | "glowScorpion" | "oreBeetle" | "gloomWisp" | "basaltWyrm";

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

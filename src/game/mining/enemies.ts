import Decimal from "break_eternity.js";
import { basaltWyrm } from "@/content/enemies/basalt-wyrm";
import { caveBat } from "@/content/enemies/cave-bat";
import { glowScorpion } from "@/content/enemies/glow-scorpion";
import { gloomWisp } from "@/content/enemies/gloom-wisp";
import { oreBeetle } from "@/content/enemies/ore-beetle";
import type { UnitDefinition, Position } from "@/game/types";
import type { MiningEnemy, MiningEnemyDefinitionId, MiningEnemySprite } from "./types";

interface MiningEnemyBand {
  definitionId: MiningEnemyDefinitionId;
  firstRoom: number;
  unit: UnitDefinition;
  sprite: MiningEnemySprite;
}

export const MINING_ENEMY_BANDS: readonly MiningEnemyBand[] = [
  { definitionId: "cave-bat", firstRoom: 1, unit: caveBat, sprite: "caveBat" },
  { definitionId: "glow-scorpion", firstRoom: 3, unit: glowScorpion, sprite: "glowScorpion" },
  { definitionId: "ore-beetle", firstRoom: 5, unit: oreBeetle, sprite: "oreBeetle" },
  { definitionId: "gloom-wisp", firstRoom: 7, unit: gloomWisp, sprite: "gloomWisp" },
  { definitionId: "basalt-wyrm", firstRoom: 9, unit: basaltWyrm, sprite: "basaltWyrm" },
];

export function miningEnemyBand(roomNumber: number): MiningEnemyBand {
  const safeRoom = Math.max(1, Math.min(10, Math.floor(roomNumber)));
  return [...MINING_ENEMY_BANDS].reverse().find((band) => safeRoom >= band.firstRoom)
    ?? MINING_ENEMY_BANDS[0];
}

export function createMiningEnemy(roomNumber: number, position: Position): MiningEnemy {
  const band = miningEnemyBand(roomNumber);
  const crowdedRoom = Math.max(1, Math.floor(roomNumber)) % 2 === 0;
  const hpScale = crowdedRoom ? new Decimal(1.14) : new Decimal(1);
  const attackScale = crowdedRoom ? new Decimal(1.1) : new Decimal(1);
  const defenseScale = crowdedRoom ? new Decimal(1.08) : new Decimal(1);
  const maxHp = band.unit.stats.hp.mul(hpScale).ceil();
  return {
    id: `mining-${band.definitionId}-${roomNumber}-${position.x}-${position.y}`,
    definitionId: band.definitionId,
    sprite: band.sprite,
    name: band.unit.name,
    position: { ...position },
    hp: maxHp,
    maxHp,
    attack: band.unit.stats.attack.mul(attackScale).ceil(),
    defense: band.unit.stats.defense.mul(defenseScale).ceil(),
    facing: "left",
  };
}

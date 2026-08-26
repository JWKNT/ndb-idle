import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const rustmireEngine: UnitDefinition = {
  id: "rustmire-engine",
  name: "Rusttide Colossus",
  attackRange: 3,
  attackType: "special",
  attackName: "Piston Slosh",
  attackPattern: "any",
  isRaidBoss: true,
  footprint: 3,
  canMove: true,
  invulnerableWhileEnemyId: "brine-dynamo",
  oozeBelch: {
    cooldownTurns: 4,
    minTiles: 2,
    maxTiles: 3,
    radius: 4,
    poolDurationActions: 24,
    corrosionTurns: 3,
    damagePerTurn: new Decimal(36),
  },
  stats: {
    hp: new Decimal(8_400),
    stamina: new Decimal(1),
    attack: new Decimal(54),
    defense: new Decimal(120),
    spAttack: new Decimal(69),
    spDefense: new Decimal(125),
    speed: new Decimal(48),
    luck: new Decimal(0),
  },
};

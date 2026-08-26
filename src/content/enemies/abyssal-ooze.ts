import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const abyssalOoze: UnitDefinition = {
  id: "abyssal-ooze",
  name: "Abyssal Ooze",
  attackRange: 5,
  attackType: "special",
  attackName: "Mire Surge",
  attackPattern: "any",
  isRaidBoss: true,
  footprint: 3,
  canMove: true,
  weakeningGuardDefinitionId: "ooze-guardian",
  weakeningPerGuardDefeat: 0.14,
  weakeningGuardCount: 3,
  stats: {
    hp: new Decimal(3200),
    stamina: new Decimal(1),
    attack: new Decimal(58),
    defense: new Decimal(88),
    spAttack: new Decimal(72),
    spDefense: new Decimal(92),
    speed: new Decimal(26),
    luck: new Decimal(0),
  },
};

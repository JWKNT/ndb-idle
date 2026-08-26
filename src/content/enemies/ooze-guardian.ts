import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const oozeGuardian: UnitDefinition = {
  id: "ooze-guardian",
  name: "Ooze Guardian",
  attackRange: 2,
  attackType: "special",
  attackName: "Sludge Wave",
  attackPattern: "any",
  footprint: 2,
  stats: {
    hp: new Decimal(1_200),
    stamina: new Decimal(40),
    attack: new Decimal(48),
    defense: new Decimal(60),
    spAttack: new Decimal(55),
    spDefense: new Decimal(65),
    speed: new Decimal(26),
    luck: new Decimal(0),
  },
};

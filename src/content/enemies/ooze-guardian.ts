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
    hp: new Decimal(950),
    stamina: new Decimal(40),
    attack: new Decimal(42),
    defense: new Decimal(52),
    spAttack: new Decimal(48),
    spDefense: new Decimal(56),
    speed: new Decimal(24),
    luck: new Decimal(0),
  },
};

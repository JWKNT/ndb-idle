import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const octopus: UnitDefinition = {
  id: "octopus",
  name: "Octopus",
  attackRange: 2,
  attackType: "special",
  attackName: "Water Bolt",
  stats: {
    hp: new Decimal(70),
    stamina: new Decimal(22),
    attack: new Decimal(8),
    defense: new Decimal(7),
    spAttack: new Decimal(19),
    spDefense: new Decimal(10),
    speed: new Decimal(20),
    luck: new Decimal(0),
  },
};

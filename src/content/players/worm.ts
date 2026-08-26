import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const worm: UnitDefinition = {
  id: "worm",
  name: "Worm",
  attackRange: 4,
  attackType: "special",
  attackPattern: "eight-way",
  attackName: "Acid Shot",
  stats: {
    hp: new Decimal(24),
    stamina: new Decimal(24),
    attack: new Decimal(1),
    defense: new Decimal(1),
    spAttack: new Decimal(13),
    spDefense: new Decimal(9),
    speed: new Decimal(6),
    luck: new Decimal(3),
  },
};

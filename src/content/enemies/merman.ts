import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const merman = defineUnit({
  id: "merman",
  name: "Merman",
  attackRange: 99,
  attackType: "physical",
  attackName: "Trident Throw",
  stats: {
    hp: new Decimal(190),
    stamina: new Decimal(42),
    attack: new Decimal(32),
    defense: new Decimal(16),
    spAttack: new Decimal(8),
    spDefense: new Decimal(16),
    speed: new Decimal(22),
    luck: new Decimal(0),
  },
});

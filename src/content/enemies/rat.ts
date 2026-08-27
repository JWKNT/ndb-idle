import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const rat = defineUnit({
  id: "rat",
  name: "Rat",
  stats: {
    hp: new Decimal(14),
    stamina: new Decimal(10),
    attack: new Decimal(4),
    defense: new Decimal(1),
    spAttack: new Decimal(1),
    spDefense: new Decimal(1),
    speed: new Decimal(16),
    luck: new Decimal(0),
  },
});

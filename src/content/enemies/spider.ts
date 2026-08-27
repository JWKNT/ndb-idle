import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const spider = defineUnit({
  id: "spider",
  name: "Spider",
  stats: {
    hp: new Decimal(72),
    stamina: new Decimal(20),
    attack: new Decimal(14),
    defense: new Decimal(6),
    spAttack: new Decimal(6),
    spDefense: new Decimal(7),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
});

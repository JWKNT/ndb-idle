import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const knight = defineUnit({
  id: "knight",
  name: "Knight",
  stats: {
    hp: new Decimal(52),
    stamina: new Decimal(30),
    attack: new Decimal(10),
    defense: new Decimal(4),
    spAttack: new Decimal(3),
    spDefense: new Decimal(3),
    speed: new Decimal(10),
    luck: new Decimal(5),
  },
});

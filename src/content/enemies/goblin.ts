import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const goblin = defineUnit({
  id: "goblin",
  name: "Goblin",
  stats: {
    hp: new Decimal(170),
    stamina: new Decimal(24),
    attack: new Decimal(24),
    defense: new Decimal(15),
    spAttack: new Decimal(7),
    spDefense: new Decimal(11),
    speed: new Decimal(20),
    luck: new Decimal(0),
  },
});

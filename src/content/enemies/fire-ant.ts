import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const fireAnt = defineUnit({
  id: "fire-ant",
  name: "Fire Ant",
  attackRange: 99,
  attackType: "special",
  attackName: "Fire Line",
  attackPattern: "orthogonal",
  stats: {
    hp: new Decimal(105),
    stamina: new Decimal(28),
    attack: new Decimal(10),
    defense: new Decimal(10),
    spAttack: new Decimal(31),
    spDefense: new Decimal(14),
    speed: new Decimal(26),
    luck: new Decimal(0),
  },
});

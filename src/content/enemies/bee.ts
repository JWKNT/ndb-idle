import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const bee = defineUnit({
  id: "bee",
  name: "Bee",
  attackRange: 2,
  attackName: "Stunning Sting",
  attackPattern: "orthogonal",
  paralysisChance: 0.5,
  stats: {
    hp: new Decimal(120),
    stamina: new Decimal(28),
    attack: new Decimal(27),
    defense: new Decimal(13),
    spAttack: new Decimal(7),
    spDefense: new Decimal(15),
    speed: new Decimal(30),
    luck: new Decimal(0),
  },
});

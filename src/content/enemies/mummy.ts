import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const mummy = defineUnit({
  id: "mummy",
  name: "Clay Mummy",
  attackRange: 5,
  attackType: "special",
  attackName: "Burial Burst",
  attackPattern: "eight-way",
  stats: {
    hp: new Decimal(800),
    stamina: new Decimal(40),
    attack: new Decimal(30),
    defense: new Decimal(48),
    spAttack: new Decimal(36),
    spDefense: new Decimal(52),
    speed: new Decimal(20),
    luck: new Decimal(0),
  },
});

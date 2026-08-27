import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const gloomWisp = defineUnit({
  id: "gloom-wisp",
  name: "Gloom Wisp",
  attackName: "Cold Flame",
  stats: {
    hp: new Decimal(790),
    stamina: new Decimal(90),
    attack: new Decimal(94),
    defense: new Decimal(64),
    spAttack: new Decimal(88),
    spDefense: new Decimal(86),
    speed: new Decimal(28),
    luck: new Decimal(0),
  },
});

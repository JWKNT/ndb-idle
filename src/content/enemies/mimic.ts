import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const mimic = defineUnit({
  id: "mimic",
  name: "Mimic",
  attackName: "Ravenous Bite",
  stats: {
    hp: new Decimal(250),
    stamina: new Decimal(50),
    attack: new Decimal(44),
    defense: new Decimal(24),
    spAttack: new Decimal(8),
    spDefense: new Decimal(22),
    speed: new Decimal(44),
    luck: new Decimal(0),
  },
});

import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const caveBat = defineUnit({
  id: "cave-bat",
  name: "Cave Bat",
  attackName: "Fang Dive",
  stats: {
    hp: new Decimal(230),
    stamina: new Decimal(40),
    attack: new Decimal(36),
    defense: new Decimal(24),
    spAttack: new Decimal(8),
    spDefense: new Decimal(20),
    speed: new Decimal(22),
    luck: new Decimal(0),
  },
});

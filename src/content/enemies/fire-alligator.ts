import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const fireAlligator = defineUnit({
  id: "fire-alligator",
  name: "Fire Alligator",
  attackName: "Magma Breath",
  attackRange: 3,
  attackType: "special",
  footprintWidth: 1,
  footprintHeight: 2,
  stats: {
    hp: new Decimal(460),
    stamina: new Decimal(60),
    attack: new Decimal(45),
    defense: new Decimal(60),
    spAttack: new Decimal(76),
    spDefense: new Decimal(58),
    speed: new Decimal(24),
    luck: new Decimal(0),
  },
});

import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const undertaker = defineUnit({
  id: "undertaker",
  name: "Undertaker",
  attackName: "Shovel",
  isRaidBoss: true,
  stats: {
    hp: new Decimal(32), stamina: new Decimal(10), attack: new Decimal(3), defense: new Decimal(1),
    spAttack: new Decimal(1), spDefense: new Decimal(1), speed: new Decimal(6), luck: new Decimal(0),
  },
});

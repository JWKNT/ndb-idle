import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const sewerToad: UnitDefinition = {
  id: "sewer-toad", name: "Frog", attackRange: 2, attackType: "special", attackPattern: "eight-way", attackName: "Sludge Spit",
  stats: { hp: new Decimal(175), stamina: new Decimal(35), attack: new Decimal(10), defense: new Decimal(17), spAttack: new Decimal(30), spDefense: new Decimal(22), speed: new Decimal(27), luck: new Decimal(2) },
};

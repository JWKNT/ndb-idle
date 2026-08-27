import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const direRat = defineUnit({
  id: "dire-rat", name: "Mutant Rat", attackRange: 1, attackName: "Rending Bite",
  stats: { hp: new Decimal(150), stamina: new Decimal(34), attack: new Decimal(28), defense: new Decimal(13), spAttack: new Decimal(4), spDefense: new Decimal(12), speed: new Decimal(34), luck: new Decimal(1) },
});

import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const goblinArcher = defineUnit({
  id: "goblin-archer", name: "Goblin Archer", attackName: "Arrow", attackRange: 7,
  attackPattern: "any", canMove: false,
  stats: { hp: new Decimal(140), stamina: new Decimal(24), attack: new Decimal(30), defense: new Decimal(12), spAttack: new Decimal(5), spDefense: new Decimal(10), speed: new Decimal(24), luck: new Decimal(1) },
});

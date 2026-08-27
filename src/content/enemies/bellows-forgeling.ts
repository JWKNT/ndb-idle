import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const bellowsForgeling = defineUnit({
  id: "bellows-forgeling", name: "Bellows Forgeling", attackName: "Cinder Burst", attackRange: 2, attackType: "special", attackPattern: "eight-way",
  stats: { hp: new Decimal(360), stamina: new Decimal(80), attack: new Decimal(32), defense: new Decimal(41), spAttack: new Decimal(68), spDefense: new Decimal(46), speed: new Decimal(37), luck: new Decimal(0) },
});

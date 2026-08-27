import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const chainForgeling = defineUnit({
  id: "chain-forgeling", name: "Chain Forgeling", attackName: "Chain Hook", attackRange: 3,
  stats: { hp: new Decimal(380), stamina: new Decimal(80), attack: new Decimal(52), defense: new Decimal(43), spAttack: new Decimal(26), spDefense: new Decimal(43), speed: new Decimal(35), luck: new Decimal(0) },
});

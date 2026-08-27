import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const forgeling = defineUnit({
  id: "forgeling", name: "Forgeling", attackName: "Hot Rivet",
  stats: { hp: new Decimal(410), stamina: new Decimal(80), attack: new Decimal(56), defense: new Decimal(48), spAttack: new Decimal(28), spDefense: new Decimal(48), speed: new Decimal(33), luck: new Decimal(0) },
});

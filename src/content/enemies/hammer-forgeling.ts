import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const hammerForgeling = defineUnit({
  id: "hammer-forgeling", name: "Hammer Forgeling", attackName: "Anvil Drop",
  stats: { hp: new Decimal(520), stamina: new Decimal(80), attack: new Decimal(80), defense: new Decimal(57), spAttack: new Decimal(24), spDefense: new Decimal(53), speed: new Decimal(27), luck: new Decimal(0) },
});

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "@/game/types";

export const forgeling: UnitDefinition = {
  id: "forgeling", name: "Forgeling", attackName: "Hot Rivet",
  stats: { hp: new Decimal(300), stamina: new Decimal(70), attack: new Decimal(45), defense: new Decimal(38), spAttack: new Decimal(22), spDefense: new Decimal(38), speed: new Decimal(30), luck: new Decimal(0) },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "@/game/types";

export const hammerForgeling: UnitDefinition = {
  id: "hammer-forgeling", name: "Hammer Forgeling", attackName: "Anvil Drop",
  stats: { hp: new Decimal(380), stamina: new Decimal(70), attack: new Decimal(64), defense: new Decimal(45), spAttack: new Decimal(18), spDefense: new Decimal(42), speed: new Decimal(24), luck: new Decimal(0) },
};

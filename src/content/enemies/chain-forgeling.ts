import Decimal from "break_eternity.js";
import type { UnitDefinition } from "@/game/types";

export const chainForgeling: UnitDefinition = {
  id: "chain-forgeling", name: "Chain Forgeling", attackName: "Chain Hook", attackRange: 3,
  stats: { hp: new Decimal(280), stamina: new Decimal(70), attack: new Decimal(42), defense: new Decimal(34), spAttack: new Decimal(20), spDefense: new Decimal(34), speed: new Decimal(32), luck: new Decimal(0) },
};

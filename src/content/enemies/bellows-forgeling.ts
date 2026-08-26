import Decimal from "break_eternity.js";
import type { UnitDefinition } from "@/game/types";

export const bellowsForgeling: UnitDefinition = {
  id: "bellows-forgeling", name: "Bellows Forgeling", attackName: "Cinder Burst", attackRange: 2, attackType: "special", attackPattern: "eight-way",
  stats: { hp: new Decimal(260), stamina: new Decimal(70), attack: new Decimal(25), defense: new Decimal(32), spAttack: new Decimal(55), spDefense: new Decimal(36), speed: new Decimal(34), luck: new Decimal(0) },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const soldierAnt: UnitDefinition = {
  id: "soldier-ant", name: "Soldier Ant", attackRange: 1, attackName: "Pincer Crush",
  stats: { hp: new Decimal(190), stamina: new Decimal(38), attack: new Decimal(27), defense: new Decimal(23), spAttack: new Decimal(5), spDefense: new Decimal(18), speed: new Decimal(28), luck: new Decimal(1) },
};

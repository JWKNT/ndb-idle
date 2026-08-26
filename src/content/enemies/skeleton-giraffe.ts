import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeletonGiraffe: UnitDefinition = {
  id: "skeleton-giraffe", name: "Skele-Giraffe", attackName: "High Kick",
  stats: { hp: new Decimal(26), stamina: new Decimal(12), attack: new Decimal(4), defense: new Decimal(2), spAttack: new Decimal(1), spDefense: new Decimal(2), speed: new Decimal(15), luck: new Decimal(0) },
};

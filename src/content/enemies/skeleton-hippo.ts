import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeletonHippo: UnitDefinition = {
  id: "skeleton-hippo", name: "Skele-Hippo", attackName: "Bone Crush",
  stats: { hp: new Decimal(45), stamina: new Decimal(14), attack: new Decimal(6), defense: new Decimal(5), spAttack: new Decimal(1), spDefense: new Decimal(4), speed: new Decimal(10), luck: new Decimal(0) },
};

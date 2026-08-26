import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeletonRhino: UnitDefinition = {
  id: "skeleton-rhino", name: "Skele-Rhino", attackName: "Grave Charge",
  stats: { hp: new Decimal(95), stamina: new Decimal(15), attack: new Decimal(16), defense: new Decimal(10), spAttack: new Decimal(1), spDefense: new Decimal(6), speed: new Decimal(13), luck: new Decimal(0) },
};

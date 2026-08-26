import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeletonPrince: UnitDefinition = {
  id: "skeleton-prince", name: "Skele-Prince", attackName: "Royal Slash", isRaidBoss: true,
  stats: { hp: new Decimal(135), stamina: new Decimal(18), attack: new Decimal(14), defense: new Decimal(8), spAttack: new Decimal(4), spDefense: new Decimal(7), speed: new Decimal(16), luck: new Decimal(0) },
};

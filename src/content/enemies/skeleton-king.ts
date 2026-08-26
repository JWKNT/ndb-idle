import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeletonKing: UnitDefinition = {
  id: "skeleton-king", name: "Skele-King", attackName: "Sovereign Cleave", isRaidBoss: true,
  stats: { hp: new Decimal(220), stamina: new Decimal(22), attack: new Decimal(19), defense: new Decimal(16), spAttack: new Decimal(8), spDefense: new Decimal(13), speed: new Decimal(18), luck: new Decimal(0) },
};

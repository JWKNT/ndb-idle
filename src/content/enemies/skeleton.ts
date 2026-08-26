import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeleton: UnitDefinition = {
  id: "skeleton",
  name: "Skeleton",
  isRaidBoss: true,
  stats: {
    hp: new Decimal(100),
    stamina: new Decimal(14),
    attack: new Decimal(12),
    defense: new Decimal(7),
    spAttack: new Decimal(2),
    spDefense: new Decimal(4),
    speed: new Decimal(14),
    luck: new Decimal(0),
  },
};

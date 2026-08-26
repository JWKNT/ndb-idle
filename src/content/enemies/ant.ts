import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const ant: UnitDefinition = {
  id: "ant",
  name: "Ant",
  stats: {
    hp: new Decimal(46),
    stamina: new Decimal(16),
    attack: new Decimal(10),
    defense: new Decimal(5),
    spAttack: new Decimal(3),
    spDefense: new Decimal(4),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
};

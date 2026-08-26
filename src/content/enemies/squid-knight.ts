import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const squidKnight: UnitDefinition = {
  id: "squid-knight",
  name: "Squid Knight",
  attackName: "Inksteel Blade",
  stats: {
    hp: new Decimal(175),
    stamina: new Decimal(28),
    attack: new Decimal(29),
    defense: new Decimal(18),
    spAttack: new Decimal(8),
    spDefense: new Decimal(16),
    speed: new Decimal(21),
    luck: new Decimal(0),
  },
};

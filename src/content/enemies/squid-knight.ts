import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const squidKnight: UnitDefinition = {
  id: "squid-knight",
  name: "Squid Knight",
  attackName: "Inksteel Blade",
  stats: {
    hp: new Decimal(220),
    stamina: new Decimal(28),
    attack: new Decimal(32),
    defense: new Decimal(22),
    spAttack: new Decimal(8),
    spDefense: new Decimal(20),
    speed: new Decimal(23),
    luck: new Decimal(0),
  },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

/** Placeholder Battle 11 tuning: intentionally far beyond a Battle 10 build. */
export const coconutBailiff: UnitDefinition = {
  id: "coconut-bailiff",
  name: "Coconut Bailiff",
  attackName: "Official Bonk",
  attackPattern: "eight-way",
  footprint: 2,
  stats: {
    hp: new Decimal(50_000),
    stamina: new Decimal(1),
    attack: new Decimal(900),
    defense: new Decimal(650),
    spAttack: new Decimal(100),
    spDefense: new Decimal(500),
    speed: new Decimal(220),
    luck: new Decimal(0),
  },
};

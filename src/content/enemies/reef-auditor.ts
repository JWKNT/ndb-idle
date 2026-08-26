import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

/** Placeholder Battle 11 tuning: intentionally far beyond a Battle 10 build. */
export const reefAuditor: UnitDefinition = {
  id: "reef-auditor",
  name: "Reef Auditor",
  attackRange: 6,
  attackType: "special",
  attackName: "Compliance Ray",
  attackPattern: "any",
  stats: {
    hp: new Decimal(35_000),
    stamina: new Decimal(1),
    attack: new Decimal(100),
    defense: new Decimal(450),
    spAttack: new Decimal(750),
    spDefense: new Decimal(700),
    speed: new Decimal(280),
    luck: new Decimal(0),
  },
};

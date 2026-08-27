import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

/**
 * Battle 11 is a visible future wall, not a currently balanced encounter.
 * One million base HP begins the post-Battle-10 curve while the island layout
 * remains the real hard gate until water traversal exists. Initial scale
 * reference: Save 3's late-Battle-10 Knight had about 1,092 HP and 375 Attack;
 * these numbers are intentionally many progression steps beyond that build.
 */
export const vacationEmperor = defineUnit({
  id: "vacation-emperor",
  name: "Vacation Emperor",
  attackRange: 5,
  attackType: "special",
  attackName: "Mandatory Leisure",
  attackPattern: "any",
  isRaidBoss: true,
  footprint: 3,
  stats: {
    hp: new Decimal(1_000_000),
    stamina: new Decimal(1),
    attack: new Decimal(2_500),
    defense: new Decimal(2_200),
    spAttack: new Decimal(3_200),
    spDefense: new Decimal(2_400),
    speed: new Decimal(400),
    luck: new Decimal(0),
  },
});

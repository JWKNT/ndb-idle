import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const beastTamer: UnitDefinition = {
  id: "beast-tamer",
  name: "Beast Tamer",
  attackRange: 2,
  attackName: "Taming Lash",
  attackPattern: "orthogonal",
  isRaidBoss: true,
  summonPool: ["fire-ant", "alligator", "dragonfly", "bee"],
  invulnerableWhileSummons: true,
  stats: {
    hp: new Decimal(900),
    stamina: new Decimal(40),
    attack: new Decimal(14),
    defense: new Decimal(35),
    spAttack: new Decimal(10),
    spDefense: new Decimal(34),
    speed: new Decimal(40),
    luck: new Decimal(2),
  },
};

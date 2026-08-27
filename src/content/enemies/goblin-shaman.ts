import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const goblinShaman = defineUnit({
  id: "goblin-shaman",
  name: "Goblin Shaman",
  attackRange: 3,
  attackType: "special",
  attackName: "Hex Bolt",
  attackPattern: "any",
  isRaidBoss: true,
  teleportRangeFraction: 0.5,
  stats: {
    hp: new Decimal(400),
    stamina: new Decimal(24),
    attack: new Decimal(9),
    defense: new Decimal(19),
    spAttack: new Decimal(30),
    spDefense: new Decimal(19),
    speed: new Decimal(22),
    luck: new Decimal(2),
  },
});

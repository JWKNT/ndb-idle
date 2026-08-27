import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const abyssalOoze = defineUnit({
  id: "abyssal-ooze",
  name: "Abyssal Ooze",
  attackRange: 5,
  attackType: "special",
  attackName: "Mire Surge",
  attackPattern: "any",
  isRaidBoss: true,
  footprint: 3,
  canMove: true,
  weakeningGuardDefinitionId: "ooze-guardian",
  weakeningPerGuardDefeat: 0.2,
  weakeningGuardCount: 3,
  stats: {
    hp: new Decimal(5_000),
    stamina: new Decimal(1),
    attack: new Decimal(58),
    defense: new Decimal(130),
    spAttack: new Decimal(72),
    spDefense: new Decimal(138),
    speed: new Decimal(26),
    luck: new Decimal(0),
  },
});

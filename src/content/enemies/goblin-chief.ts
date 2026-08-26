import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const goblinChief: UnitDefinition = {
  id: "goblin-chief",
  name: "Goblin Chief",
  attackRange: 2,
  isRaidBoss: true,
  stats: {
    hp: new Decimal(380),
    stamina: new Decimal(18),
    attack: new Decimal(28),
    defense: new Decimal(18),
    spAttack: new Decimal(5),
    spDefense: new Decimal(15),
    speed: new Decimal(20),
    luck: new Decimal(1),
  },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const miner: UnitDefinition = {
  id: "miner",
  name: "Miner",
  attackName: "Pick Swing",
  attackPattern: "eight-way",
  stats: {
    hp: new Decimal(72),
    stamina: new Decimal(34),
    attack: new Decimal(7),
    defense: new Decimal(9),
    spAttack: new Decimal(2),
    spDefense: new Decimal(9),
    speed: new Decimal(6),
    luck: new Decimal(4),
  },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const dragonfly: UnitDefinition = {
  id: "dragonfly",
  name: "Dragonfly",
  attackRange: 2,
  attackName: "Wing Dart",
  attackPattern: "eight-way",
  stats: {
    hp: new Decimal(115),
    stamina: new Decimal(28),
    attack: new Decimal(29),
    defense: new Decimal(11),
    spAttack: new Decimal(8),
    spDefense: new Decimal(14),
    speed: new Decimal(32),
    luck: new Decimal(0),
  },
};

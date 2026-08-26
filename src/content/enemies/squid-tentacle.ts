import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const squidTentacle: UnitDefinition = {
  id: "squid-tentacle",
  name: "Squid Tentacle",
  attackRange: 3,
  attackName: "Tentacle Slam",
  attackPattern: "orthogonal",
  canMove: false,
  requiresTridentThrow: true,
  stats: {
    hp: new Decimal(150),
    stamina: new Decimal(1),
    attack: new Decimal(18),
    defense: new Decimal(16),
    spAttack: new Decimal(8),
    spDefense: new Decimal(16),
    speed: new Decimal(16),
    luck: new Decimal(0),
  },
};

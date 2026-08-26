import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const squidTentacle: UnitDefinition = {
  id: "squid-tentacle",
  name: "Squid Tentacle",
  attackRange: 3,
  attackName: "Tentacle Slam",
  attackPattern: "orthogonal",
  canMove: false,
  stats: {
    hp: new Decimal(300),
    stamina: new Decimal(1),
    attack: new Decimal(22),
    defense: new Decimal(20),
    spAttack: new Decimal(10),
    spDefense: new Decimal(21),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
};

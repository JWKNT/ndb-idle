import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const brineDynamo: UnitDefinition = {
  id: "brine-dynamo",
  name: "Brine Dynamo",
  hideFromBestiary: true,
  attackRange: 4,
  attackType: "special",
  attackName: "Pressure Leak",
  attackPattern: "any",
  footprint: 2,
  canMove: false,
  stats: {
    hp: new Decimal(1_750),
    stamina: new Decimal(1),
    attack: new Decimal(1),
    defense: new Decimal(78),
    spAttack: new Decimal(42),
    spDefense: new Decimal(90),
    speed: new Decimal(5),
    luck: new Decimal(0),
  },
};

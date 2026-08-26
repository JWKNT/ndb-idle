import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const alligator: UnitDefinition = {
  id: "alligator",
  name: "Alligator",
  attackName: "Wide Snap",
  attackArea: "front-three",
  footprintWidth: 2,
  footprintHeight: 1,
  stats: {
    hp: new Decimal(185),
    stamina: new Decimal(34),
    attack: new Decimal(34),
    defense: new Decimal(21),
    spAttack: new Decimal(3),
    spDefense: new Decimal(15),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
};

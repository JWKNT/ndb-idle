import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const barnacleDrone: UnitDefinition = {
  id: "barnacle-drone",
  name: "Barnacle Drone",
  attackRange: 2,
  attackType: "special",
  attackName: "Rivet Jet",
  attackPattern: "eight-way",
  footprint: 2,
  stats: {
    hp: new Decimal(720),
    stamina: new Decimal(35),
    attack: new Decimal(42),
    defense: new Decimal(51),
    spAttack: new Decimal(54),
    spDefense: new Decimal(56),
    speed: new Decimal(30),
    luck: new Decimal(0),
  },
};

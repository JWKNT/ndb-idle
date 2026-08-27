import Decimal from "break_eternity.js";
import { defineUnit } from "../../game/types";

export const barnacleDrone = defineUnit({
  id: "barnacle-drone",
  name: "Barnacle Drone",
  attackRange: 2,
  attackType: "special",
  attackName: "Rivet Jet",
  attackPattern: "eight-way",
  footprint: 2,
  stats: {
    hp: new Decimal(900),
    stamina: new Decimal(35),
    attack: new Decimal(48),
    defense: new Decimal(58),
    spAttack: new Decimal(62),
    spDefense: new Decimal(64),
    speed: new Decimal(32),
    luck: new Decimal(0),
  },
});

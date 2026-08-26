import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const clayGolem: UnitDefinition = {
  id: "clay-golem",
  name: "Clay Golem",
  attackRange: 99,
  attackType: "special",
  attackName: "Crimson Beam",
  attackPattern: "eight-way",
  stats: {
    hp: new Decimal(150),
    stamina: new Decimal(34),
    attack: new Decimal(18),
    defense: new Decimal(18),
    spAttack: new Decimal(30),
    spDefense: new Decimal(16),
    // Deliberate exception to the broader enemy-speed curve: its danger is the
    // wall-to-wall laser, while its ponderous turns remain a readable tell.
    speed: new Decimal(4),
    luck: new Decimal(0),
  },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "@/game/types";

export const oreBeetle: UnitDefinition = {
  id: "ore-beetle",
  name: "Ore Beetle",
  attackName: "Iron Mandibles",
  stats: {
    hp: new Decimal(580),
    stamina: new Decimal(70),
    attack: new Decimal(70),
    defense: new Decimal(58),
    spAttack: new Decimal(16),
    spDefense: new Decimal(52),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
};

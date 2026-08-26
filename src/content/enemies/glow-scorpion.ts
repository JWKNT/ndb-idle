import Decimal from "break_eternity.js";
import type { UnitDefinition } from "@/game/types";

export const glowScorpion: UnitDefinition = {
  id: "glow-scorpion",
  name: "Glow Scorpion",
  attackName: "Lantern Sting",
  stats: {
    hp: new Decimal(360),
    stamina: new Decimal(55),
    attack: new Decimal(52),
    defense: new Decimal(36),
    spAttack: new Decimal(18),
    spDefense: new Decimal(32),
    speed: new Decimal(24),
    luck: new Decimal(0),
  },
};

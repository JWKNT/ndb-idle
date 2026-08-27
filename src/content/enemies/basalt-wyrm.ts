import Decimal from "break_eternity.js";
import { defineUnit } from "@/game/types";

export const basaltWyrm = defineUnit({
  id: "basalt-wyrm",
  name: "Basalt Wyrm",
  attackName: "Bedrock Bite",
  stats: {
    hp: new Decimal(1_180),
    stamina: new Decimal(120),
    attack: new Decimal(126),
    defense: new Decimal(92),
    spAttack: new Decimal(54),
    spDefense: new Decimal(96),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
});

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const skeletonBrachiosaurus: UnitDefinition = {
  id: "skeleton-brachiosaurus", name: "Skele-Brachiosaurus", attackName: "Ancient Stomp",
  stats: { hp: new Decimal(145), stamina: new Decimal(18), attack: new Decimal(18), defense: new Decimal(13), spAttack: new Decimal(2), spDefense: new Decimal(8), speed: new Decimal(10), luck: new Decimal(0) },
};

import Decimal from "break_eternity.js";
import type { UnitDefinition } from "../../game/types";

export const abyssalSquid: UnitDefinition = {
  id: "abyssal-squid",
  name: "Abyssal Squid",
  attackRange: 99,
  attackType: "special",
  attackName: "Abyssal Orb",
  attackPattern: "any",
  isRaidBoss: true,
  footprint: 3,
  canMove: false,
  invulnerableWhileEnemyId: "squid-tentacle",
  blocksWeaponThrows: true,
  stats: {
    hp: new Decimal(950),
    stamina: new Decimal(1),
    attack: new Decimal(8),
    defense: new Decimal(28),
    spAttack: new Decimal(27),
    spDefense: new Decimal(26),
    speed: new Decimal(18),
    luck: new Decimal(0),
  },
};

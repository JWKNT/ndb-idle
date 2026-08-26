import type { AttackPattern, AttackType, AttackVisualId, WeaponAbilityId } from "./types";

export type WeaponSkillPattern = "surround" | "front-six" | "impact-plus" | "single" | "trident";

export interface WeaponSkillDefinition {
  id: WeaponAbilityId;
  name: string;
  attackType: AttackType;
  range: number;
  attackPattern: AttackPattern;
  visual: AttackVisualId;
  area: WeaponSkillPattern;
  damageMultiplier: number;
  cooldownTurns: number;
  forcesPass?: boolean;
}

export const WEAPON_SKILLS: Record<WeaponAbilityId, WeaponSkillDefinition> = {
  sweep: {
    id: "sweep",
    name: "Sweeping Arc",
    attackType: "physical",
    range: 1,
    attackPattern: "eight-way",
    visual: "sword-sweep",
    area: "surround",
    damageMultiplier: 1.35,
    cooldownTurns: 3,
  },
  "heavy-slam": {
    id: "heavy-slam",
    name: "Heavy Slam",
    attackType: "physical",
    range: 2,
    attackPattern: "orthogonal",
    visual: "heavy-slam",
    area: "front-six",
    damageMultiplier: 1.7,
    cooldownTurns: 4,
  },
  "burst-staff": {
    id: "burst-staff",
    name: "Burst Orb",
    attackType: "special",
    range: 2,
    attackPattern: "any",
    visual: "burst-orb",
    area: "impact-plus",
    damageMultiplier: 1.45,
    cooldownTurns: 3,
  },
  "rapid-staff": {
    id: "rapid-staff",
    name: "Eightfold Bolt",
    attackType: "special",
    range: 3,
    attackPattern: "eight-way",
    visual: "rapid-bolt",
    area: "single",
    damageMultiplier: 1.15,
    cooldownTurns: 2,
  },
  "trident-throw": {
    id: "trident-throw",
    name: "Tidecaller Throw",
    attackType: "special",
    range: 3,
    attackPattern: "orthogonal",
    visual: "trident-throw",
    area: "trident",
    damageMultiplier: 3,
    cooldownTurns: 4,
    forcesPass: true,
  },
};

export function weaponSkill(id: WeaponAbilityId | undefined): WeaponSkillDefinition | null {
  return id ? WEAPON_SKILLS[id] : null;
}

import type { StatKey } from "./types";

export const POTION_DURATION_MS = 30 * 60 * 1_000;
export const POTION_COST = 10_000;
export const POTION_LEVEL_2_COST = 100_000;

export const STANDARD_LEVEL_ONE_POTION_IDS = [
  "haste",
  "stat-hp",
  "stat-stamina",
  "stat-attack",
  "stat-defense",
  "stat-sp-attack",
  "stat-sp-defense",
  "stat-speed",
  "stat-luck",
] as const;

export type StandardLevelOnePotionId = (typeof STANDARD_LEVEL_ONE_POTION_IDS)[number];

export const POTION_IDS = [
  ...STANDARD_LEVEL_ONE_POTION_IDS,
  "mystery-1",
  "haste-2",
  "stat-hp-2",
  "stat-stamina-2",
  "stat-attack-2",
  "stat-defense-2",
  "stat-sp-attack-2",
  "stat-sp-defense-2",
  "stat-speed-2",
  "stat-luck-2",
] as const;

export type PotionId = (typeof POTION_IDS)[number];
export type PotionCounts = Record<PotionId, number>;
export type ActivePotionEffects = Partial<Record<PotionId, number>>;
export type PotionEffectKind = "stat" | "haste" | "mystery";

export interface ActiveMysteryPotionEffect {
  positive: [StandardLevelOnePotionId, StandardLevelOnePotionId];
  negative: StandardLevelOnePotionId;
  expiresAt: number;
}

export interface PotionDefinition {
  id: PotionId;
  name: string;
  description: string;
  level: 1 | 2;
  cost: number;
  stat: StatKey | null;
  statBonus: number;
  speedMultiplier: number;
  effectKind: PotionEffectKind;
}

function statPotion(
  id: PotionId,
  label: string,
  stat: StatKey,
  level: 1 | 2,
  bonus: number,
): PotionDefinition {
  return {
    id,
    name: `Level ${level} ${label} Potion`,
    description: `Whole party: +${bonus} ${label} · 30 minutes.`,
    level,
    cost: level === 1 ? POTION_COST : POTION_LEVEL_2_COST,
    stat,
    statBonus: bonus,
    speedMultiplier: 1,
    effectKind: "stat",
  };
}

function hastePotion(id: PotionId, level: 1 | 2, multiplier: number): PotionDefinition {
  return {
    id,
    name: `Level ${level} Haste Potion`,
    description: `Adventure actions: ${multiplier.toFixed(1)}× speed · 30 minutes.`,
    level,
    cost: level === 1 ? POTION_COST : POTION_LEVEL_2_COST,
    stat: null,
    statBonus: 0,
    speedMultiplier: multiplier,
    effectKind: "haste",
  };
}

export const POTION_META: Record<PotionId, PotionDefinition> = {
  haste: hastePotion("haste", 1, 1.1),
  "stat-hp": statPotion("stat-hp", "HP", "hp", 1, 50),
  "stat-stamina": statPotion("stat-stamina", "Stamina", "stamina", 1, 50),
  "stat-attack": statPotion("stat-attack", "Attack", "attack", 1, 50),
  "stat-defense": statPotion("stat-defense", "Defense", "defense", 1, 50),
  "stat-sp-attack": statPotion("stat-sp-attack", "Sp. Attack", "spAttack", 1, 50),
  "stat-sp-defense": statPotion("stat-sp-defense", "Sp. Defense", "spDefense", 1, 50),
  "stat-speed": statPotion("stat-speed", "Speed", "speed", 1, 50),
  "stat-luck": statPotion("stat-luck", "Luck", "luck", 1, 10),
  "mystery-1": {
    id: "mystery-1",
    name: "Level 1 Mystery Potion",
    description: "For 30 minutes: two random Level 1 buffs, half a third effect but BAD, and 5% dodge. Charles strained it through his nicest sock!",
    level: 1,
    cost: 0,
    stat: null,
    statBonus: 0,
    speedMultiplier: 1,
    effectKind: "mystery",
  },
  "haste-2": hastePotion("haste-2", 2, 1.2),
  "stat-hp-2": statPotion("stat-hp-2", "HP", "hp", 2, 100),
  "stat-stamina-2": statPotion("stat-stamina-2", "Stamina", "stamina", 2, 100),
  "stat-attack-2": statPotion("stat-attack-2", "Attack", "attack", 2, 100),
  "stat-defense-2": statPotion("stat-defense-2", "Defense", "defense", 2, 100),
  "stat-sp-attack-2": statPotion("stat-sp-attack-2", "Sp. Attack", "spAttack", 2, 100),
  "stat-sp-defense-2": statPotion("stat-sp-defense-2", "Sp. Defense", "spDefense", 2, 100),
  "stat-speed-2": statPotion("stat-speed-2", "Speed", "speed", 2, 100),
  "stat-luck-2": statPotion("stat-luck-2", "Luck", "luck", 2, 25),
};

export function emptyPotionCounts(): PotionCounts {
  return Object.fromEntries(POTION_IDS.map((id) => [id, 0])) as PotionCounts;
}

export function mysteryPotionEffectDescription(effect: ActiveMysteryPotionEffect): string {
  const shortName = (id: StandardLevelOnePotionId) => POTION_META[id].name
    .replace("Level 1 ", "")
    .replace(" Potion", "");
  return `${shortName(effect.positive[0])} + ${shortName(effect.positive[1])}; half ${shortName(effect.negative)} reversed`;
}

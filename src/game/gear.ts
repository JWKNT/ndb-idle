import type { StatKey, Stats, WeaponAbilityId } from "./types";

export const GEAR_SLOTS = ["helmet", "chestplate", "leggings", "boots", "sword", "accessory"] as const;
export const TRIDENT_THROW_RANGE = 3;
const TREASURE_GEAR_SLOTS = ["helmet", "chestplate", "leggings", "boots", "sword"] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

export interface GearItem {
  id: string;
  definitionId?: "trident" | "undead-gem" | "shaman-ring" | "suction-cups";
  name: string;
  slot: GearSlot;
  ring: number;
  power: number;
  bonuses: Partial<Record<StatKey, number>>;
  weaponAbilityId?: WeaponAbilityId;
}

export function isMilestoneGear(item: GearItem): boolean {
  return item.definitionId !== undefined;
}

export function createTridentGear(): GearItem {
  return {
    id: "merman-tidecaller-trident",
    definitionId: "trident",
    name: "Tidecaller Trident",
    slot: "sword",
    ring: 0,
    power: 12,
    bonuses: { attack: 24, spAttack: 10, speed: 4 },
    weaponAbilityId: "trident-throw",
  };
}

export function createUndeadGemGear(): GearItem {
  return {
    id: "shopkeeper-undead-gem",
    definitionId: "undead-gem",
    name: "Undead Gem",
    slot: "accessory",
    ring: 0,
    power: 4,
    bonuses: { spDefense: 4, luck: 1 },
  };
}

export function createShamanRingGear(): GearItem {
  return {
    id: "battle-goblin-shaman-ring",
    definitionId: "shaman-ring",
    name: "Shaman's Ring",
    slot: "accessory",
    ring: 0,
    power: 6,
    bonuses: { spAttack: 4, speed: 2 },
  };
}

export function createSuctionCupsGear(): GearItem {
  return {
    id: "battle-abyssal-ooze-suction-cups",
    definitionId: "suction-cups",
    name: "Suction Cups",
    slot: "accessory",
    ring: 0,
    power: 12,
    bonuses: { defense: 12, spDefense: 12 },
  };
}

export type Equipment = Record<GearSlot, string | null>;

export const EMPTY_EQUIPMENT: Equipment = {
  helmet: null,
  chestplate: null,
  leggings: null,
  boots: null,
  sword: null,
  accessory: null,
};

const SLOT_LABELS: Record<GearSlot, string> = {
  helmet: "Helmet",
  chestplate: "Chestplate",
  leggings: "Leggings",
  boots: "Boots",
  sword: "Weapon",
  accessory: "Accessory",
};

export function createRingGear(
  slot: GearSlot,
  ring: number,
  sourceKey: string,
  completedBattleNumbers: readonly number[] = [],
): GearItem {
  const safeRing = Math.max(0, Math.floor(ring));
  const power = safeRing + 1;
  const bonuses: Record<GearSlot, Partial<Record<StatKey, number>>> = {
    helmet: { hp: 4 * power, spDefense: power },
    chestplate: { hp: 6 * power, defense: 2 * power },
    leggings: { stamina: 3 * power, defense: power },
    boots: { speed: 2 * power, luck: power },
    sword: { attack: 3 * power },
    accessory: { spDefense: 2 * power, luck: power },
  };
  const weaponAbilityId = slot === "sword"
    ? treasureWeaponAbility(sourceKey, safeRing, completedBattleNumbers.includes(8))
    : undefined;
  const weaponNames: Partial<Record<WeaponAbilityId, string>> = {
    sweep: "Sweeping Sword",
    "heavy-slam": "Great Slammer",
    "burst-staff": "Burst Staff",
    "rapid-staff": "Eightfold Staff",
  };
  const weaponBonuses = weaponAbilityId === "burst-staff" || weaponAbilityId === "rapid-staff"
    ? { spAttack: 4 * power }
    : bonuses.sword;
  return {
    id: `treasure-${sourceKey}-${slot}-r${safeRing}`,
    name: slot === "sword"
      ? `Level ${safeRing} ${weaponNames[weaponAbilityId!] ?? SLOT_LABELS[slot]}`
      : `Level ${safeRing} ${SLOT_LABELS[slot]}`,
    slot,
    ring: safeRing,
    power,
    bonuses: slot === "sword" ? weaponBonuses : bonuses[slot],
    weaponAbilityId,
  };
}

function treasureWeaponAbility(
  sourceKey: string,
  ring: number,
  lateWeaponsUnlocked: boolean,
): WeaponAbilityId {
  const pool: WeaponAbilityId[] = lateWeaponsUnlocked
    ? ["sweep", "burst-staff", "heavy-slam", "rapid-staff"]
    : ["sweep", "burst-staff"];
  let hash = 2166136261;
  for (const character of `${sourceKey}:${ring}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return pool[Math.abs(hash) % pool.length] ?? "sweep";
}

export function treasureGearSlot(x: number, y: number, ring: number): GearSlot {
  const hash = Math.abs(x * 73_856_093 ^ y * 19_349_663 ^ ring * 83_492_791);
  return TREASURE_GEAR_SLOTS[hash % TREASURE_GEAR_SLOTS.length] ?? "helmet";
}

export function totalGearBonus(
  stat: StatKey,
  inventory: GearItem[],
  equipment: Equipment,
): number {
  let total = 0;
  for (const slot of GEAR_SLOTS) {
    const item = inventory.find((candidate) => candidate.id === equipment[slot]);
    total += item?.bonuses[stat] ?? 0;
  }
  return total;
}

export function applyGearBonuses(
  stats: Stats,
  inventory: GearItem[],
  equipment: Equipment,
): Stats {
  return {
    hp: stats.hp.add(totalGearBonus("hp", inventory, equipment)),
    stamina: stats.stamina.add(totalGearBonus("stamina", inventory, equipment)),
    attack: stats.attack.add(totalGearBonus("attack", inventory, equipment)),
    defense: stats.defense.add(totalGearBonus("defense", inventory, equipment)),
    spAttack: stats.spAttack.add(totalGearBonus("spAttack", inventory, equipment)),
    spDefense: stats.spDefense.add(totalGearBonus("spDefense", inventory, equipment)),
    speed: stats.speed.add(totalGearBonus("speed", inventory, equipment)),
    luck: stats.luck.add(totalGearBonus("luck", inventory, equipment)),
  };
}

export function gearSlotLabel(slot: GearSlot): string {
  return SLOT_LABELS[slot];
}

export function isGearSlot(value: unknown): value is GearSlot {
  return typeof value === "string" && GEAR_SLOTS.includes(value as GearSlot);
}

export function isWeaponAbilityId(value: unknown): value is WeaponAbilityId {
  return typeof value === "string" && [
    "sweep", "heavy-slam", "burst-staff", "rapid-staff", "trident-throw",
  ].includes(value);
}

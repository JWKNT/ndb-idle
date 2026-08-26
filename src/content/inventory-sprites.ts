import type { GearItem, GearSlot } from "../game/gear";
import type { MaterialId } from "../game/items";
import type { PotionId } from "../game/potions";
import type { EscapeRopeLevel } from "../game/escape-ropes";
import type { StatKey } from "../game/types";
import type { SpriteName } from "./sprites";

export const GEAR_SPRITES: Record<GearSlot, SpriteName> = {
  helmet: "gearHelmet",
  chestplate: "gearChestplate",
  leggings: "gearLeggings",
  boots: "gearBoots",
  sword: "gearSword",
  accessory: "gearUndeadGem",
};

export function gearSprite(item: GearItem): SpriteName {
  if (item.definitionId === "trident") return "gearTrident";
  if (item.definitionId === "undead-gem") return "gearUndeadGem";
  if (item.definitionId === "shaman-ring") return "gearShamanRing";
  if (item.definitionId === "suction-cups") return "gearSuctionCups";
  if (item.slot === "accessory") return GEAR_SPRITES.accessory;
  const level = Math.min(4, Math.max(1, Math.floor(item.ring))) as 1 | 2 | 3 | 4;
  if (item.weaponAbilityId === "heavy-slam") return HEAVY_SWORD_SPRITES[level];
  if (item.weaponAbilityId === "burst-staff") return BURST_STAFF_SPRITES[level];
  if (item.weaponAbilityId === "rapid-staff") return RAPID_STAFF_SPRITES[level];
  return LEVEL_GEAR_SPRITES[level][item.slot];
}

const HEAVY_SWORD_SPRITES: Record<1 | 2 | 3 | 4, SpriteName> = {
  1: "gearHeavySword", 2: "gearHeavySword2", 3: "gearHeavySword3", 4: "gearHeavySword4",
};

const BURST_STAFF_SPRITES: Record<1 | 2 | 3 | 4, SpriteName> = {
  1: "gearBurstStaff", 2: "gearBurstStaff2", 3: "gearBurstStaff3", 4: "gearBurstStaff4",
};

const RAPID_STAFF_SPRITES: Record<1 | 2 | 3 | 4, SpriteName> = {
  1: "gearRapidStaff", 2: "gearRapidStaff2", 3: "gearRapidStaff3", 4: "gearRapidStaff4",
};

const LEVEL_GEAR_SPRITES: Record<1 | 2 | 3 | 4, Record<Exclude<GearSlot, "accessory">, SpriteName>> = {
  1: { helmet: "gearHelmet", chestplate: "gearChestplate", leggings: "gearLeggings", boots: "gearBoots", sword: "gearSword" },
  2: { helmet: "gearHelmet2", chestplate: "gearChestplate2", leggings: "gearLeggings2", boots: "gearBoots2", sword: "gearSword2" },
  3: { helmet: "gearHelmet3", chestplate: "gearChestplate3", leggings: "gearLeggings3", boots: "gearBoots3", sword: "gearSword3" },
  4: { helmet: "gearHelmet4", chestplate: "gearChestplate4", leggings: "gearLeggings4", boots: "gearBoots4", sword: "gearSword4" },
};

export const MATERIAL_SPRITES: Record<MaterialId, SpriteName> = {
  "rat-pelt": "ratPelt",
  "ant-chitin": "antChitin",
  "ink-sac": "inkSac",
  "fire-alligator-hide": "fireAlligatorHide",
  clay: "clay",
  "rotten-tentacle": "rottenTentacle",
  driftwood: "driftwood",
  seaweed: "seaweed",
  "magic-bait": "magicBait",
  "rusty-metal": "rustyMetal",
  "rusty-gear": "rustyGear",
  "mapmaker-chalk": "mapmakerChalk",
  "eye-of-frog": "eyeOfFrog",
  "mutated-rat-tail": "mutatedRatTail",
  "fire-ant-chitin": "fireAntChitin",
};

export const POTION_SPRITES: Record<PotionId, SpriteName> = {
  haste: "potionHaste",
  "stat-hp": "potionHp",
  "stat-stamina": "potionStamina",
  "stat-attack": "potionAttack",
  "stat-defense": "potionDefense",
  "stat-sp-attack": "potionSpAttack",
  "stat-sp-defense": "potionSpDefense",
  "stat-speed": "potionSpeed",
  "stat-luck": "potionLuck",
  "mystery-1": "potionMystery",
  "haste-2": "potionHaste2",
  "stat-hp-2": "potionHp2",
  "stat-stamina-2": "potionStamina2",
  "stat-attack-2": "potionAttack2",
  "stat-defense-2": "potionDefense2",
  "stat-sp-attack-2": "potionSpAttack2",
  "stat-sp-defense-2": "potionSpDefense2",
  "stat-speed-2": "potionSpeed2",
  "stat-luck-2": "potionLuck2",
};

export const FISH_SPRITES: Record<StatKey, SpriteName> = {
  hp: "fishHeartyHalibut",
  stamina: "fishEnduringEel",
  attack: "fishSavageSawfish",
  defense: "fishBulwarkBarnacle",
  spAttack: "fishArcaneAxolotl",
  spDefense: "fishCleansingClam",
  speed: "fishQuickQuillfish",
  luck: "fishFortunateFlounder",
};

export const KEY_ITEM_SPRITES = {
  fishingRod: "fishingRod",
  loweringRope: "loweringRope",
  blacksmithHammer: "blacksmithHammer",
  pickaxe: "pickaxe",
  bestiary: "bestiary",
  blacksmithBlueprints: "blacksmithBlueprints",
  craftingTable: "craftingTable",
  towerKey: "towerKey",
  tackleBox: "tackleBox",
} as const satisfies Record<string, SpriteName>;

export const ESCAPE_ROPE_SPRITES: Record<EscapeRopeLevel, SpriteName> = {
  1: "escapeRope1",
  2: "escapeRope2",
  3: "escapeRope3",
};

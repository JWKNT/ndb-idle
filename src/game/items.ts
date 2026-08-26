import type { StatKey } from "./types";

export const MATERIAL_IDS = [
  "rat-pelt",
  "ant-chitin",
  "ink-sac",
  "fire-alligator-hide",
  "clay",
  "rotten-tentacle",
  "driftwood",
  "seaweed",
  "magic-bait",
  "rusty-metal",
  "rusty-gear",
  "mapmaker-chalk",
  "eye-of-frog",
  "mutated-rat-tail",
  "fire-ant-chitin",
] as const;
export type MaterialId = (typeof MATERIAL_IDS)[number];
export type MaterialCounts = Record<MaterialId, number>;

export const FISHING_BAIT_IDS = ["rat-pelt", "ant-chitin", "ink-sac", "fire-alligator-hide", "rotten-tentacle", "magic-bait"] as const;
export type FishingBaitId = (typeof FISHING_BAIT_IDS)[number];

export const MATERIAL_META: Record<MaterialId, {
  name: string;
  sellPrice: number;
  catchChance: number;
  description: string;
  reusableBait?: boolean;
  materialCatchChances?: Partial<Record<MaterialId, number>>;
}> = {
  "rat-pelt": {
    name: "Rat Pelt",
    sellPrice: 5,
    catchChance: 0.02,
    description: "A whole Rat Pelt! The Rat underneath is now pink, smooth, and furious somewhere offscreen. One cast gives a tiny 2% catch chance.",
  },
  "ant-chitin": {
    name: "Ant Chitin",
    sellPrice: 10,
    catchChance: 0.03,
    description: "The crunchy outside of an Ant. Throw one in the water for a 3% catch chance. Fish LOVE floor armor, apparently.",
  },
  "ink-sac": {
    name: "Ink Sac",
    sellPrice: 15,
    catchChance: 0.04,
    description: "A wet bag of Octopus ink. Squeeze it to turn your inventory black forever! Or use one cast for a 4% catch chance.",
  },
  "fire-alligator-hide": {
    name: "Fire Alligator Hide",
    sellPrice: 24,
    catchChance: 0.04,
    description: "Hot Alligator skin. Still twitching. Still smoking. One cast gives a 4% catch chance and ruins the water nearby.",
  },
  clay: {
    name: "Clay",
    sellPrice: 12,
    catchChance: 0,
    description: "It's clay. Wet dirt. You killed a huge magic person and received wet dirt. LOOT!",
  },
  "rotten-tentacle": {
    name: "Rotten Tentacle",
    sellPrice: 0,
    catchChance: 0,
    reusableBait: true,
    materialCatchChances: { driftwood: 0.02, seaweed: 0.01 },
    description: "A rotten Squid arm. Fish bite once, gag, and leave it on the hook. Reusable forever for catching wood and salad.",
  },
  driftwood: {
    name: "Driftwood",
    sellPrice: 8,
    catchChance: 0,
    description: "You went FISHING and caught WOOD. Somewhere, an actual fish watched this happen and felt superior.",
  },
  seaweed: {
    name: "Seaweed",
    sellPrice: 5,
    catchChance: 0,
    description: "Wet dungeon grass. Smells green. Tastes brown. Stop testing item descriptions with your mouth.",
  },
  "magic-bait": {
    name: "Magic Bait",
    sellPrice: 0,
    catchChance: 0.05,
    description: "Normal bait dipped in purple magic sludge. One cast gives a luxurious 5% catch chance. WOW, almost a number!",
  },
  "rusty-metal": {
    name: "Rusty Metal",
    sellPrice: 18,
    catchChance: 0,
    description: "A jagged Forgeling chunk. It was either armor or bone. Lick it and tell me which! (DO NOT ACTUALLY.)",
  },
  "rusty-gear": {
    name: "Rusty Gear",
    sellPrice: 0,
    catchChance: 0,
    description: "A huge Colossus gear. If you hold it to your ear you can hear Chapter 2 whisper 'not implemented yet.'",
  },
  "mapmaker-chalk": {
    name: "Mapmaker's Chalk",
    sellPrice: 0,
    catchChance: 0,
    description: "Rub it on an adventurer to reveal a 5×5 map area. The instructions said ON, not IN. Spit out the chalk.",
  },
  "eye-of-frog": {
    name: "Eye of Frog",
    sellPrice: 20,
    catchChance: 0,
    description: "A freshly uninstalled Frog Eye. Charles needs ten and keeps tapping the empty jar with a spoon. Hurry.",
  },
  "mutated-rat-tail": {
    name: "Mutated Rat Tail",
    sellPrice: 20,
    catchChance: 0,
    description: "A Rat Tail with extra knots, bumps, and at least one tiny elbow. Charles calls it 'one long ingredient.'",
  },
  "fire-ant-chitin": {
    name: "Fire Ant Chitin",
    sellPrice: 20,
    catchChance: 0,
    description: "Fire Ant shell. Spicy, crunchy, still warm. Charles needs EXACTLY ten because eleven makes the Potion judgmental.",
  },
};

export const FISH_STATS: StatKey[] = [
  "hp",
  "stamina",
  "attack",
  "defense",
  "spAttack",
  "spDefense",
  "speed",
  "luck",
];

export type FishCounts = Record<StatKey, number>;
export const FISH_BASE_STAT_BONUS = 3;

export const FISH_META: Record<StatKey, { name: string; sellPrice: number; description: string }> = {
  hp: { name: "Hearty Halibut", sellPrice: 30, description: "Eat it for +3 base HP. Bones, scales, eyes, everything. The stat bonus lives in the horrible crunchy parts." },
  stamina: { name: "Enduring Eel", sellPrice: 30, description: "Eat it for +3 base Stamina. It wriggles the WHOLE way down. That's probably the bonus entering you.", },
  attack: { name: "Savage Sawfish", sellPrice: 35, description: "Eat it for +3 base Attack. Start at the end that is not an actual saw, genius." },
  defense: { name: "Bulwark Barnacle", sellPrice: 35, description: "Eat it for +3 base Defense. If your teeth survive the shell, you were already pretty defensive." },
  spAttack: { name: "Arcane Axolotl", sellPrice: 35, description: "Eat it for +3 base Sp. Attack. It maintains eye contact until the final, damp crunch." },
  spDefense: { name: "Cleansing Clam", sellPrice: 35, description: "Eat it for +3 base Sp. Defense. Yes, WITH the shell. This game rewards commitment." },
  speed: { name: "Quick Quillfish", sellPrice: 40, description: "Eat it for +3 base Speed. Your first burst of speed will be toward the nearest toilet." },
  luck: { name: "Fortunate Flounder", sellPrice: 45, description: "Eat it for +3 base Luck. The fish clearly wasn't using any, so take the whole supply." },
};

export function emptyMaterialCounts(): MaterialCounts {
  return {
    "rat-pelt": 0,
    "ant-chitin": 0,
    "ink-sac": 0,
    "fire-alligator-hide": 0,
    clay: 0,
    "rotten-tentacle": 0,
    driftwood: 0,
    seaweed: 0,
    "magic-bait": 0,
    "rusty-metal": 0,
    "rusty-gear": 0,
    "mapmaker-chalk": 0,
    "eye-of-frog": 0,
    "mutated-rat-tail": 0,
    "fire-ant-chitin": 0,
  };
}

export function emptyFishCounts(): FishCounts {
  return {
    hp: 0,
    stamina: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
    luck: 0,
  };
}

export function bulkSellAmounts(quantity: number): number[] {
  const available = Number.isFinite(quantity)
    ? Math.max(0, Math.floor(quantity))
    : 0;
  const amounts: number[] = [];
  for (let amount = 1; amount <= available;) {
    amounts.push(amount);
    if (amount > available / 10) break;
    amount *= 10;
  }
  return amounts;
}

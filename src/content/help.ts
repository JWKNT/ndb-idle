import type { ProgressionState } from "@/game/progression";

export const HELP_GROUP_IDS = ["basics", "party", "adventure", "fishing", "workshop", "records"] as const;
export type HelpGroupId = (typeof HELP_GROUP_IDS)[number];

export interface HelpGroup {
  id: HelpGroupId;
  title: string;
}

export interface HelpListItem {
  label: string;
  text: string;
}

export interface HelpSection {
  title?: string;
  paragraphs: readonly string[];
  items?: readonly HelpListItem[];
}

export interface HelpEntry {
  id: string;
  group: HelpGroupId;
  title: string;
  kicker: string;
  sections: readonly HelpSection[];
  unlocked: (progression: ProgressionState) => boolean;
}

const always = () => true;

export const HELP_GROUPS: readonly HelpGroup[] = [
  { id: "basics", title: "Basics" },
  { id: "party", title: "Party" },
  { id: "adventure", title: "Adventure" },
  { id: "fishing", title: "Fishing" },
  { id: "workshop", title: "Workshop" },
  { id: "records", title: "Records" },
];

export const HELP_ENTRIES: readonly HelpEntry[] = [
  {
    id: "controls",
    group: "basics",
    title: "Controls",
    kicker: "MOVEMENT AND ACTIONS",
    unlocked: always,
    sections: [
      {
        title: "Keyboard",
        paragraphs: [],
        items: [
          { label: "WASD / Arrows", text: "Move the active character one tile." },
          { label: "Space", text: "Use a basic attack on an enemy in range. If no enemy is in range, pass the turn." },
          { label: "Q", text: "Toggle auto mode for the current activity." },
          { label: "Escape", text: "Close an open Help or conversation-style overlay." },
        ],
      },
      {
        title: "Mouse",
        paragraphs: [],
        items: [
          { label: "Left-click", text: "Move, interact, or use a basic attack." },
          { label: "Right-click", text: "Use the equipped weapon's secondary attack on the chosen tile." },
        ],
      },
    ],
  },
  {
    id: "combat",
    group: "basics",
    title: "Battles",
    kicker: "DEPLOYMENT AND TURN-BASED COMBAT",
    unlocked: always,
    sections: [{
      paragraphs: [
        "Choose available party members. Place them on deployment tiles. Start the battle. To complete the battle, defeat every enemy.",
        "Combat is turn-based. Movement, basic attacks, secondary attacks, and passes consume a turn. The right panel shows party HP, the current story, and the attack log.",
        "Auto mode chooses actions for the party. For manual control, turn auto mode off.",
      ],
    }],
  },
  {
    id: "stats",
    group: "basics",
    title: "Stats",
    kicker: "CORE CHARACTER ATTRIBUTES",
    unlocked: always,
    sections: [
      {
        title: "The eight stats",
        paragraphs: [],
        items: [
          { label: "HP", text: "HP is the damage that a unit can take. At 0 HP, the unit is defeated." },
          { label: "Stamina", text: "Some activities consume Stamina. A member leaves an activity at 0 Stamina." },
          { label: "Attack", text: "Attack increases physical attack damage." },
          { label: "Defense", text: "Defense decreases damage from physical attacks." },
          { label: "Sp. Attack", text: "Sp. Attack increases special attack damage." },
          { label: "Sp. Defense", text: "Sp. Defense decreases damage from special attacks." },
          { label: "Speed", text: "Speed controls how soon a unit gets its next turn." },
          { label: "Luck", text: "Luck improves the random rewards and outcomes that use Luck." },
        ],
      },
      {
        title: "Other combat values",
        paragraphs: [],
        items: [
          { label: "Range", text: "Range is the number of tiles that a basic attack can reach. Weapons and character type can change it." },
        ],
      },
    ],
  },
  {
    id: "activities",
    group: "basics",
    title: "Activities & Recovery",
    kicker: "ASSIGNMENTS AND PASSIVE RECOVERY",
    unlocked: always,
    sections: [{
      paragraphs: [
        "A party member can do only one activity at a time. An assigned or deployed member is unavailable for other activities.",
        "Every unassigned member restores HP and Stamina, regardless of the open menu. To start automatic recovery, release the member from the current assignment.",
      ],
    }],
  },
  {
    id: "party-equipment",
    group: "party",
    title: "Party & Equipment",
    kicker: "MEMBERS, STATS, AND EQUIPMENT",
    unlocked: always,
    sections: [{
      paragraphs: [
        "The Party screen shows stats, current activity, and equipment for every recruited member.",
        "Equipment changes stats or combat behavior. Weapons control basic attacks and secondary abilities. Before you sell an item, unequip it.",
      ],
    }],
  },
  {
    id: "training",
    group: "party",
    title: "Training",
    kicker: "PERMANENT STAT LEVELS",
    unlocked: (progression) => progression.partyTrainingUnlocked,
    sections: [{
      paragraphs: [
        "Training permanently increases one selected stat for one selected party member. Each level increases the cost of the next level.",
        "Training prices and gold balances are whole numbers. The game rounds fractional balances down.",
      ],
    }],
  },
  {
    id: "shop-inventory",
    group: "party",
    title: "Shop & Inventory",
    kicker: "PURCHASES, SALES, AND CAPACITY",
    unlocked: (progression) => progression.shopUnlocked,
    sections: [{
      paragraphs: [
        "The Shop buys and sells items from unlocked categories. NEW identifies a category with an item that you have not inspected since it appeared.",
        "Inventory has a limit on distinct slots and a separate limit on each stack. Slot upgrades increase the number of distinct stacks. Stack upgrades increase each stack limit.",
      ],
    }],
  },
  {
    id: "potions",
    group: "party",
    title: "Potions",
    kicker: "TIMED PARTY EFFECTS",
    unlocked: (progression) => progression.shopUnlocked,
    sections: [{
      paragraphs: [
        "Consume potions from the Party screen. Their effects apply to the party for a limited time. If you consume another potion of the same level, the timer extends.",
        "When different levels of the same effect overlap, only the stronger value applies.",
      ],
    }],
  },
  {
    id: "adventure",
    group: "adventure",
    title: "Adventure",
    kicker: "EXPLORATION AND RESOURCES",
    unlocked: (progression) => progression.adventureUnlocked,
    sections: [{
      paragraphs: [
        "Choose available party members. Start an expedition. During an expedition, the party can move between rooms, fight enemies, collect materials, use objects, and speak to characters.",
        "The party carries gold that it finds during an expedition. A safe exit adds this gold to the permanent balance. Death removes 30% of that member's collected gold. Stamina exhaustion removes 20%.",
      ],
    }],
  },
  {
    id: "map-quests",
    group: "adventure",
    title: "Map & Quests",
    kicker: "ROOMS, ROUTES, AND OBJECTIVES",
    unlocked: (progression) => progression.adventureUnlocked,
    sections: [{
      paragraphs: [
        "The map records visited rooms and their connections. For a larger view, expand the map.",
        "Quests appear in the order that you obtain them. An active quest shows a marker on the applicable route. Conversation boxes pause the event until you click through all dialogue.",
        "When used within their listed reach, evacuation supplies end the expedition safely. They add carried gold to the permanent balance.",
      ],
    }],
  },
  {
    id: "adventure-automation",
    group: "adventure",
    title: "Automation",
    kicker: "AUTOMATIC MOVEMENT AND COMBAT",
    unlocked: (progression) => progression.adventureUnlocked,
    sections: [{
      paragraphs: [
        "Adventure auto mode chooses movement, targets, and routine interactions. Advanced settings change routing priorities, stopping conditions, portal behavior, and gold handling.",
        "Automation follows the selected settings. Turn it off when you need to make a manual decision.",
      ],
    }],
  },
  {
    id: "fishing",
    group: "fishing",
    title: "Fishing",
    kicker: "BAIT, CATCHES, AND ASSIGNMENTS",
    unlocked: (progression) => progression.fishingRod,
    sections: [{
      paragraphs: [
        "Assign an available party member. Select bait from inventory. Bait controls catch probability. It can change what the pool produces.",
        "Fishing consumes ordinary bait at the start. It does not consume reusable bait. Auto fishing repeats casts until no bait remains or you stop the activity.",
      ],
    }],
  },
  {
    id: "fish",
    group: "fishing",
    title: "Fish & Tackle",
    kicker: "PERMANENT BONUSES AND CATCH WEIGHTS",
    unlocked: (progression) => progression.fishingRod,
    sections: [{
      paragraphs: [
        "You can sell fish or feed them to party members. Feeding a fish permanently increases the associated stat, up to the current feeding limit.",
        "Fishing equipment can change catch behavior or favor one family of fish. Favoring changes the distribution of successful catches. It does not increase the total catch probability.",
      ],
    }],
  },
  {
    id: "mining",
    group: "workshop",
    title: "Mining",
    kicker: "EXCAVATION AND AUTOMATION",
    unlocked: (progression) => progression.miningUnlocked,
    sections: [{
      paragraphs: [
        "Assign an available member. Excavate rock connected to the cleared area. Rock can contain materials, enemies, keys, or passages. Most early rocks are empty.",
        "Auto mining selects reachable frontier tiles. For recovery or another activity, stop mining to release the member.",
      ],
    }],
  },
  {
    id: "crafting",
    group: "workshop",
    title: "Crafting",
    kicker: "MATERIAL PATTERNS AND OUTPUTS",
    unlocked: (progression) => progression.craftingUnlocked,
    sections: [{
      paragraphs: [
        "Place materials into the 4 × 4 grid. Recipes match the entire arrangement, including empty spaces.",
        "A known recipe shows its output when the grid matches it. Crafting consumes the placed materials. It adds the completed item to inventory.",
      ],
    }],
  },
  {
    id: "bestiary",
    group: "records",
    title: "Bestiary",
    kicker: "DISCOVERED ENEMIES AND STATS",
    unlocked: (progression) => progression.completedRaids.includes(7),
    sections: [{
      paragraphs: [
        "The Bestiary records defeated enemies. To inspect a portrait, description, and combat stats, move the pointer over an entry.",
        "Only defeated enemies appear.",
      ],
    }],
  },
];

export function unlockedHelpEntries(progression: ProgressionState): HelpEntry[] {
  return HELP_ENTRIES.filter((entry) => entry.unlocked(progression));
}

export function unlockedHelpSections(
  entry: HelpEntry,
  _progression: ProgressionState,
): HelpSection[] {
  return [...entry.sections];
}

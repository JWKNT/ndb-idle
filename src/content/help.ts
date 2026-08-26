import type { ProgressionState } from "@/game/progression";

export type HelpGroupId = "basics" | "party" | "adventure" | "fishing" | "workshop" | "records";

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
          { label: "Space", text: "Use a basic attack on an enemy in range. If none is available, pass the turn." },
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
        "Choose available party members, place them on deployment tiles, and start the battle. "
          + "Defeat every enemy to clear it.",
        "Combat is turn-based. Movement, basic attacks, secondary attacks, and passing consume a "
          + "turn. The right panel keeps party HP, the current story, and a factual attack log.",
        "Auto mode chooses actions for the party. Turn it off whenever you want to act manually.",
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
          { label: "HP", text: "How much damage a unit can take. At 0 HP, the unit is defeated." },
          { label: "Stamina", text: "Spent by certain activities. A member leaves an activity at 0." },
          { label: "Attack", text: "Raises damage dealt by physical attacks." },
          { label: "Defense", text: "Reduces damage received from physical attacks." },
          { label: "Sp. Attack", text: "Raises damage dealt by special attacks." },
          { label: "Sp. Defense", text: "Reduces damage received from special attacks." },
          { label: "Speed", text: "Determines how quickly a unit reaches its next turn." },
          { label: "Luck", text: "Improves applicable random rewards and outcomes." },
        ],
      },
      {
        title: "Other combat values",
        paragraphs: [],
        items: [
          { label: "Range", text: "How many tiles a basic attack can reach. Weapons and character type can change it." },
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
        "A party member can occupy only one activity at a time. Assigning or deploying a member "
          + "makes them unavailable elsewhere.",
        "Every unassigned member restores HP and Stamina no matter which menu is open. Release the "
          + "member from their current assignment and recovery begins automatically.",
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
        "Equipment changes stats or combat behavior. Weapons control basic attacks and secondary "
          + "abilities. Unequip an item before selling it.",
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
        "Training permanently raises one chosen stat for one chosen party member. Each level makes "
          + "the next level more expensive.",
        "Training prices and gold balances are whole numbers. Fractional balances are rounded down.",
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
        "The Shop buys and sells whatever categories have been unlocked. NEW marks a category with "
          + "something you have not inspected since it appeared.",
        "Inventory has a limit on distinct slots and a separate limit on each stack. Slot upgrades "
          + "increase the number of distinct stacks. Stack upgrades increase each stack limit.",
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
        "Consume potions from the Party screen. Their effects apply to the party for a limited time. "
          + "Using the same level again extends the timer.",
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
        "Choose available party members and begin an expedition. Move between rooms, fight enemies, "
          + "collect materials, interact with objects, and speak to characters.",
        "Gold found during an expedition is carried rather than banked. It becomes permanent when the "
          + "party exits safely. Death removes 30% of that member's collected gold; stamina exhaustion "
          + "removes 20%.",
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
        "The map records visited rooms and the passages connecting them. Expand it for a larger view.",
        "Quests appear in the order obtained. Activating one places its marker on the relevant route. "
          + "Conversation boxes pause the event until their dialogue is clicked through.",
        "Evacuation supplies end the expedition safely and bank carried gold when used within their "
          + "listed reach.",
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
        "Adventure auto mode chooses movement, targets, and routine interactions. Advanced settings "
          + "change routing priorities, stopping conditions, portal behavior, and gold handling.",
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
        "Assign an available party member and select bait currently held in inventory. Bait controls "
          + "catch chance and can change what the pool produces.",
        "Ordinary bait is consumed when fishing begins. Reusable bait is not. Auto fishing repeats "
          + "casts until bait is depleted or you stop the activity.",
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
        "Fish can be sold or fed to party members. Feeding permanently raises the stat associated with "
          + "that fish until the current feeding limit is reached.",
        "Fishing equipment can change catch behavior or favor one family of fish. Favoring redistributes "
          + "successful catches; it does not increase the total chance of catching something.",
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
        "Assign an available member and excavate rock connected to the cleared area. Rock can contain "
          + "materials, enemies, keys, or passages. Most early rocks are empty.",
        "Auto mining selects reachable frontier tiles. Stop mining to release the assigned member for "
          + "recovery or another activity.",
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
        "Place materials into the 4 × 4 grid. Recipes match the entire arrangement, including empty "
          + "spaces.",
        "A matching known recipe displays its output. Crafting consumes the placed materials and adds "
          + "the completed item to inventory.",
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
        "Defeated enemies are recorded in the Bestiary. Hover an entry to inspect its portrait, "
          + "description, and combat stats.",
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

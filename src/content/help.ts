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
    kicker: "THE COMPLETE LIST OF BUTTON CONSEQUENCES",
    unlocked: always,
    sections: [
      {
        title: "Keyboard",
        paragraphs: [],
        items: [
          { label: "WASD / Arrows", text: "Move the active character one tile." },
          { label: "Space", text: "Use a basic attack in range. If nothing qualifies, pass the turn with dignity." },
          { label: "Q", text: "Toggle auto mode for the current activity." },
          { label: "Escape", text: "Close an open Help or conversation-style overlay." },
        ],
      },
      {
        title: "Mouse",
        paragraphs: [],
        items: [
          { label: "Left-click", text: "Move, interact, or use the basic attack. The normal click for normal crimes." },
          { label: "Right-click", text: "Use the equipped weapon's secondary attack on the chosen tile." },
        ],
      },
    ],
  },
  {
    id: "combat",
    group: "basics",
    title: "Battles",
    kicker: "DEPLOY SMALL EMPLOYEE, RECEIVE LARGE OUTCOME",
    unlocked: always,
    sections: [{
      paragraphs: [
        "Choose available party members, place them on deployment tiles, and start the battle. "
          + "Defeat every enemy to clear it. This is the full diplomatic process.",
        "Combat is turn-based. Movement, basic attacks, secondary attacks, and passing consume a "
          + "turn. The right panel keeps party HP, the current story, and a factual attack log.",
        "Auto mode chooses actions for the party. Turn it off whenever the machine begins expressing "
          + "a tactical opinion you did not authorize.",
      ],
    }],
  },
  {
    id: "stats",
    group: "basics",
    title: "Stats",
    kicker: "EIGHT NUMBERS WEARING DIFFERENT HATS",
    unlocked: always,
    sections: [
      {
        title: "The eight stats",
        paragraphs: [],
        items: [
          { label: "HP", text: "How much character remains. At 0, deployment privileges are temporarily revoked." },
          { label: "Stamina", text: "The action budget. Attacking and other strenuous decisions spend it." },
          { label: "Attack", text: "Raises damage dealt by physical attacks." },
          { label: "Defense", text: "Reduces damage received from physical attacks." },
          { label: "Sp. Attack", text: "Raises damage dealt by special attacks, now with a more expensive abbreviation." },
          { label: "Sp. Defense", text: "Reduces damage received from special attacks." },
          { label: "Speed", text: "Determines how quickly a unit reaches its next turn." },
          { label: "Luck", text: "Leans on random outcomes until they become marginally less random." },
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
    kicker: "ONE PERSON MAY HAVE ONE CURRENT DISASTER",
    unlocked: always,
    sections: [{
      paragraphs: [
        "A party member can occupy only one activity at a time. Assigning or deploying somebody "
          + "makes them unavailable everywhere else. The labor board finally won something.",
        "Every unassigned member restores HP and Stamina no matter which menu is open. Release the "
          + "member from their current assignment and recovery begins automatically.",
      ],
    }],
  },
  {
    id: "party-equipment",
    group: "party",
    title: "Party & Equipment",
    kicker: "PUT OBJECT ON PERSON, OBSERVE NUMBER",
    unlocked: always,
    sections: [{
      paragraphs: [
        "The Party screen shows stats, current activity, and equipment for every recruited member.",
        "Equipment changes stats or combat behavior. Weapons control basic attacks and secondary "
          + "abilities. An equipped item must be removed before it can be sold, because the shop has "
          + "one boundary and this is it.",
      ],
    }],
  },
  {
    id: "training",
    group: "party",
    title: "Training",
    kicker: "INSERT GOLD DIRECTLY INTO BICEP",
    unlocked: (progression) => progression.partyTrainingUnlocked,
    sections: [{
      paragraphs: [
        "Training permanently raises one chosen stat for one chosen party member. Each level makes "
          + "the next level more expensive, as required by the International Staircase Agreement.",
        "Training prices and remaining gold are whole numbers. Fractional gold is rounded down and "
          + "returned to the concept mine from which it escaped.",
      ],
    }],
  },
  {
    id: "shop-inventory",
    group: "party",
    title: "Shop & Inventory",
    kicker: "BUY RECTANGLE, STORE RECTANGLE, SELL RECTANGLE",
    unlocked: (progression) => progression.shopUnlocked,
    sections: [{
      paragraphs: [
        "The Shop buys and sells whatever categories have been unlocked. NEW marks a category with "
          + "something you have not inspected since it appeared.",
        "Inventory has a limit on distinct slots and a separate limit on each stack. Slot upgrades "
          + "increase how many kinds of nonsense fit. Stack upgrades increase how much identical "
          + "nonsense fits in one kind.",
      ],
    }],
  },
  {
    id: "potions",
    group: "party",
    title: "Potions",
    kicker: "TEMPORARY NUMBERS, PERMANENTLY IN A BOTTLE",
    unlocked: (progression) => progression.shopUnlocked,
    sections: [{
      paragraphs: [
        "Consume potions from the Party screen. Their effects apply to the party for a limited time. "
          + "Using the same level again extends the timer.",
        "When different levels of the same effect overlap, the stronger value applies. The weaker "
          + "potion remains active in spirit and billing history.",
      ],
    }],
  },
  {
    id: "adventure",
    group: "adventure",
    title: "Adventure",
    kicker: "LEAVE BUILDING, ENTER WORSE BUILDING",
    unlocked: (progression) => progression.adventureUnlocked,
    sections: [{
      paragraphs: [
        "Choose available party members and begin an expedition. Move between rooms, fight enemies, "
          + "collect materials, interact with objects, and speak to people who have mistaken you for "
          + "someone capable.",
        "Gold found during an expedition is carried rather than banked. It becomes permanent when the "
          + "party exits safely and disappears if the expedition is defeated.",
      ],
    }],
  },
  {
    id: "map-quests",
    group: "adventure",
    title: "Map & Quests",
    kicker: "RECTANGLES KNOWN, PROBLEMS CATALOGUED",
    unlocked: (progression) => progression.adventureUnlocked,
    sections: [{
      paragraphs: [
        "The map records visited rooms and the passages connecting them. Expand it when you need the "
          + "large version of exactly the same rectangles.",
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
    kicker: "THE COMPUTER HAS VOLUNTEERED YOU",
    unlocked: (progression) => progression.adventureUnlocked,
    sections: [{
      paragraphs: [
        "Adventure auto mode chooses movement, targets, and routine interactions. Advanced settings "
          + "change routing priorities, stopping conditions, portal behavior, and gold handling.",
        "Automation follows settings; it does not understand hopes, subtext, or the face you are making "
          + "at the screen. Turn it off for a specific manual decision.",
      ],
    }],
  },
  {
    id: "fishing",
    group: "fishing",
    title: "Fishing",
    kicker: "ASSIGN PERSON TO STARE PRODUCTIVELY AT WATER",
    unlocked: (progression) => progression.fishingRod,
    sections: [{
      paragraphs: [
        "Assign an available party member and select bait currently held in inventory. Bait controls "
          + "catch chance and can change what the pool produces.",
        "Ordinary bait is consumed when fishing begins. Reusable bait is not. Auto fishing repeats "
          + "casts until bait is depleted or you stop the activity, whichever humiliates the fish first.",
      ],
    }],
  },
  {
    id: "fish",
    group: "fishing",
    title: "Fish & Tackle",
    kicker: "THE FOOD IS ALSO CHARACTER DEVELOPMENT",
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
    kicker: "REMOVE CAVE UNTIL CAVE CONTAINS PROGRESS",
    unlocked: (progression) => progression.miningUnlocked,
    sections: [{
      paragraphs: [
        "Assign an available member and excavate rock connected to the cleared area. Rock can contain "
          + "materials, enemies, keys, or passages, although most early rock achieves the difficult "
          + "professional standard of being rock.",
        "Auto mining selects reachable frontier tiles. Stop mining to release the assigned member for "
          + "recovery or another activity.",
      ],
    }],
  },
  {
    id: "crafting",
    group: "workshop",
    title: "Crafting",
    kicker: "FOUR BY FOUR MATERIAL SUDOKU WITHOUT THE NUMBERS",
    unlocked: (progression) => progression.craftingUnlocked,
    sections: [{
      paragraphs: [
        "Place materials into the 4 × 4 grid. Recipes match the entire arrangement, including empty "
          + "spaces. Empty space has unionized and must now be treated as part of the pattern.",
        "A matching known recipe displays its output. Crafting consumes the placed materials and adds "
          + "the completed item to inventory.",
      ],
    }],
  },
  {
    id: "bestiary",
    group: "records",
    title: "Bestiary",
    kicker: "FORMAL ARCHIVE OF THINGS THAT BIT YOU",
    unlocked: (progression) => progression.completedRaids.includes(7),
    sections: [{
      paragraphs: [
        "Defeated enemies are recorded in the Bestiary. Hover an entry to inspect its portrait, "
          + "description, and combat stats.",
        "Only discovered enemies appear. The Bestiary refuses to spoil future wildlife and has made "
          + "this its sole ethical position.",
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

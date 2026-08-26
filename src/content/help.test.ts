import { describe, expect, it } from "vitest";
import { defaultProgression } from "@/game/progression";
import { unlockedHelpEntries } from "./help";

describe("progress-aware help index", () => {
  it("keeps undiscovered systems out of a fresh file", () => {
    const entries = unlockedHelpEntries(defaultProgression());
    const titles = entries.map((entry) => entry.title);
    const visibleCopy = entries
      .flatMap((entry) => entry.sections)
      .flatMap((section) => section.paragraphs)
      .join(" ");

    expect(titles).toContain("Controls");
    expect(titles).toContain("Battles");
    expect(titles).toContain("Stats");
    expect(titles).not.toContain("Fishing & Bait");
    expect(titles).not.toContain("Mining");
    expect(titles).not.toContain("Crafting");
    expect(visibleCopy).not.toMatch(/Adventure|Fishing|Mining|Crafting/);
  });

  it("adds mechanics as their discoveries and milestones are reached", () => {
    const freshCount = unlockedHelpEntries(defaultProgression()).length;
    const progression = {
      ...defaultProgression(),
      completedRaids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      adventureUnlocked: true,
      shopUnlocked: true,
      fishingRod: true,
      waterDungeonVisits: 1,
      weaponThrowUnlocked: true,
      blacksmithDiscovered: true,
      miningUnlocked: true,
      craftingUnlocked: true,
      oddityBrewerDiscovered: true,
      cartographerDiscovered: true,
      anglerDiscovered: true,
      potionmasterDiscovered: true,
      forgeDungeonVisited: true,
      towerQuestAvailable: true,
    };
    const titles = unlockedHelpEntries(progression).map((entry) => entry.title);

    expect(titles.length).toBeGreaterThan(freshCount);
    expect(titles).toEqual(expect.arrayContaining([
      "Fishing",
      "Bestiary",
      "Potions",
      "Mining",
      "Crafting",
    ]));
    expect(titles).not.toContain("Tower Key");
    expect(titles).not.toContain("Blacksmith");
    expect(titles).not.toContain("Special Rooms");
    expect(titles).not.toContain("The Forge");
  });

  it("lists every core stat separately", () => {
    const stats = unlockedHelpEntries(defaultProgression())
      .find((entry) => entry.id === "stats")!;
    const labels = stats.sections.flatMap((section) => section.items?.map((item) => item.label) ?? []);

    expect(labels).toEqual(expect.arrayContaining([
      "HP",
      "Stamina",
      "Attack",
      "Defense",
      "Sp. Attack",
      "Sp. Defense",
      "Speed",
      "Luck",
    ]));
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HELP_ENTRIES } from "./help";
import { levels } from "./levels";
import { quests } from "./quests";
import { battleRewardPopups } from "@/features/battle/battleRewards";

const JOKE_LEAK = /\b(?:murder|stupid|walnut|screaming|gross|hoarder|bravely|laughs?|smug|forehead|suffering|creepy|garbage|limbs?|socks|legal(?:ly)?|freaks?|butt|organs?|horrible|worrying|pudding|doorknob|gaslight)\b/i;

describe("informational copy", () => {
  it("keeps Help factual and free of joke copy", () => {
    const copy = HELP_ENTRIES.flatMap((entry) => [
      entry.title,
      entry.kicker,
      ...entry.sections.flatMap((section) => [
        section.title ?? "",
        ...section.paragraphs,
        ...(section.items ?? []).flatMap((item) => [item.label, item.text]),
      ]),
    ]).join(" ");

    expect(copy).not.toMatch(JOKE_LEAK);
    expect(copy).not.toContain("!");
  });

  it("keeps Battle, quest, and reward summaries concise and factual", () => {
    const copy = [
      ...levels.map((level) => level.description),
      ...quests.map((quest) => quest.description),
      ...levels.flatMap((level) => battleRewardPopups(level.number).flatMap((popup) => [
        popup.title,
        popup.description,
      ])),
    ].join(" ");

    expect(copy).not.toMatch(JOKE_LEAK);
    expect(copy).not.toContain("!");
  });

  it("keeps operational source owners free of joke-copy vocabulary", () => {
    const files = [
      new URL("../Game.tsx", import.meta.url),
      new URL("../game/combat.ts", import.meta.url),
      new URL("../game/adventure.ts", import.meta.url),
      new URL("../game/adventure/lottery.ts", import.meta.url),
      new URL("../game/adventure/encounterLocks.ts", import.meta.url),
      new URL("../game/mining/engine.ts", import.meta.url),
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(source).not.toMatch(JOKE_LEAK);
  });
});

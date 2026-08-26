import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enemies } from "./enemies";
import { levels } from "./levels";
import {
  BESTIARY_DESCRIPTIONS,
  STORY_DIALOGUE,
  battleStory,
  bestiaryDescription,
  conversation,
} from "./story-dialogue";

describe("story and dialogue", () => {
  it("keeps one pre-battle story for each of the first ten Battles", () => {
    expect(Object.keys(STORY_DIALOGUE.battles)).toHaveLength(10);
    for (const level of levels) {
      const passage = battleStory(level.number)?.lines.map((line) => line.text).join(" ") ?? "";
      expect(passage.length, `Battle ${level.number}`).toBeGreaterThanOrEqual(350);
      expect(passage.length, `Battle ${level.number}`).toBeLessThanOrEqual(475);
      expect(passage, `Battle ${level.number}`).not.toMatch(
        /\b(?:buy|equip|right-click|left-click|target|kill first|get behind|use ranged)\b/i,
      );
    }
  });

  it("keeps the centralized prose readable in source", () => {
    const source = readFileSync(new URL("./story-dialogue.ts", import.meta.url), "utf8");
    const longestLine = Math.max(...source.split("\n").map((line) => line.length));
    expect(longestLine).toBeLessThanOrEqual(110);
  });

  it("keeps supporting mob names out of the pre-battle stories", () => {
    const passages = Object.values(STORY_DIALOGUE.battles)
      .flatMap((story) => story.lines.map((line) => line.text))
      .join(" ");
    const supportingMobNames = [
      "Skeleton (?:Giraffe|Hippo|Rhino|Brachiosaurus)",
      "Goblin Archers?",
      "Alligators?",
      "Fire Ants?",
      "Dragonfl(?:y|ies)",
      "Bees?",
      "Squid (?:Knights?|Tentacles?)",
      "Ooze Guardians?",
      "Barnacle Drones?",
      "Brine Dynamo",
    ].join("|");
    expect(passages).not.toMatch(new RegExp(`\\b(?:${supportingMobNames})\\b`, "i"));
  });

  it("keeps every progression conversation complete and editable here", () => {
    expect(Object.keys(STORY_DIALOGUE.conversations)).toHaveLength(12);
    for (const [id, beats] of Object.entries(STORY_DIALOGUE.conversations)) {
      expect(beats.length, id).toBeGreaterThan(0);
      for (const beat of beats) {
        expect(beat.speaker.trim().length, id).toBeGreaterThan(0);
        expect(beat.text.trim().length, id).toBeGreaterThan(0);
        expect(beat.sprite, id).toBeTruthy();
      }
    }
    expect(conversation("shopkeeper-rescued")[0].speaker).toBe("Lost Adventurer");

    const visibleDialogue = [
      ...Object.values(STORY_DIALOGUE.battles).flatMap((story) => story.lines.map((line) => line.text)),
      ...Object.values(STORY_DIALOGUE.conversations).flatMap((beats) => beats.map((beat) => beat.text)),
      STORY_DIALOGUE.npcs.angler,
      STORY_DIALOGUE.npcs.potionmaster,
      STORY_DIALOGUE.npcs.charles,
      STORY_DIALOGUE.npcs.shopkeeper,
      STORY_DIALOGUE.npcs.cartographer.surveying(1, 3),
      STORY_DIALOGUE.npcs.cartographer.complete,
    ].join(" ");
    expect(visibleDialogue).not.toMatch(/\b(?:zone|depth)s?\b/i);
  });

  it("keeps one hover description for every enemy definition", () => {
    expect(Object.keys(BESTIARY_DESCRIPTIONS).sort()).toEqual(Object.keys(enemies).sort());
    for (const enemyId of Object.keys(enemies)) {
      const description = bestiaryDescription(enemyId);
      expect(description.length, enemyId).toBeGreaterThan(40);
      expect(description, enemyId).not.toMatch(/\b(?:hp|damage|loot|drops?|gold|materials?|tiles?|turns?|right-click|equip|unlock)\b/i);
    }
  });
});

import { describe, expect, it } from "vitest";
import { levels } from "@/content/levels";
import { battleRewardPopup } from "./battleRewards";

describe("Battle victory popups", () => {
  it("shows a defeated popup for every Battle in the chapter", () => {
    for (const level of levels) {
      const popup = battleRewardPopup(level.number);
      expect(popup.title).toBe(`Defeated ${level.name}`);
      expect(popup.description).not.toContain("The enemy pile has become taller and less reasonable.");
    }
  });

  it("keeps a reward-free victory popup concise", () => {
    expect(battleRewardPopup(2).description).toBe("");
  });

  it("keeps the Battle 3 captive's identity secret", () => {
    const popup = battleRewardPopup(3);
    expect(popup.description).toContain("Quest obtained: Lost Adventurer.");
    expect(popup.description).not.toContain("Shopkeeper");
  });

  it("keeps the Battle 5 lost item secret", () => {
    const popup = battleRewardPopup(5);
    expect(popup.description).toBe("Quest unlocked: Retrieve Lost Item.");
    expect(popup.description).not.toMatch(/fishing|rod/i);
  });
});

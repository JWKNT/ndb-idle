import { describe, expect, it } from "vitest";
import { levels } from "@/content/levels";
import { battleRewardPopups } from "./battleRewards";

describe("Battle victory popups", () => {
  it("shows a defeated popup for every Battle", () => {
    for (const level of levels) {
      const popup = battleRewardPopups(level.number)[0];
      expect(popup.title).toBe(`Defeated ${level.name}`);
      expect(popup.description).not.toContain("The enemy pile has become taller and less reasonable.");
    }
  });

  it("keeps a reward-free victory popup concise", () => {
    expect(battleRewardPopups(2)).toHaveLength(1);
    expect(battleRewardPopups(2)[0].description).toBe("");
  });

  it("uses the awarded object's sprite on each reward step", () => {
    expect(battleRewardPopups(1)[1]).toMatchObject({ title: "Lowering Rope obtained", sprite: "loweringRope" });
    expect(battleRewardPopups(6)[1]).toMatchObject({ title: "Shaman's Ring obtained", sprite: "gearShamanRing" });
    expect(battleRewardPopups(7)[1]).toMatchObject({ title: "Bestiary obtained", sprite: "bestiary" });
    expect(battleRewardPopups(8)[1]).toMatchObject({ title: "Rotten Tentacle obtained", sprite: "rottenTentacle" });
    expect(battleRewardPopups(9)[1]).toMatchObject({ title: "Suction Cups obtained", sprite: "gearSuctionCups" });
    expect(battleRewardPopups(10)[1]).toMatchObject({ title: "Rusty Gear obtained", sprite: "rustyGear" });
  });

  it("keeps the Battle 3 captive's identity secret", () => {
    const popup = battleRewardPopups(3)[1];
    expect(popup.title).toBe("Quest obtained: Lost Adventurer");
    expect(`${popup.title} ${popup.description}`).not.toContain("Shopkeeper");
  });

  it("keeps the Battle 5 lost item secret", () => {
    const popup = battleRewardPopups(5)[1];
    expect(popup.title).toBe("Quest unlocked: Retrieve Lost Item");
    expect(`${popup.title} ${popup.description}`).not.toMatch(/fishing|rod/i);
  });
});

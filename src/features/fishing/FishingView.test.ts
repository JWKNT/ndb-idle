import { describe, expect, it } from "vitest";
import { defaultProgression } from "@/game/progression";
import { availableFishingBaitIds } from "./FishingView";

describe("Fishing bait choices", () => {
  it("includes only bait currently held in inventory", () => {
    const materials = {
      ...defaultProgression().materials,
      "rat-pelt": 0,
      "ant-chitin": 12,
      "ink-sac": 3,
      "fire-alligator-hide": 0,
      "rotten-tentacle": 0,
      "magic-bait": 0,
    };

    expect(availableFishingBaitIds(materials)).toEqual(["ant-chitin", "ink-sac"]);
  });
});

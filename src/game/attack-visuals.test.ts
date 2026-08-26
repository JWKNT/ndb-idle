import { describe, expect, it } from "vitest";
import { playerBasicAttackVisual } from "./attack-visuals";
import { WEAPON_SKILLS } from "./weapon-skills";

describe("attack visuals", () => {
  it("gives every party member a distinct basic-attack signature", () => {
    expect(playerBasicAttackVisual("knight")).toBe("knight-slash");
    expect(playerBasicAttackVisual("worm")).toBe("worm-acid");
    expect(playerBasicAttackVisual("miner")).toBe("miner-pick");
  });

  it("gives every equippable weapon family a distinct secondary signature", () => {
    const visuals = Object.values(WEAPON_SKILLS).map((skill) => skill.visual);
    expect(new Set(visuals).size).toBe(visuals.length);
  });
});

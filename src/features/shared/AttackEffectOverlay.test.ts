import { describe, expect, it } from "vitest";
import {
  attackEffectAreaBounds,
  attackEffectUsesProjectile,
} from "./AttackEffectOverlay";

describe("attack effect geometry", () => {
  it("renders a sweep as one 3 by 3 effect centered on the attacker", () => {
    expect(attackEffectAreaBounds("sword-sweep", { x: 4, y: 5 }, { x: 5, y: 5 }))
      .toEqual({ x: 3, y: 4, width: 3, height: 3 });
  });

  it("renders heavy slam as one directional 3 by 2 effect", () => {
    expect(attackEffectAreaBounds("heavy-slam", { x: 4, y: 5 }, { x: 4, y: 3 }))
      .toEqual({ x: 3, y: 3, width: 3, height: 2 });
    expect(attackEffectAreaBounds("heavy-slam", { x: 4, y: 5 }, { x: 6, y: 5 }))
      .toEqual({ x: 5, y: 4, width: 2, height: 3 });
  });

  it("centers a burst once on its impact tile", () => {
    expect(attackEffectAreaBounds("burst-orb", { x: 1, y: 1 }, { x: 5, y: 6 }))
      .toEqual({ x: 4, y: 5, width: 3, height: 3 });
  });

  it("only treats a generic physical attack as a projectile at range", () => {
    expect(attackEffectUsesProjectile("physical", { x: 1, y: 1 }, { x: 2, y: 1 })).toBe(false);
    expect(attackEffectUsesProjectile("physical", { x: 1, y: 1 }, { x: 4, y: 1 })).toBe(true);
    expect(attackEffectUsesProjectile("trident-throw", { x: 1, y: 1 }, { x: 2, y: 1 })).toBe(true);
  });
});

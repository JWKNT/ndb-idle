import { describe, expect, it } from "vitest";
import { createTreasureRoomTiles } from "../content/adventure-rooms/treasure-room";
import { createRingGear, createShamanRingGear, createSuctionCupsGear, createTridentGear, treasureGearSlot } from "./gear";
import { addGear, defaultProgression, equipGear, memberEquipment, memberMaxHp } from "./progression";

describe("treasure gear", () => {
  it("uses a peaceful pre-made room with a center chest", () => {
    const tiles = createTreasureRoomTiles();
    expect(tiles).toHaveLength(9);
    expect(tiles.every((row) => row.length === 9)).toBe(true);
    expect(tiles[4][4].kind).toBe("treasureChest");
    expect(tiles.flat().some((tile) => tile.kind === "enemy" || tile.kind === "trap")).toBe(false);

    const disguised = createTreasureRoomTiles(true);
    expect(disguised[4][4]).toMatchObject({
      kind: "treasureChest",
      mimicDisguise: true,
    });
  });

  it("reproduces stats for the same slot and ring", () => {
    const first = createRingGear("helmet", 1, "first-room");
    const second = createRingGear("helmet", 1, "second-room");
    const stronger = createRingGear("helmet", 2, "third-room");
    expect(first.name).toBe("Level 1 Helmet");
    expect(first.bonuses).toEqual(second.bonuses);
    expect(stronger.bonuses.hp).toBeGreaterThan(first.bonuses.hp!);
    expect(treasureGearSlot(2, -1, 2)).toBe(treasureGearSlot(2, -1, 2));
  });

  it("adds found gear to inventory and applies it when equipped", () => {
    const state = defaultProgression();
    const item = createRingGear("helmet", 1, "test-room");
    const withItem = addGear(state, item);
    const before = memberMaxHp(withItem, "knight");
    const result = equipGear(withItem, "knight", item.id);
    expect(result.error).toBeUndefined();
    expect(memberEquipment(result.state, "knight").helmet).toBe(item.id);
    expect(memberMaxHp(result.state, "knight").gt(before)).toBe(true);
  });

  it("defines the Tidecaller Trident as a substantially stronger unique sword", () => {
    const trident = createTridentGear();
    const ringTwoSword = createRingGear("sword", 2, "comparison");
    expect(trident.definitionId).toBe("trident");
    expect(trident.slot).toBe("sword");
    expect(trident.bonuses.attack).toBeGreaterThan(ringTwoSword.bonuses.attack!);
  });

  it("defines Shaman's Ring as a unique stat-bearing accessory", () => {
    const ring = createShamanRingGear();
    expect(ring.definitionId).toBe("shaman-ring");
    expect(ring.slot).toBe("accessory");
    expect(ring.bonuses.spAttack).toBeGreaterThan(0);
  });

  it("defines Suction Cups as a two-defense unique accessory", () => {
    const cups = createSuctionCupsGear();
    expect(cups.definitionId).toBe("suction-cups");
    expect(cups.slot).toBe("accessory");
    expect(cups.bonuses.defense).toBeGreaterThan(0);
    expect(cups.bonuses.spDefense).toBeGreaterThan(0);
  });

  it("keeps late weapon techniques out of treasure until Battle 8 is complete", () => {
    const early = Array.from({ length: 40 }, (_, index) =>
      createRingGear("sword", 2, `early-${index}`).weaponAbilityId
    );
    const late = Array.from({ length: 80 }, (_, index) =>
      createRingGear("sword", 3, `late-${index}`, [8]).weaponAbilityId
    );
    expect(new Set(early)).toEqual(new Set(["sweep", "burst-staff"]));
    expect(late).toContain("heavy-slam");
    expect(late).toContain("rapid-staff");
  });
});

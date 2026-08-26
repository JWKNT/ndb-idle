import { describe, expect, it } from "vitest";
import type { AdventureTile, DungeonRoom } from "../game/adventure";
import { adventureFloorTexture } from "./adventure-floor-textures";

const floor: AdventureTile = { kind: "floor" };

function room(ring: number, x: number, y: number): DungeonRoom {
  return {
    key: `${x},${y}`,
    number: 1,
    position: { x, y },
    width: 9,
    height: 9,
    tiles: [[floor]],
    exits: [],
    ring,
    kind: "normal",
    regenUsedBy: [],
  };
}

describe("Adventure floor textures", () => {
  it("uses grass in the unringed starting room", () => {
    const textures = tileTextures(room(0, 0, 0), "earth");
    expect([...textures].every((texture) => texture.startsWith("floorGrass"))).toBe(true);
    expect(textures.size).toBeGreaterThan(1);
  });

  it("uses the dedicated bright sunlight texture for the rope landing", () => {
    expect(adventureFloorTexture(
      room(0, 0, 0),
      { kind: "floor", floorVariant: "sunlight" },
      4,
      4,
      "earth",
    )).toBe("floorGrassSunlight");
  });

  it("uses the former deep textures in ring 1", () => {
    const textures = tileTextures(room(1, 1, 0), "earth");
    expect([...textures].every((texture) => texture.startsWith("floorDeep"))).toBe(true);
    expect(textures.size).toBeGreaterThan(1);
  });

  it("uses three compacted-dirt variants throughout the ring 2 ant nest", () => {
    const textures = tileTextures(room(2, 4, -2), "earth");
    expect(textures).toEqual(new Set(["floorNestA", "floorNestB", "floorNestC"]));
  });

  it("uses the former ring 1 sewer textures in ring 3", () => {
    const textures = tileTextures(room(3, 7, -2), "earth");
    expect([...textures].every((texture) => texture.startsWith("floorSewer"))).toBe(true);
    expect(textures.size).toBeGreaterThan(1);
  });

  it("uses varied volcanic ground throughout ring 4", () => {
    const textures = tileTextures(room(4, 10, -2), "earth");
    expect([...textures].every((texture) => texture.startsWith("floorVolcano"))).toBe(true);
    expect(textures.size).toBeGreaterThan(1);
  });

  it("uses sand throughout the Water Dungeon regardless of ring", () => {
    const textures = tileTextures(room(0, 7, -9), "water");
    expect([...textures].every((texture) => texture.startsWith("floorSand"))).toBe(true);
    expect(textures.size).toBeGreaterThan(1);
  });

  it("textures exits and contents but leaves walls and special 3x3 art alone", () => {
    const currentRoom = room(1, 1, 0);
    expect(adventureFloorTexture(currentRoom, { kind: "exit", exitDirection: "east" }, 8, 4, "earth"))
      .toMatch(/^floorDeep/);
    expect(adventureFloorTexture(currentRoom, { kind: "gold" }, 4, 4, "earth"))
      .toMatch(/^floorDeep/);
    expect(adventureFloorTexture(currentRoom, { kind: "wall" }, 0, 0, "earth")).toBeNull();
    expect(adventureFloorTexture(currentRoom, { kind: "regen" }, 4, 4, "earth")).toBeNull();
    expect(adventureFloorTexture(currentRoom, { kind: "portal" }, 4, 4, "earth")).toBeNull();
  });
});

function tileTextures(currentRoom: DungeonRoom, theme: "earth" | "water"): Set<string> {
  const textures = new Set<string>();
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const texture = adventureFloorTexture(currentRoom, floor, x, y, theme);
      if (texture) textures.add(texture);
    }
  }
  return textures;
}

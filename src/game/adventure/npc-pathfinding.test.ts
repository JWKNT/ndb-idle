import { describe, expect, it } from "vitest";
import type { AdventureTileKind, DungeonRoom } from "./types";
import { cheapestFirstStep } from "./pathfinding";
import { isBlockedTile } from "./tileRules";

const NPC_KINDS: AdventureTileKind[] = [
  "blacksmith",
  "miner",
  "shopkeeper",
  "potionmaster",
  "oddityBrewer",
  "cartographer",
  "angler",
  "rodKeeper",
];

function openRoom(): DungeonRoom {
  return {
    key: "0,0",
    number: 1,
    position: { x: 0, y: 0 },
    width: 5,
    height: 3,
    tiles: Array.from({ length: 3 }, () =>
      Array.from({ length: 5 }, () => ({ kind: "floor" as const }))),
    exits: [],
    ring: 1,
    kind: "normal",
    regenUsedBy: [],
  };
}

describe("Adventure NPC pathfinding", () => {
  it("treats every interactive character as solid scenery", () => {
    for (const kind of NPC_KINDS) expect(isBlockedTile({ kind })).toBe(true);
  });

  it("routes around an NPC instead of trying to walk through it", () => {
    const room = openRoom();
    room.tiles[1][2] = { kind: "cartographer" };

    expect(cheapestFirstStep(room, { x: 1, y: 1 }, [{ x: 3, y: 1 }]))
      .not.toEqual({ x: 2, y: 1 });
  });

  it("can still bump an NPC as the final interaction step", () => {
    const room = openRoom();
    room.tiles[1][2] = { kind: "miner" };

    expect(cheapestFirstStep(room, { x: 1, y: 1 }, [{ x: 2, y: 1 }]))
      .toEqual({ x: 2, y: 1 });
  });
});

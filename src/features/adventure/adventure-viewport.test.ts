import { describe, expect, it } from "vitest";
import { createTowerExteriorRoomTiles, TOWER_EXTERIOR_SIZE } from "@/content/adventure-rooms/tower-exterior-room";
import type { DungeonRoom } from "@/game/adventure/types";
import { adventureViewport } from "./adventure-viewport";

describe("tower exterior camera", () => {
  const room: DungeonRoom = {
    key: "tower-test",
    number: 99,
    position: { x: 50_000, y: 50_000 },
    width: TOWER_EXTERIOR_SIZE,
    height: TOWER_EXTERIOR_SIZE,
    tiles: createTowerExteriorRoomTiles(),
    exits: [{ direction: "south", position: { x: 15, y: 30 } }],
    ring: 5,
    kind: "towerExterior",
    mapHidden: true,
    regenUsedBy: [],
  };

  it("shows only an 11x11 window at the volcanic entrance", () => {
    expect(adventureViewport(room, { x: 15, y: 29 })).toEqual({
      minimumX: 10,
      minimumY: 20,
      width: 11,
      height: 11,
    });
  });

  it("does not reveal the tower until the player advances through the grounds", () => {
    const entranceView = adventureViewport(room, { x: 15, y: 29 });
    const firstVisibleY = entranceView.minimumY;
    expect(room.tiles.slice(firstVisibleY, firstVisibleY + entranceView.height).flat().some(
      (tile) => tile.kind === "towerWall" || tile.kind === "towerDoor",
    )).toBe(false);

    const approachView = adventureViewport(room, { x: 15, y: 13 });
    expect(room.tiles.slice(approachView.minimumY, approachView.minimumY + approachView.height).flat().some(
      (tile) => tile.kind === "towerWall" || tile.kind === "towerDoor",
    )).toBe(true);
  });
});

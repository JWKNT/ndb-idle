import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { knight } from "../content/players/knight";
import { miner } from "../content/players/miner";
import { worm } from "../content/players/worm";
import {
  alligator,
  bee,
  bellowsForgeling,
  chainForgeling,
  dragonfly,
  fireAlligator,
  fireAnt,
  forgeling,
  hammerForgeling,
} from "../content/enemies";
import { createRegenRoomTiles } from "../content/adventure-rooms/regen-room";
import { createOfferingRoomTiles } from "../content/adventure-rooms/offering-room";
import { createLotteryRoomTiles } from "../content/adventure-rooms/lottery-room";
import { createDiceRoomTiles } from "../content/adventure-rooms/dice-room";
import { createHammerVaultRoomTiles } from "../content/adventure-rooms/hammer-vault-room";
import { createPortalRoomTiles } from "../content/adventure-rooms/portal-room";
import { createTowerExteriorDungeonRoom, generateRoom } from "./adventure/roomGeneration";
import {
  createForgeRoomTiles,
  createForgeTreasureRoomTiles,
} from "../content/adventure-rooms/forge-room";
import {
  ADVENTURE_KNIGHT_ID,
  activateHammerQuestAtBlacksmith,
  activateMinerQuestAtBlacksmith,
  addAdventureExplorer,
  allNonWallTilesReachable,
  adventurePartyTurnPreview,
  adventureZoneForPosition,
  adventurePlayerActorId,
  adventureEnemyStats,
  beginCartographerSurvey,
  currentAdventureRoom,
  createAdventureHeadings,
  chooseOfferingStats,
  chooseExitDirections,
  generationChances,
  hazardAvoidChance,
  hasViableUnexploredFrontier,
  hotSpringStaminaRestore,
  enemyKindForRing,
  fireBeamIsActive,
  isAdventurePlayerTurn,
  lotteryEnemyPool,
  moveInAdventure,
  materialForAdventureEnemy,
  openOfferingChamber,
  passAdventureTurn,
  performAdventureEnemyTurn,
  repairAdventureRoomConnectivity,
  repairAdventureFrontier,
  revealChalkArea,
  rollEnemyKindForRoom,
  rollRoomExitCount,
  rollGold,
  ringForPosition,
  shouldPauseAutoForOfferingEntry,
  settleDiceRoomRoll,
  startAdventure,
  startForgeAdventure,
  startWaterAdventure,
  suggestAdventureMove,
  treasureRoomChance,
  waterPortalSpawnChance,
  type AdventureTile,
  type AdventureState,
  type DungeonRoom,
  type ExitDirection,
} from "./adventure";
import {
  advanceAdventureDiceCurse,
  cachePortalDungeonSession,
  createAdventureDiceCurse,
  diceCursedAdventureStats,
  type AdventureSession,
} from "./adventure/session";
import { spinLotteryWheel } from "./adventure/lottery";
import { retireForgeBlueprintObjective } from "./adventure/forgeBlueprints";
import { createRoomRandom } from "./adventure/dungeonSeed";

describe("adventure generation", () => {
  it("does not generate Lottery rooms until Battle 4 is complete", () => {
    const generateLotteryRoll = (completedBattles: number[]) => generateRoom(
      2,
      { x: 1, y: 0 },
      "west",
      {},
      new Decimal(0),
      () => 0.09,
      null,
      "earth",
      null,
      null,
      false,
      false,
      null,
      [],
      completedBattles,
    );

    expect(generateLotteryRoll([1, 2, 3]).kind).not.toBe("lottery");
    expect(generateLotteryRoll([1, 2, 3, 4]).kind).toBe("lottery");
  });

  it("pre-seeds a coordinate so exploration order cannot change its random stream", () => {
    const first = createRoomRandom(12345, { x: 8, y: -3 }, "earth");
    const second = createRoomRandom(12345, { x: 8, y: -3 }, "earth");
    const elsewhere = createRoomRandom(12345, { x: 9, y: -3 }, "earth");
    const firstValues = Array.from({ length: 8 }, () => first());
    expect(Array.from({ length: 8 }, () => second())).toEqual(firstValues);
    expect(Array.from({ length: 8 }, () => elsewhere())).not.toEqual(firstValues);
  });

  it("reveals a full 5x5 map area around the Chalk user", () => {
    const state = revealChalkArea(startAdventure(knight.stats, () => 0.5));
    expect(state.chalkRevealedPositions).toHaveLength(25);
    expect(state.chalkRevealedPositions).toContainEqual({ x: -2, y: -2 });
    expect(state.chalkRevealedPositions).toContainEqual({ x: 2, y: 2 });
    expect(Object.keys(state.chalkMappedExits ?? {})).toHaveLength(25);

    for (const [key, exits] of Object.entries(state.chalkMappedExits ?? {})) {
      const [x, y] = key.split(",").map(Number);
      for (const direction of exits) {
        const offset = direction === "north"
          ? { x: 0, y: -1 }
          : direction === "south"
            ? { x: 0, y: 1 }
            : direction === "west"
              ? { x: -1, y: 0 }
              : { x: 1, y: 0 };
        const opposite = direction === "north"
          ? "south"
          : direction === "south"
            ? "north"
            : direction === "west"
              ? "east"
              : "west";
        expect(state.chalkMappedExits?.[`${x + offset.x},${y + offset.y}`]).toContain(opposite);
      }
    }
  });

  it("repairs one-way tunnels when Chalk overlaps an older mapped area", () => {
    const adventure = startAdventure(knight.stats, () => 0.5);
    const state = revealChalkArea({
      ...adventure,
      chalkRevealedPositions: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      chalkMappedExits: {
        "0,0": ["east"],
        "1,0": [],
      },
    });

    expect(state.chalkMappedExits?.["0,0"]).toContain("east");
    expect(state.chalkMappedExits?.["1,0"]).toContain("west");
    expect(state.rooms["0,0"].exits.some((exit) => exit.direction === "east")).toBe(true);
  });

  it("reserves three reachable Cartographer survey paths before revealing their rooms", () => {
    const state = beginCartographerSurvey(startAdventure(knight.stats, () => 0.5));
    expect(state.cartographerSurveyTargets).toHaveLength(3);
    expect(state.cartographerSurveyPaths).toHaveLength(3);
    expect(state.cartographerSurveyPaths?.every((path) => path.length >= 3)).toBe(true);

    for (const path of state.cartographerSurveyPaths ?? []) {
      for (let index = 0; index < path.length - 1; index += 1) {
        const from = path[index];
        const to = path[index + 1];
        expect(Math.abs(from.x - to.x) + Math.abs(from.y - to.y)).toBe(1);
      }
    }
  });

  it("adds rare Beast-Tamer-strength encounters only after Battle 7", () => {
    expect(rollEnemyKindForRoom(1, [6], () => 0)).toBe("rat");
    expect(rollEnemyKindForRoom(1, [7], () => 0.01)).toBe("dire-rat");
    expect(rollEnemyKindForRoom(2, [7], () => 0.01)).toBe("fire-ant");
    expect(rollEnemyKindForRoom(1, [7], () => 0.06)).toBe("sewer-toad");
    expect(rollEnemyKindForRoom(3, [7], () => 0.01)).toBe("clay-golem");
    expect(materialForAdventureEnemy("dire-rat")).toBe("mutated-rat-tail");
    expect(materialForAdventureEnemy("sewer-toad")).toBe("eye-of-frog");
    expect(materialForAdventureEnemy("fire-ant")).toBe("fire-ant-chitin");
  });

  it("keeps each explorer's last horizontal facing during vertical movement", () => {
    const adventure = startAdventure(knight.stats, () => 0.5);
    const movedLeft = moveInAdventure(
      { ...adventure, activeActorId: ADVENTURE_KNIGHT_ID },
      { x: adventure.playerPosition.x - 1, y: adventure.playerPosition.y },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(movedLeft.state.playerFacing).toBe("left");

    const movedUp = moveInAdventure(
      { ...movedLeft.state, activeActorId: ADVENTURE_KNIGHT_ID },
      { x: movedLeft.state.playerPosition.x, y: movedLeft.state.playerPosition.y - 1 },
      knight.stats,
      movedLeft.hp,
      movedLeft.stamina,
      () => 0.5,
    );
    expect(movedUp.state.playerFacing).toBe("left");
  });

  it.each([[1, 15], [2, 30], [3, 50], [4, 75]])(
    "a depth-%i hot spring restores %i stamina",
    (ring, expected) => expect(hotSpringStaminaRestore(ring)).toBe(expected),
  );

  it("repairs a stored quest tunnel whose border tile lost its exit trigger", () => {
    const currentTiles = Array.from({ length: 9 }, (_, y) =>
      Array.from({ length: 9 }, (_, x): AdventureTile => ({
        kind: x === 0 || y === 0 || x === 8 || y === 8 ? "wall" : "floor",
      })),
    );
    const portalTiles = createPortalRoomTiles("forgePortal");
    // This is the corrupted state seen in live expeditions: both room records
    // advertise the tunnel, so the map draws it, but the edge is ordinary floor.
    currentTiles[0][4] = { kind: "floor" };
    portalTiles[8][4] = { kind: "floor" };
    const currentRoom: DungeonRoom = {
      key: "0,0",
      number: 1,
      position: { x: 0, y: 0 },
      width: 9,
      height: 9,
      tiles: currentTiles,
      exits: [{ direction: "north", position: { x: 4, y: 0 } }],
      ring: 0,
      kind: "normal",
      regenUsedBy: [],
    };
    const forgePortalRoom: DungeonRoom = {
      key: "0,-1",
      number: 2,
      position: { x: 0, y: -1 },
      width: 9,
      height: 9,
      tiles: portalTiles,
      exits: [{ direction: "south", position: { x: 4, y: 8 } }],
      ring: 4,
      kind: "forgePortal",
      regenUsedBy: [],
    };
    const adventure: AdventureState = {
      ...testAdventure(currentRoom, { x: 4, y: 1 }),
      rooms: {
        [currentRoom.key]: currentRoom,
        [forgePortalRoom.key]: forgePortalRoom,
      },
      questTarget: {
        questId: "enter-tower",
        position: forgePortalRoom.position,
        path: [forgePortalRoom.position],
      },
    };

    expect(suggestAdventureMove(adventure, { prioritizeQuest: true })).toEqual({ x: 4, y: 0 });
    const entered = moveInAdventure(
      adventure,
      { x: 4, y: 0 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );

    expect(entered.error).toBeUndefined();
    expect(entered.state.currentRoomKey).toBe(forgePortalRoom.key);
    expect(currentAdventureRoom(entered.state).kind).toBe("forgePortal");
    expect(entered.state.rooms[currentRoom.key].tiles[0][4]).toMatchObject({
      kind: "exit",
      exitDirection: "north",
    });
    expect(entered.state.rooms[forgePortalRoom.key].tiles[8][4]).toMatchObject({
      kind: "exit",
      exitDirection: "south",
    });
  });

  it("builds revisitable Water Dungeon portals as full 3x3 chambers", () => {
    const tiles = createPortalRoomTiles("waterPortal");
    const portalTiles = tiles.flat().filter((tile) => tile.kind === "waterPortal");
    expect(portalTiles).toHaveLength(9);
    expect(new Set(portalTiles.map((tile) => `${tile.portalPartX},${tile.portalPartY}`)).size).toBe(9);
  });

  it("seals Lottery rooms until every gold prize is collected", () => {
    const room = lotteryTestRoom();
    const spun = moveInAdventure(
      {
        ...testAdventure(room, { x: 4, y: 3 }),
        completedBattleNumbers: [2, 6],
      },
      { x: 4, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0,
    );
    const spunRoom = currentAdventureRoom(spun.state);
    expect(spunRoom.lotterySpun).toBe(true);
    expect(spunRoom.lotteryOutcome).toBe("gold");
    expect(spunRoom.lotteryColor).toBe("blue");
    expect(spunRoom.lotteryResolved).toBe(false);
    expect(spunRoom.tiles.flat().filter((tile) => tile.kind === "gold").length).toBeGreaterThan(0);
    expect(spunRoom.tiles.flat().filter((tile) => tile.kind === "lotteryGate")).toHaveLength(2);

    const prizes = spunRoom.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.kind === "gold" && tile.lotteryPrize ? [{ x, y }] : []
    ));
    for (const prize of prizes.slice(0, -1)) spunRoom.tiles[prize.y][prize.x] = { kind: "floor" };
    const finalPrize = prizes.at(-1)!;
    const approach = finalPrize.x > 1
      ? { x: finalPrize.x - 1, y: finalPrize.y }
      : { x: finalPrize.x + 1, y: finalPrize.y };
    spunRoom.tiles[approach.y][approach.x] = { kind: "floor" };
    const collected = moveInAdventure(
      {
        ...spun.state,
        playerPosition: approach,
        activeActorId: ADVENTURE_KNIGHT_ID,
      },
      finalPrize,
      knight.stats,
      spun.hp,
      spun.stamina,
      () => 0,
    );
    const resolvedRoom = currentAdventureRoom(collected.state);
    expect(resolvedRoom.lotteryResolved).toBe(true);
    expect(resolvedRoom.tiles.flat().filter((tile) => tile.kind === "lotteryGate")).toHaveLength(0);
    expect(resolvedRoom.tiles.flat().filter((tile) => tile.kind === "exit")).toHaveLength(2);
    expect(collected.state.log[0]).toMatch(/every gate opened/i);
  });

  it("seals the adjacent side of a locked Lottery-room entrance", () => {
    const lottery = lotteryTestRoom();
    const source = emptyTestRoom(2, { x: 2, y: 1 });
    source.exits = [{ direction: "north", position: { x: 4, y: 0 } }];
    source.tiles[0][4] = { kind: "exit", exitDirection: "north" };
    const adventure: AdventureState = {
      ...testAdventure(source, { x: 4, y: 1 }),
      rooms: { [source.key]: source, [lottery.key]: lottery },
    };

    const entered = moveInAdventure(
      adventure,
      { x: 4, y: 0 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );

    expect(currentAdventureRoom(entered.state).tiles[8][4]).toMatchObject({
      kind: "lotteryGate",
      gateRoomKey: lottery.key,
    });
    expect(entered.state.rooms[source.key].tiles[0][4]).toMatchObject({
      kind: "lotteryGate",
      gateRoomKey: lottery.key,
    });
  });

  it("can summon ring-scaled and previously defeated support enemies from the Lottery wheel", () => {
    const pool = lotteryEnemyPool(2, [2, 6]);
    expect(pool).toEqual(expect.arrayContaining([
      "ant",
      "skeleton-giraffe",
      "skeleton-hippo",
      "goblin",
      "goblin-archer",
    ]));
    expect(pool).not.toContain("skeleton");
    expect(pool).not.toContain("goblin-shaman");
    expect(lotteryEnemyPool(3, [7])).toEqual(expect.arrayContaining([
      "clay-golem",
      "fire-ant",
      "alligator",
      "dragonfly",
      "bee",
    ]));

    const room = lotteryTestRoom();
    const spun = moveInAdventure(
      {
        ...testAdventure(room, { x: 4, y: 3 }),
        completedBattleNumbers: [6],
      },
      { x: 4, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );
    const spunRoom = currentAdventureRoom(spun.state);
    expect(spunRoom.lotteryOutcome).toBe("enemies");
    expect(spunRoom.lotteryColor).toBe("red");
    expect(spunRoom.tiles.flat().filter((tile) => tile.kind === "enemy").length).toBeGreaterThan(0);
    expect(spunRoom.tiles.flat().filter((tile) => tile.kind === "enemy").every((tile) =>
      tile.enemyKind === "goblin-archer"
    )).toBe(true);
    expect(spunRoom.lotteryResolved).toBe(false);
    expect(spunRoom.tiles.flat().filter((tile) => tile.kind === "lotteryGate")).toHaveLength(2);
  });

  it("summons Lottery Alligators as one shared-health 2x1 creature", () => {
    const room = lotteryTestRoom();
    room.ring = 3;
    let randomCalls = 0;
    spinLotteryWheel(
      room,
      new Decimal(0),
      [7],
      () => randomCalls++ === 0 ? 0.99 : 0.45,
    );

    const alligatorTiles = room.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.kind === "enemy" && tile.enemyKind === "alligator"
        ? [{ tile, x, y }]
        : []
    ));
    const byId = alligatorTiles.reduce<Record<string, typeof alligatorTiles>>((groups, part) => {
      const id = part.tile.enemyId ?? "missing";
      (groups[id] ??= []).push(part);
      return groups;
    }, {});

    expect(alligatorTiles.length).toBeGreaterThan(0);
    expect(Object.values(byId).every((parts) =>
      parts.length === 2
      && parts[0].y === parts[1].y
      && Math.abs(parts[0].x - parts[1].x) === 1
      && new Set(parts.map(({ tile }) => tile.enemyPart)).size === 2
      && parts[0].tile.enemyHp?.eq(parts[1].tile.enemyHp ?? 0)
    )).toBe(true);
  });

  it("chooses four distinct shrine fish with a strong inventory preference", () => {
    const unweighted = chooseOfferingStats({}, () => 0.5);
    const weighted = chooseOfferingStats({ luck: 1 }, () => 0.5);
    expect(unweighted).toHaveLength(4);
    expect(new Set(unweighted).size).toBe(4);
    expect(unweighted).not.toContain("luck");
    expect(weighted).toContain("luck");
  });

  it("uses Luck to increase each gold pickup without generating more gold tiles", () => {
    const low = generationChances(new Decimal(0), 3);
    const high = generationChances(new Decimal(20), 3);
    expect(high.gold).toBe(low.gold);
    expect(high.trap).toBeLessThan(low.trap);
    expect(hazardAvoidChance(new Decimal(20))).toBeGreaterThan(hazardAvoidChance(new Decimal(0)));
    expect(hazardAvoidChance(new Decimal(20), 4)).toBeLessThan(hazardAvoidChance(new Decimal(20), 1));
    expect(rollGold(new Decimal(20), 1, () => 0.5).gt(
      rollGold(new Decimal(0), 1, () => 0.5),
    )).toBe(true);
    expect(rollGold(new Decimal(20), 1, () => 0.5).toNumber()).toBe(16);
    expect(rollGold(new Decimal(0), 0, () => 0.5).toNumber()).toBe(4);
    expect(rollGold(new Decimal(0), 1, () => 0.5).toNumber()).toBe(4);
    expect(rollGold(new Decimal(0), 2, () => 0.5).toNumber()).toBe(7);
    expect(rollGold(new Decimal(0), 3, () => 0.5).toNumber()).toBe(13);
    expect(rollGold(new Decimal(0), 4, () => 0.5).gt(
      rollGold(new Decimal(0), 3, () => 0.5),
    )).toBe(true);

    const lowWater = generationChances(new Decimal(0), 0, "water");
    const highWater = generationChances(new Decimal(20), 0, "water");
    expect(highWater.gold).toBe(lowWater.gold);
  });

  it("uses Luck to turn more eligible dead ends into treasure rooms", () => {
    expect(treasureRoomChance(new Decimal(0))).toBeCloseTo(0.025);
    expect(treasureRoomChance(new Decimal(20))).toBeCloseTo(0.055);
    expect(treasureRoomChance(new Decimal(1_000))).toBeCloseTo(0.15);

    const lowLuck = { ...knight.stats, luck: new Decimal(0) };
    const highLuck = { ...knight.stats, luck: new Decimal(20) };
    expect(currentAdventureRoom(exploreUntilSecondRoom(() => 0.04, lowLuck)).kind).not.toBe("treasure");
    expect(currentAdventureRoom(exploreUntilSecondRoom(() => 0.04, highLuck)).kind).toBe("treasure");
  });

  it("starts in a peaceful room with four exits and no contents", () => {
    const adventure = startAdventure(knight.stats, () => 0.99);
    const room = currentAdventureRoom(adventure);
    expect(room.exits.map((exit) => exit.direction).sort()).toEqual([
      "east",
      "north",
      "south",
      "west",
    ]);
    expect(room.width).toBe(9);
    expect(room.height).toBe(9);
    expect(room.tiles.flat().every((tile) =>
      tile.kind === "floor" || tile.kind === "wall" || tile.kind === "exit"
    )).toBe(true);
    expect(room.tiles.flat().filter((tile) => tile.floorVariant === "sunlight")).toHaveLength(9);
    expect(adventure.log[0]).toMatch(/Undertaker's rope/i);

    const move = suggestAdventureMove(adventure);
    expect(move).not.toBeNull();
    expect(Math.abs(move!.x - adventure.playerPosition.x) + Math.abs(move!.y - adventure.playerPosition.y)).toBe(1);
    expect(room.tiles[move!.y][move!.x].kind).not.toBe("wall");
  });

  it("ignores optional gold and enemies while traveling toward a target ring", () => {
    const room = emptyTestRoom(1, { x: 1, y: 0 });
    room.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    room.tiles[4][8] = { kind: "exit", exitDirection: "east" };
    room.tiles[3][4] = { kind: "gold", goldAmount: new Decimal(100) };
    room.tiles[4][5] = {
      kind: "enemy",
      enemyId: "optional-ring-enemy",
      enemyKind: "rat",
      enemyHp: new Decimal(1),
    };
    const adventure = testAdventure(room, { x: 4, y: 4 });

    const destination = suggestAdventureMove(adventure, { targetRing: 3 });
    expect(destination).toEqual({ x: 4, y: 5 });
    expect(room.tiles[destination!.y][destination!.x].kind).toBe("floor");
  });

  it("ignores loose gold without ignoring treasure chests", () => {
    const room = emptyTestRoom(1, { x: 1, y: 0 });
    room.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    room.tiles[4][8] = { kind: "exit", exitDirection: "east" };
    room.tiles[3][4] = { kind: "gold", goldAmount: new Decimal(100) };
    const adventure = testAdventure(room, { x: 4, y: 4 });

    expect(suggestAdventureMove(adventure)).toEqual({ x: 4, y: 3 });
    expect(suggestAdventureMove(adventure, { ignoreGold: true })).toEqual({ x: 5, y: 4 });

    room.tiles[4][6] = { kind: "treasureChest" };
    expect(suggestAdventureMove(adventure, { ignoreGold: true })).toEqual({ x: 5, y: 4 });
  });

  it("routes to a discovered landmark ahead of the selected exploration strategy", () => {
    const start = emptyTestRoom(1);
    start.position = { x: 0, y: 0 };
    start.key = "0,0";
    start.exits = [{ direction: "east", position: { x: 6, y: 3 } }];
    start.tiles[3][6] = { kind: "exit", exitDirection: "east" };
    const landmark = emptyTestRoom(1);
    landmark.position = { x: 1, y: 0 };
    landmark.key = "1,0";
    landmark.kind = "blacksmith";
    landmark.exits = [{ direction: "west", position: { x: 0, y: 3 } }];
    landmark.tiles[3][0] = { kind: "exit", exitDirection: "west" };
    const adventure = {
      ...testAdventure(start, { x: 3, y: 3 }),
      rooms: { [start.key]: start, [landmark.key]: landmark },
    };

    expect(suggestAdventureMove(adventure, {
      routeRoomKey: landmark.key,
      targetRing: 4,
      preferredDirection: "west",
    })).toEqual({ x: 4, y: 3 });
    expect(suggestAdventureMove({
      ...adventure,
      currentRoomKey: landmark.key,
      playerPosition: { x: 3, y: 3 },
    }, { routeRoomKey: landmark.key })).toBeNull();
  });

  it("fights a route-blocking enemy when it is required to reach a target ring", () => {
    const room = emptyTestRoom(1, { x: 1, y: 0 });
    for (let y = 1; y < 8; y += 1) {
      for (let x = 1; x < 8; x += 1) room.tiles[y][x] = { kind: "wall" };
    }
    for (let x = 1; x < 8; x += 1) room.tiles[4][x] = { kind: "floor" };
    room.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    room.tiles[4][8] = { kind: "exit", exitDirection: "east" };
    room.tiles[4][5] = {
      kind: "enemy",
      enemyId: "blocking-ring-enemy",
      enemyKind: "rat",
      enemyHp: new Decimal(1),
    };
    const adventure = testAdventure(room, { x: 4, y: 4 });

    expect(suggestAdventureMove(adventure, { targetRing: 3 })).toEqual({ x: 5, y: 4 });
  });

  it("takes the final quest route before fighting an optional in-range enemy", () => {
    const room = emptyTestRoom(1, { x: 0, y: 0 });
    room.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    room.tiles[4][8] = { kind: "exit", exitDirection: "east" };
    room.tiles[3][4] = {
      kind: "enemy",
      enemyId: "optional-final-hop-enemy",
      enemyKind: "fire-alligator",
      enemyHp: new Decimal(1_000),
    };
    const adventure = {
      ...testAdventure(room, { x: 4, y: 4 }),
      questTarget: {
        questId: "enter-tower" as const,
        position: { x: 1, y: 0 },
        path: [{ x: 1, y: 0 }],
      },
    };

    expect(suggestAdventureMove(adventure, { prioritizeQuest: true })).toEqual({ x: 5, y: 4 });
  });

  it("repairs a missing final quest exit before entering the marked Forge room", () => {
    const room = emptyTestRoom(1, { x: 0, y: 0 });
    const adventure = {
      ...testAdventure(room, { x: 7, y: 4 }),
      questTarget: {
        questId: "enter-tower" as const,
        position: { x: 1, y: 0 },
        path: [{ x: 1, y: 0 }],
      },
      completedBattleNumbers: [9],
    };

    const destination = suggestAdventureMove(adventure, { prioritizeQuest: true });
    expect(destination).toEqual({ x: 8, y: 4 });
    const entered = moveInAdventure(
      adventure,
      destination!,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(entered.error).toBeUndefined();
    expect(currentAdventureRoom(entered.state).kind).toBe("forgePortal");
  });

  it("generates and enters an 11x11 Forge portal room at the inner edge of zone 4", () => {
    const room = emptyTestRoom(1, { x: 0, y: -9 });
    room.ring = 3;
    room.exits = [{ direction: "north", position: { x: 4, y: 0 } }];
    room.tiles[0][4] = { kind: "exit", exitDirection: "north" };
    const path = Array.from({ length: 10 }, (_, index) => ({ x: 0, y: -(index + 1) }));
    const adventure: AdventureState = {
      ...testAdventure(room, { x: 4, y: 1 }),
      questTarget: {
        questId: "enter-tower",
        position: { x: 0, y: -10 },
        path,
      },
      completedBattleNumbers: [9],
    };

    const entered = moveInAdventure(
      adventure,
      { x: 4, y: 0 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );

    expect(entered.error).toBeUndefined();
    expect(entered.state.currentRoomKey).toBe("0,-10");
    expect(currentAdventureRoom(entered.state)).toMatchObject({
      kind: "forgePortal",
      width: 11,
      height: 11,
    });
    expect(currentAdventureRoom(entered.state).tiles).toHaveLength(11);
    expect(currentAdventureRoom(entered.state).tiles.every((row) => row.length === 11)).toBe(true);
    expect(currentAdventureRoom(entered.state).tiles.flat().filter(
      (tile) => tile.kind === "forgePortal",
    )).toHaveLength(9);
  });

  it("allows an early Forge portal but does not force it into the first zone-4 room", () => {
    const room = emptyTestRoom(3, { x: 0, y: -9 });
    room.exits = [{ direction: "north", position: { x: 4, y: 0 } }];
    room.tiles[0][4] = { kind: "exit", exitDirection: "north" };
    const adventure: AdventureState = {
      ...testAdventure(room, { x: 4, y: 1 }),
      forgePortalEnabled: true,
      completedBattleNumbers: [8],
    };

    const entered = moveInAdventure(
      adventure,
      { x: 4, y: 0 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );

    expect(entered.error).toBeUndefined();
    expect(currentAdventureRoom(entered.state).kind).not.toBe("forgePortal");
  });

  it("guarantees a Forge portal by the fifth discovered zone-4 room", () => {
    const room = emptyTestRoom(3, { x: 0, y: -9 });
    room.exits = [{ direction: "north", position: { x: 4, y: 0 } }];
    room.tiles[0][4] = { kind: "exit", exitDirection: "north" };
    const zoneFourRooms = Array.from({ length: 4 }, (_, index) =>
      emptyTestRoom(4, { x: 10, y: index })
    );
    const adventure: AdventureState = {
      ...testAdventure(room, { x: 4, y: 1 }),
      rooms: Object.fromEntries([room, ...zoneFourRooms].map((candidate) => [candidate.key, candidate])),
      forgePortalEnabled: true,
      completedBattleNumbers: [8],
    };

    const entered = moveInAdventure(
      adventure,
      { x: 4, y: 0 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );

    expect(entered.error).toBeUndefined();
    expect(currentAdventureRoom(entered.state)).toMatchObject({
      kind: "forgePortal",
      position: { x: 0, y: -10 },
      width: 11,
      height: 11,
    });
    expect(Object.values(entered.state.rooms).filter((candidate) => candidate.kind === "forgePortal")).toHaveLength(1);
  });

  it("enters the first Forge portal as an active quest objective before portal auto unlocks", () => {
    const room = emptyTestRoom(4, { x: 10, y: 0 });
    room.kind = "forgePortal";
    room.tiles = createPortalRoomTiles("forgePortal");
    const adventure = {
      ...testAdventure(room, { x: 4, y: 2 }),
      questTarget: {
        questId: "enter-tower" as const,
        position: { ...room.position },
        path: [{ ...room.position }],
      },
    };

    const destination = suggestAdventureMove(adventure, {
      prioritizeQuest: true,
      avoidManualInteractions: true,
      enterPortalTypes: [],
    });
    expect(destination).toEqual({ x: 4, y: 3 });
    const entered = moveInAdventure(
      adventure,
      destination!,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(entered.enteredPortalType).toBe("forge");
  });

  it("does not cross a Water portal when only Forge portal auto-entry is enabled", () => {
    const room = emptyTestRoom(2, { x: 5, y: 0 });
    room.kind = "waterPortal";
    room.tiles = createPortalRoomTiles("waterPortal");
    room.exits = [{ direction: "south", position: { x: 4, y: 8 } }];
    room.tiles[8][4] = { kind: "exit", exitDirection: "south" };
    const adventure = testAdventure(room, { x: 4, y: 2 });

    const destination = suggestAdventureMove(adventure, {
      avoidManualInteractions: true,
      enterPortalTypes: ["forge"],
    });

    expect(destination).not.toBeNull();
    expect(room.tiles[destination!.y][destination!.x].kind).not.toBe("waterPortal");
  });

  it("waits to activate the first Forge portal until every living explorer is on it", () => {
    const room = emptyTestRoom(4, { x: 10, y: 0 });
    room.kind = "forgePortal";
    room.tiles = createPortalRoomTiles("forgePortal");
    const adventure = testAdventure(room, { x: 4, y: 2 });

    const waiting = moveInAdventure(
      adventure,
      { x: 4, y: 3 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
      [{ roomKey: room.key, position: { x: 1, y: 1 } }],
      false,
      false,
      false,
      undefined,
      true,
    );
    expect(waiting.enteredPortalType).toBeUndefined();
    expect(waiting.state.log[0]).toMatch(/waits.+rest of the expedition/i);

    const assembled = moveInAdventure(
      adventure,
      { x: 4, y: 3 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
      [{ roomKey: room.key, position: { x: 5, y: 3 } }],
      false,
      false,
      false,
      undefined,
      true,
    );
    expect(assembled.enteredPortalType).toBe("forge");
  });

  it("starts and seals a Forge arena only after the full expedition assembles", () => {
    const source = emptySizedTestRoom(4, 11, { x: 0, y: 0 });
    source.exits = [{ direction: "east", position: { x: 10, y: 5 } }];
    source.tiles[5][10] = { kind: "exit", exitDirection: "east" };
    const arena: DungeonRoom = {
      ...emptySizedTestRoom(4, 11, { x: 1, y: 0 }),
      tiles: createForgeRoomTiles(),
      exits: [
        { direction: "west", position: { x: 0, y: 5 } },
        { direction: "north", position: { x: 5, y: 0 } },
      ],
      kind: "forgeArena",
      forgeArenaStarted: false,
      forgeArenaResolved: false,
      forgeArenaOrdinal: 1,
    };
    arena.tiles[5][0] = { kind: "exit", exitDirection: "west" };
    arena.tiles[0][5] = { kind: "exit", exitDirection: "north" };
    const adventure: AdventureState = {
      ...testAdventure(source, { x: 9, y: 5 }),
      rooms: { [source.key]: source, [arena.key]: arena },
      dungeonTheme: "forge",
    };

    const waiting = moveInAdventure(
      adventure,
      { x: 10, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.25,
      [{ roomKey: source.key, position: { x: 2, y: 2 } }],
    );
    expect(waiting.forgeArenaStarted).toBe(false);
    expect(currentAdventureRoom(waiting.state).forgeArenaStarted).toBe(false);
    expect(currentAdventureRoom(waiting.state).tiles.flat().filter((tile) => tile.kind === "enemy")).toHaveLength(0);
    expect(currentAdventureRoom(waiting.state).tiles[5][0].kind).toBe("exit");
    expect(currentAdventureRoom(waiting.state).tiles[0][5]).toMatchObject({
      kind: "forgeGate",
      gateRoomKey: arena.key,
    });

    const assembled = moveInAdventure(
      adventure,
      { x: 10, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.25,
      [{ roomKey: arena.key, position: { x: 5, y: 5 } }],
    );
    const sealedArena = currentAdventureRoom(assembled.state);
    expect(assembled.forgeArenaStarted).toBe(true);
    expect(sealedArena.forgeArenaStarted).toBe(true);
    expect(new Set(sealedArena.tiles.flat().flatMap((tile) => tile.enemyId ?? [])).size).toBe(4);
    expect(sealedArena.tiles[5][0]).toMatchObject({
      kind: "forgeGate",
      gateRoomKey: arena.key,
    });
    expect(assembled.state.rooms[source.key].tiles[5][10]).toMatchObject({
      kind: "forgeGate",
      gateRoomKey: arena.key,
    });
  });

  it("keeps generating arenas after the Blueprint expedition without reserving another reliquary", () => {
    const source = emptySizedTestRoom(4, 11, { x: 0, y: 0 });
    source.kind = "forgeNormal";
    source.exits = [{ direction: "east", position: { x: 10, y: 5 } }];
    source.tiles[5][10] = { kind: "exit", exitDirection: "east" };
    const adventure: AdventureState = {
      ...testAdventure(source, { x: 9, y: 5 }),
      rooms: { [source.key]: source },
      dungeonTheme: "forge",
      forgeArenasCleared: 7,
      forgeBlueprintTarget: { x: 1, y: 0 },
      forgeBlueprintObjectiveEnabled: false,
    };

    const entered = moveInAdventure(
      adventure,
      { x: 10, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );

    expect(currentAdventureRoom(entered.state).kind).toBe("forgeArena");
    expect(currentAdventureRoom(entered.state).forgeArenaOrdinal).toBe(8);
    expect(entered.state.forgeBlueprintTarget).toBeNull();
    expect(currentAdventureRoom(entered.state).forgeBlueprintDirection).toBeUndefined();
  });

  it("guarantees a repeat-visit Forge vault and preserves the tower-key floor clue", () => {
    const source = emptySizedTestRoom(4, 11, { x: 0, y: 0 });
    source.kind = "forgeNormal";
    source.exits = [{ direction: "east", position: { x: 10, y: 5 } }];
    source.tiles[5][10] = { kind: "exit", exitDirection: "east" };
    const fillerRooms = [
      emptySizedTestRoom(4, 11, { x: 0, y: 5 }),
      emptySizedTestRoom(4, 11, { x: 1, y: 5 }),
      emptySizedTestRoom(4, 11, { x: 2, y: 5 }),
      emptySizedTestRoom(4, 11, { x: 3, y: 5 }),
    ];
    const rooms = Object.fromEntries([source, ...fillerRooms].map((room) => [room.key, room]));
    const adventure: AdventureState = {
      ...testAdventure(source, { x: 9, y: 5 }),
      rooms,
      dungeonTheme: "forge",
      forgeArenasCleared: 9,
      forgeBlueprintTarget: null,
      forgeBlueprintObjectiveEnabled: false,
    };

    const entered = moveInAdventure(
      adventure,
      { x: 10, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    const vault = currentAdventureRoom(entered.state);
    expect(vault.kind).toBe("forgeTreasure");
    expect(vault.width).toBe(11);
    expect(vault.height).toBe(11);
    expect(vault.forgeRecipeId).toBe("tower-key");
    expect(vault.tiles[5][5]).toMatchObject({ kind: "treasureChest" });
    expect(vault.tiles[5][5].gearSlot).toBeDefined();
    expect(vault.exits).toHaveLength(1);
  });

  it("never generates ordinary Forge vaults before the Blueprints are obtained", () => {
    const source = emptySizedTestRoom(4, 11, { x: 0, y: 0 });
    source.kind = "forgeNormal";
    source.exits = [{ direction: "east", position: { x: 10, y: 5 } }];
    source.tiles[5][10] = { kind: "exit", exitDirection: "east" };
    const fillerRooms = [
      emptySizedTestRoom(4, 11, { x: 0, y: 5 }),
      emptySizedTestRoom(4, 11, { x: 1, y: 5 }),
      emptySizedTestRoom(4, 11, { x: 2, y: 5 }),
      emptySizedTestRoom(4, 11, { x: 3, y: 5 }),
    ];
    const rooms = Object.fromEntries([source, ...fillerRooms].map((room) => [room.key, room]));
    const adventure: AdventureState = {
      ...testAdventure(source, { x: 9, y: 5 }),
      rooms,
      dungeonTheme: "forge",
      forgeArenasCleared: 3,
      forgeBlueprintTarget: { x: 9, y: 9 },
      forgeBlueprintObjectiveEnabled: true,
    };

    const entered = moveInAdventure(
      adventure,
      { x: 10, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0,
    );

    expect(currentAdventureRoom(entered.state).kind).toBe("forgeNormal");
    expect(currentAdventureRoom(entered.state).tiles.flat().some((tile) => tile.kind === "treasureChest")).toBe(false);
  });

  it("opens a repeat-visit Forge potion chest without replacing its floor recipe", () => {
    const tiles = createForgeTreasureRoomTiles({ potionId: "stat-attack" });
    const room: DungeonRoom = {
      ...emptySizedTestRoom(4, 11, { x: 1, y: 0 }),
      width: 11,
      height: 11,
      tiles,
      kind: "forgeTreasure",
      forgeRecipeId: "tower-key",
    };
    const opened = moveInAdventure(
      testAdventure(room, { x: 5, y: 4 }),
      { x: 5, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(opened.potionFound).toBe("stat-attack");
    expect(currentAdventureRoom(opened.state).tiles[5][5].kind).toBe("openedChest");
    expect(currentAdventureRoom(opened.state).forgeRecipeId).toBe("tower-key");
  });

  it("retires a cached Blueprint reliquary as soon as the plans are obtained", () => {
    const tiles = Array.from({ length: 13 }, () =>
      Array.from({ length: 11 }, (): AdventureTile => ({ kind: "floor" }))
    );
    tiles[2][5] = { kind: "openedChest" };
    const blueprintRoom: DungeonRoom = {
      ...emptySizedTestRoom(4, 11, { x: 2, y: -1 }),
      width: 11,
      height: 13,
      tiles,
      exits: [{ direction: "south", position: { x: 5, y: 12 } }],
      kind: "forgeBlueprint",
      forgeRecipeId: "tower-key",
    };
    const retired = retireForgeBlueprintObjective({
      ...testAdventure(blueprintRoom, { x: 5, y: 11 }),
      dungeonTheme: "forge",
      forgeBlueprintTarget: blueprintRoom.position,
      forgeBlueprintObjectiveEnabled: true,
    });
    const room = currentAdventureRoom(retired);
    expect(room.kind).toBe("forgeNormal");
    expect(room.width).toBe(11);
    expect(room.height).toBe(11);
    expect(room.tiles.flat().some((tile) => tile.kind === "forgeBlueprintChest")).toBe(false);
    expect(room.forgeRecipeId).toBeUndefined();
    expect(retired.forgeBlueprintTarget).toBeNull();
    expect(retired.forgeBlueprintObjectiveEnabled).toBe(false);
    expect(retired.playerPosition).toEqual({ x: 5, y: 5 });
  });

  it("opens a cleared Forge arena and reports the transition for shared-party retiming", () => {
    const arena: DungeonRoom = {
      ...emptySizedTestRoom(4, 11, { x: 1, y: 0 }),
      tiles: createForgeRoomTiles(),
      exits: [{ direction: "west", position: { x: 0, y: 5 } }],
      kind: "forgeArena",
      forgeArenaStarted: true,
      forgeArenaResolved: false,
      forgeArenaOrdinal: 1,
    };
    arena.tiles[5][0] = {
      kind: "forgeGate",
      exitDirection: "west",
      gateRoomKey: arena.key,
    };
    arena.tiles[5][5] = {
      kind: "enemy",
      enemyId: "last-forgeling",
      enemyKind: "forgeling",
      enemyHp: new Decimal(1),
    };
    const cleared = moveInAdventure(
      testAdventure(arena, { x: 4, y: 5 }),
      { x: 5, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(cleared.forgeArenaCleared).toBe(true);
    expect(currentAdventureRoom(cleared.state).forgeArenaResolved).toBe(true);
    expect(currentAdventureRoom(cleared.state).tiles[5][0]).toMatchObject({
      kind: "exit",
      exitDirection: "west",
    });
  });

  it("keeps every Forgeling variant below the Fire Alligator's overall threat", () => {
    for (const enemy of [forgeling, chainForgeling, bellowsForgeling, hammerForgeling]) {
      expect(enemy.stats.hp.lt(fireAlligator.stats.hp)).toBe(true);
      expect(Decimal.max(enemy.stats.attack, enemy.stats.spAttack).lt(fireAlligator.stats.spAttack)).toBe(true);
    }
  });

  it("opens the Shopkeeper cage after the final Skeleton and unlocks the Shop on interaction", () => {
    const guardedRoom = emptyTestRoom(3);
    guardedRoom.kind = "shopkeeper";
    guardedRoom.tiles[4][5] = {
      kind: "enemy",
      enemyId: "last-shopkeeper-skeleton",
      enemyKind: "skeleton",
      enemyHp: new Decimal(1),
    };
    guardedRoom.tiles[4][6] = { kind: "shopkeeperCage" };
    const defeated = moveInAdventure(
      testAdventure(guardedRoom, { x: 4, y: 4 }),
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(defeated.error).toBeUndefined();
    expect(currentAdventureRoom(defeated.state).tiles[4][6].kind).toBe("shopkeeper");
    expect(defeated.state.log[0]).toMatch(/cage opened/i);

    const rescuedRoom = emptyTestRoom(3);
    rescuedRoom.kind = "shopkeeper";
    rescuedRoom.tiles[4][5] = { kind: "shopkeeper" };
    const markedRescue = testAdventure(rescuedRoom, { x: 4, y: 4 });
    markedRescue.questTarget = {
      questId: "rescue-shopkeeper",
      position: { ...rescuedRoom.position },
      path: [{ ...rescuedRoom.position }],
    };
    const rescued = moveInAdventure(
      markedRescue,
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(rescued.unlockedShopkeeper).toBe(true);
    expect(rescued.completedQuestId).toBe("rescue-shopkeeper");
    expect(rescued.state.questTarget).toBeNull();
    expect(currentAdventureRoom(rescued.state).tiles[4][5].kind).toBe("shopkeeper");
  });

  it("generates the marked Shopkeeper quest as one dead end in ring 1", () => {
    const random = seededRandom(3403);
    let adventure = startAdventure(knight.stats, random, 0, "rescue-shopkeeper", "knight", false, false);
    const target = adventure.questTarget;
    expect(target?.questId).toBe("rescue-shopkeeper");
    let hp = new Decimal(1e9);
    for (let turn = 0; turn < 4_000 && !Object.values(adventure.rooms).some((room) => room.kind === "shopkeeper"); turn += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        if (!destination) {
          adventure = passAdventureTurn(adventure, knight.stats);
          continue;
        }
        const result = moveInAdventure(adventure, destination, knight.stats, hp, new Decimal(1e9), random);
        expect(result.error).toBeUndefined();
        adventure = result.state;
        hp = result.hp;
      } else {
        const result = performAdventureEnemyTurn(adventure, knight.stats, hp, new Decimal(1e9));
        adventure = result.state;
        hp = result.hp;
      }
    }
    const rooms = Object.values(adventure.rooms).filter((room) => room.kind === "shopkeeper");
    expect(rooms).toHaveLength(1);
    expect(rooms[0].position).toEqual(target?.position);
    expect(rooms[0].ring).toBe(1);
    expect(rooms[0].exits).toHaveLength(1);
    expect(rooms[0].tiles.flat().filter((tile) => tile.enemyKind === "skeleton")).toHaveLength(3);
    expect(rooms[0].tiles.flat().filter((tile) => tile.kind === "shopkeeperCage")).toHaveLength(1);
  });

  it("keeps routine movement out of the Adventure log while recording pickups", () => {
    const floorRoom = emptyTestRoom(0);
    const floorAdventure = testAdventure(floorRoom, { x: 4, y: 4 });
    const moved = moveInAdventure(
      floorAdventure,
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(moved.state.log).toEqual(floorAdventure.log);

    const goldRoom = emptyTestRoom(1);
    goldRoom.tiles[4][5] = { kind: "gold" };
    const collected = moveInAdventure(
      testAdventure(goldRoom, { x: 4, y: 4 }),
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(collected.state.log[0]).toMatch(/^Obtained .* gold\./);
  });

  it("assigns each explorer a unique starting tile and blocks party-member collisions", () => {
    const knightAdventure = startAdventure(knight.stats, () => 0.99);
    const wormAdventure = addAdventureExplorer(
      knightAdventure,
      "worm",
      worm.stats,
      0,
      [knightAdventure.playerPosition],
    );
    expect(wormAdventure.playerPosition).not.toEqual(knightAdventure.playerPosition);
    const collision = moveInAdventure(
      knightAdventure,
      wormAdventure.playerPosition,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
      [{ roomKey: wormAdventure.currentRoomKey, position: wormAdventure.playerPosition }],
    );
    expect(collision.error).toMatch(/occupies/);
  });

  it("combines every explorer into the Adventure turn preview", () => {
    const knightAdventure = startAdventure(knight.stats, () => 0.99);
    const wormAdventure = addAdventureExplorer(
      knightAdventure,
      "worm",
      worm.stats,
      0,
      [knightAdventure.playerPosition],
    );
    const preview = adventurePartyTurnPreview([
      { state: knightAdventure, playerStats: knight.stats },
      { state: wormAdventure, playerStats: worm.stats },
    ], 5);
    expect(preview).toEqual(["Knight", "Worm", "Knight", "Knight", "Worm"]);
  });

  it("advances both auto explorers out of the starting room without changing focus", () => {
    const random = () => 0.99;
    const knightAdventure = startAdventure(knight.stats, random, 0, "retrieve-lost-item");
    const explorers: Record<"knight" | "worm", AdventureState> = {
      knight: knightAdventure,
      worm: addAdventureExplorer(
        knightAdventure,
        "worm",
        worm.stats,
        0,
        [knightAdventure.playerPosition],
      ),
    };

    runPairAuto(explorers, { knight: "west", worm: "east" }, random, true);

    expect(explorers.knight.currentRoomKey).not.toBe("0,0");
    expect(explorers.worm.currentRoomKey).not.toBe("0,0");
  });

  it("keeps both quest-routed explorers crossing doors until the marked room", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const random = seededRandom(seed);
      const knightAdventure = startAdventure(knight.stats, random, 0, "retrieve-lost-item");
      const explorers: Record<"knight" | "worm", AdventureState> = {
        knight: knightAdventure,
        worm: addAdventureExplorer(knightAdventure, "worm", worm.stats, 0, [knightAdventure.playerPosition]),
      };
      runPairQuestUntilPortal(explorers, random);
      expect(currentAdventureRoom(explorers.knight).kind, `Knight seed ${seed}`).toBe("portal");
      expect(currentAdventureRoom(explorers.worm).kind, `Worm seed ${seed}`).toBe("portal");
      expect(Object.values(explorers.knight.rooms).every((room) => allNonWallTilesReachable(room))).toBe(true);
    }
  });

  it("repairs a legacy room whose walkable areas were split by a wall barrier", () => {
    const room = emptyTestRoom(2);
    for (let y = 1; y < room.height - 1; y += 1) room.tiles[y][4] = { kind: "wall" };
    const adventure = testAdventure(room, { x: 6, y: 4 });
    expect(allNonWallTilesReachable(room, adventure.playerPosition)).toBe(false);

    const repaired = repairAdventureRoomConnectivity(adventure);
    expect(allNonWallTilesReachable(currentAdventureRoom(repaired), repaired.playerPosition)).toBe(true);
    expect(repaired.activeActorId).toBe(ADVENTURE_KNIGHT_ID);
    expect(repaired.log).toEqual(adventure.log);
  });

  it("randomizes a shared Together heading and distinct Split headings", () => {
    const together = createAdventureHeadings(["knight", "worm"], "together", () => 0);
    const split = createAdventureHeadings(["knight", "worm"], "split", () => 0);
    expect(together.knight).toBe(together.worm);
    expect(split.knight).not.toBe(split.worm);
    expect(split).toEqual({ knight: "east", worm: "south" });
  });

  it("uses each randomized heading when Split explorers leave the start", () => {
    const random = () => 0.99;
    const knightAdventure = startAdventure(knight.stats, random);
    const explorers: Record<"knight" | "worm", AdventureState> = {
      knight: knightAdventure,
      worm: addAdventureExplorer(knightAdventure, "worm", worm.stats, 0, [knightAdventure.playerPosition]),
    };
    const firstRooms = runPairAuto(
      explorers,
      { knight: "north", worm: "east" },
      random,
      false,
    );
    expect(firstRooms.knight).toBe("0,-1");
    expect(firstRooms.worm).toBe("1,0");
  });

  it("finds a different floor tile when an occupied doorway is entered", () => {
    const startRoom = emptyTestRoom(0, { x: 0, y: 0 });
    startRoom.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    startRoom.tiles[4][8] = { kind: "exit", exitDirection: "east" };
    const destinationRoom = emptyTestRoom(1, { x: 1, y: 0 });
    destinationRoom.exits = [{ direction: "west", position: { x: 0, y: 4 } }];
    destinationRoom.tiles[4][0] = { kind: "exit", exitDirection: "west" };
    const adventure: AdventureState = {
      ...testAdventure(startRoom, { x: 7, y: 4 }),
      rooms: {
        [startRoom.key]: startRoom,
        [destinationRoom.key]: destinationRoom,
      },
    };
    const result = moveInAdventure(
      adventure,
      { x: 8, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
      [{ roomKey: destinationRoom.key, position: { x: 1, y: 4 } }],
    );
    expect(result.error).toBeUndefined();
    expect(result.state.currentRoomKey).toBe(destinationRoom.key);
    expect(result.state.playerPosition).not.toEqual({ x: 1, y: 4 });
    expect(currentAdventureRoom(result.state).tiles[result.state.playerPosition.y][result.state.playerPosition.x].kind)
      .toBe("floor");
  });

  it("keeps the start outside three-room-thick rings and assigns each current earth enemy band", () => {
    expect(ringForPosition({ x: 0, y: 0 })).toBe(0);
    expect(ringForPosition({ x: 1, y: 0 })).toBe(1);
    expect(ringForPosition({ x: 2, y: -2 })).toBe(1);
    expect(ringForPosition({ x: 3, y: 0 })).toBe(1);
    expect(ringForPosition({ x: 4, y: 0 })).toBe(2);
    expect(ringForPosition({ x: -5, y: 1 })).toBe(2);
    expect(ringForPosition({ x: 6, y: 0 })).toBe(2);
    expect(ringForPosition({ x: 7, y: 0 })).toBe(3);
    expect(enemyKindForRing(1)).toBe("rat");
    expect(enemyKindForRing(2)).toBe("ant");
    expect(enemyKindForRing(3)).toBe("clay-golem");
    expect(enemyKindForRing(4)).toBe("fire-alligator");
  });

  it("keeps zone 4 infinite until Battle 9 turns the distant frontier into zone 5", () => {
    const distant = { x: 99, y: -20 };
    expect(adventureZoneForPosition(distant, [])).toBe(4);
    expect(adventureZoneForPosition(distant, [9])).toBe(5);
    expect(adventureZoneForPosition(distant, [9], "water")).toBe(0);
  });

  it("places the Forge quest portal on the innermost edge of zone 4", () => {
    const adventure = startAdventure(
      knight.stats,
      () => 0.73,
      0,
      "enter-tower",
      "knight",
      true,
      true,
      [9],
    );
    expect(adventure.questTarget?.questId).toBe("enter-tower");
    expect(Math.max(
      Math.abs(adventure.questTarget?.position.x ?? 0),
      Math.abs(adventure.questTarget?.position.y ?? 0),
    )).toBe(10);
    expect(ringForPosition(adventure.questTarget!.position)).toBe(4);
  });

  it("reveals one mapped tower landmark, auto-leaves it, then keeps later frontiers in zone 4", () => {
    const eastRoom = emptySizedTestRoom(4, 11, { x: 12, y: 0 });
    eastRoom.exits = [{ direction: "east", position: { x: 10, y: 5 } }];
    eastRoom.tiles[5][10] = { kind: "exit", exitDirection: "east" };
    const eastArrival = moveInAdventure(
      {
        ...testAdventure(eastRoom, { x: 9, y: 5 }),
        completedBattleNumbers: [9],
        dungeonTheme: "earth",
      },
      { x: 10, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.75,
    );

    expect(eastArrival.error).toBeUndefined();
    expect(eastArrival.state.currentRoomKey).toBe("13,0");
    expect(currentAdventureRoom(eastArrival.state)).toMatchObject({
      kind: "towerExterior",
      ring: 4,
      position: { x: 13, y: 0 },
      width: 31,
      height: 31,
    });
    expect(currentAdventureRoom(eastArrival.state).mapHidden).not.toBe(true);
    expect(eastArrival.state.playerPosition).toEqual({ x: 15, y: 29 });
    expect(allNonWallTilesReachable(
      currentAdventureRoom(eastArrival.state),
      eastArrival.state.playerPosition,
    )).toBe(true);
    expect(eastArrival.state.towerReturnRoomKey).toBe(eastRoom.key);
    expect(eastArrival.state.towerReturnExitDirection).toBe("east");
    const automaticStep = suggestAdventureMove(eastArrival.state, {
      avoidManualInteractions: true,
    });
    expect(automaticStep).toEqual({ x: 15, y: 30 });
    expect(suggestAdventureMove(eastArrival.state, {
      routeRoomKey: eastArrival.state.currentRoomKey,
    })).toBeNull();

    const returned = moveInAdventure(
      { ...eastArrival.state, activeActorId: adventurePlayerActorId("knight") },
      { x: 15, y: 30 },
      knight.stats,
      eastArrival.hp,
      eastArrival.stamina,
      () => 0.75,
    );
    expect(returned.error).toBeUndefined();
    expect(returned.state.currentRoomKey).toBe(eastRoom.key);
    expect(returned.state.playerPosition).toEqual({ x: 9, y: 5 });
    expect(returned.state.towerReturnRoomKey).toBeNull();
    expect(returned.state.towerReturnExitDirection).toBeNull();

    const northRoom = emptySizedTestRoom(4, 11, { x: 0, y: -12 });
    northRoom.exits = [{ direction: "north", position: { x: 5, y: 0 } }];
    northRoom.tiles[0][5] = { kind: "exit", exitDirection: "north" };
    const laterFrontier = moveInAdventure(
      {
        ...returned.state,
        currentRoomKey: northRoom.key,
        previousRoomKey: null,
        rooms: { ...returned.state.rooms, [northRoom.key]: northRoom },
        playerPosition: { x: 5, y: 1 },
        activeActorId: adventurePlayerActorId("knight"),
      },
      { x: 5, y: 0 },
      knight.stats,
      returned.hp,
      returned.stamina,
      () => 0.75,
    );
    expect(laterFrontier.error).toBeUndefined();
    expect(laterFrontier.state.currentRoomKey).toBe("0,-13");
    expect(currentAdventureRoom(laterFrontier.state).kind).not.toBe("towerExterior");
    expect(currentAdventureRoom(laterFrontier.state).ring).toBe(4);
    expect(Object.values(laterFrontier.state.rooms).filter(
      (candidate) => candidate.kind === "towerExterior",
    )).toHaveLength(1);
  });

  it("opens the Great Tower when the Tower Key is used on its door", () => {
    const room = createTowerExteriorDungeonRoom(1, { x: 13, y: 0 }, "south");
    const interacted = moveInAdventure(
      testAdventure(room, { x: 15, y: 10 }),
      { x: 15, y: 9 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
      [],
      false,
      false,
      false,
      undefined,
      true,
      true,
    );
    expect(interacted.error).toBeUndefined();
    expect(interacted.discoveredTowerDoor).toBe(true);
    expect(interacted.unlockedGreatTower).toBe(true);
    expect(interacted.state.log[0]).toMatch(/Tower Key turns/i);
  });

  it("builds zone 4 as an 11x11 volcanic room with hidden wall-to-wall beams and 1x2 Fire Alligators", () => {
    const random = seededRandom(481516);
    const stats = {
      ...knight.stats,
      attack: new Decimal(1e7),
      spAttack: new Decimal(1e7),
      speed: new Decimal(1e5),
    };
    let adventure = startAdventure(stats, random);
    let hp = new Decimal(1e12);
    let room: DungeonRoom | null = null;
    for (let step = 0; step < 12_000; step += 1) {
      const current = currentAdventureRoom(adventure);
      if (current.ring === 4 && current.kind === "normal") {
        room = current;
        break;
      }
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure, {
          targetRing: 4,
          prioritizeQuest: false,
          ignoreGold: true,
        });
        expect(destination).not.toBeNull();
        const result = moveInAdventure(
          adventure,
          destination!,
          stats,
          hp,
          new Decimal(1e12),
          random,
        );
        adventure = result.state;
        hp = result.hp;
      } else {
        const result = performAdventureEnemyTurn(
          adventure,
          stats,
          hp,
          new Decimal(1e12),
        );
        adventure = result.state;
        hp = result.hp;
      }
    }

    expect(room).not.toBeNull();
    expect(room!.width).toBe(11);
    expect(room!.height).toBe(11);
    expect(room!.tiles.flat().filter((tile) => tile.kind === "wall").every((tile) =>
      tile.wallVariant === "volcanic"
    )).toBe(true);
    const beamTiles = room!.tiles.flat().filter((tile) =>
      tile.kind === "trap" && tile.trapStyle === "fire-beam"
    );
    expect(beamTiles.length).toBeGreaterThanOrEqual(8);
    expect(beamTiles.every((tile) => !tile.revealed && Boolean(tile.trapGroupId))).toBe(true);
    const alligatorParts = room!.tiles.flat().filter((tile) =>
      tile.kind === "enemy" && tile.enemyKind === "fire-alligator"
    );
    const partsByEnemy = alligatorParts.reduce((groups, tile) => {
      const key = tile.enemyId ?? "missing";
      groups.set(key, [...(groups.get(key) ?? []), tile]);
      return groups;
    }, new Map<string, AdventureTile[]>());
    expect([...partsByEnemy.values()].every((parts) =>
      parts.length === 2 && new Set(parts.map((part) => part.enemyPart)).size === 2
    )).toBe(true);
  });

  it("reveals an entire Fire Beam and lets a Fire Alligator breathe special damage down a lane", () => {
    const beamRoom = emptySizedTestRoom(4, 11);
    for (let x = 1; x < 10; x += 1) {
      beamRoom.tiles[5][x] = {
        kind: "trap",
        trapStyle: "fire-beam",
        trapGroupId: "beam-one",
        trapBeamDirection: "horizontal",
      };
    }
    const crossed = moveInAdventure(
      testAdventure(beamRoom, { x: 4, y: 4 }),
      { x: 4, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );
    expect(currentAdventureRoom(crossed.state).tiles[5].slice(1, 10).every((tile) =>
      tile.kind === "trap" && tile.revealed
    )).toBe(true);
    expect(crossed.hp.lt(knight.stats.hp)).toBe(true);
    expect(crossed.state.log[0]).toMatch(/wall-to-wall fire beam/i);

    const enemyRoom = emptySizedTestRoom(4, 11);
    const enemyHp = adventureEnemyStats(4, "fire-alligator").hp;
    enemyRoom.tiles[3][5] = {
      kind: "enemy",
      enemyId: "fire-gator",
      enemyKind: "fire-alligator",
      enemyHp,
      enemyPart: 0,
    };
    enemyRoom.tiles[4][5] = {
      kind: "enemy",
      enemyId: "fire-gator",
      enemyKind: "fire-alligator",
      enemyHp,
      enemyPart: 1,
    };
    const attacked = performAdventureEnemyTurn(
      testAdventure(enemyRoom, { x: 5, y: 7 }, "fire-gator"),
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(attacked.hp.lt(knight.stats.hp)).toBe(true);
    expect(attacked.state.lastProjectile?.kind).toBe("fire");
    expect(attacked.state.log[0]).toMatch(/Magma Breath|breathes/i);
  });

  it("preserves both Fire Beam groups at a crossing and reveals a single cross junction", () => {
    const room = emptySizedTestRoom(4, 11);
    for (let x = 1; x < 10; x += 1) {
      room.tiles[5][x] = {
        kind: "trap",
        trapStyle: "fire-beam",
        trapGroupId: "horizontal-beam",
        trapGroupIds: ["horizontal-beam"],
        trapBeamDirection: "horizontal",
      };
    }
    for (let y = 1; y < 10; y += 1) {
      room.tiles[y][5] = y === 5
        ? {
            kind: "trap",
            trapStyle: "fire-beam",
            trapGroupId: "horizontal-beam",
            trapGroupIds: ["horizontal-beam", "vertical-beam"],
            trapBeamDirection: "cross",
          }
        : {
            kind: "trap",
            trapStyle: "fire-beam",
            trapGroupId: "vertical-beam",
            trapGroupIds: ["vertical-beam"],
            trapBeamDirection: "vertical",
          };
    }

    const crossed = moveInAdventure(
      testAdventure(room, { x: 4, y: 4 }),
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );
    const repairedRoom = currentAdventureRoom(crossed.state);
    expect(repairedRoom.tiles[5][5].trapBeamDirection).toBe("cross");
    expect(repairedRoom.tiles[5][5].trapGroupIds).toEqual([
      "horizontal-beam",
      "vertical-beam",
    ]);
    expect(repairedRoom.tiles.slice(1, 10)
      .map((row) => row[5])
      .filter((tile) => tile.kind === "trap")
      .every((tile) => tile.revealed)).toBe(true);
    expect(repairedRoom.tiles[5][5].revealed).toBe(true);

    const horizontalCrossing = moveInAdventure(
      testAdventure(room, { x: 4, y: 4 }),
      { x: 4, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );
    const horizontalRoom = currentAdventureRoom(horizontalCrossing.state);
    expect(horizontalRoom.tiles[5].slice(1, 10)
      .filter((tile) => tile.kind === "trap")
      .every((tile) => tile.revealed)).toBe(true);
    expect(horizontalRoom.tiles[5][5].trapBeamDirection).toBe("cross");
  });

  it("cycles revealed Fire Beams and lets auto wait for a safe crossing", () => {
    const room = emptySizedTestRoom(4, 11);
    for (let x = 1; x < 10; x += 1) {
      room.tiles[5][x] = {
        kind: "trap",
        revealed: true,
        trapStyle: "fire-beam",
        trapGroupId: "timed-beam",
        trapBeamDirection: "horizontal",
      };
    }
    room.tiles[6][5] = { kind: "gold", goldAmount: new Decimal(1) };
    let adventure = testAdventure(room, { x: 5, y: 4 });
    expect(fireBeamIsActive(room, room.tiles[5][5])).toBe(true);
    expect(suggestAdventureMove(adventure, { prioritizeQuest: false })).toBeNull();

    adventure = passAdventureTurn(adventure, knight.stats);
    expect(currentAdventureRoom(adventure).hazardTurn).toBe(1);
    expect(suggestAdventureMove(adventure, { prioritizeQuest: false })).toBeNull();
    adventure = passAdventureTurn(adventure, knight.stats);
    expect(currentAdventureRoom(adventure).hazardTurn).toBe(2);
    expect(fireBeamIsActive(currentAdventureRoom(adventure), currentAdventureRoom(adventure).tiles[5][5])).toBe(false);

    const safeStep = suggestAdventureMove(adventure, { prioritizeQuest: false });
    expect(safeStep).toEqual({ x: 5, y: 5 });
    const crossed = moveInAdventure(
      adventure,
      safeStep!,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );
    expect(crossed.hp.eq(knight.stats.hp)).toBe(true);
    expect(crossed.state.log[0]).toMatch(/dormant/i);
  });

  it("rotates a two-tile Fire Alligator footprint toward a horizontal attack", () => {
    const room = emptySizedTestRoom(4, 11);
    const enemyHp = adventureEnemyStats(4, "fire-alligator").hp;
    room.tiles[3][5] = {
      kind: "enemy",
      enemyId: "turning-gator",
      enemyKind: "fire-alligator",
      enemyHp,
      enemyPart: 0,
      enemyFacing: "south",
    };
    room.tiles[4][5] = {
      kind: "enemy",
      enemyId: "turning-gator",
      enemyKind: "fire-alligator",
      enemyHp,
      enemyPart: 1,
      enemyFacing: "south",
    };
    const attacked = performAdventureEnemyTurn(
      testAdventure(room, { x: 8, y: 3 }, "turning-gator"),
      knight.stats,
      new Decimal(10_000),
      knight.stats.stamina,
    );
    const parts = currentAdventureRoom(attacked.state).tiles.flatMap((row, y) =>
      row.flatMap((tile, x) => tile.enemyId === "turning-gator" ? [{ tile, x, y }] : [])
    );
    expect(parts).toHaveLength(2);
    expect(new Set(parts.map((part) => part.y)).size).toBe(1);
    expect(parts.every((part) => part.tile.enemyFacing === "east")).toBe(true);
  });

  it("drops Fire Alligator Hide from one shared-health 1x2 creature", () => {
    const room = emptySizedTestRoom(4, 11);
    room.tiles[4][5] = {
      kind: "enemy",
      enemyId: "hide-gator",
      enemyKind: "fire-alligator",
      enemyHp: new Decimal(1),
      enemyPart: 0,
    };
    room.tiles[5][5] = {
      kind: "enemy",
      enemyId: "hide-gator",
      enemyKind: "fire-alligator",
      enemyHp: new Decimal(1),
      enemyPart: 1,
    };
    const defeated = moveInAdventure(
      testAdventure(room, { x: 4, y: 4 }),
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0,
    );
    expect(defeated.materialGained).toBe("fire-alligator-hide");
    expect(currentAdventureRoom(defeated.state).tiles.flat().some((tile) =>
      tile.enemyId === "hide-gator"
    )).toBe(false);
  });

  it("rolls the post-Battle-9 Dice room from its center and shares one room-count curse", () => {
    expect(currentAdventureRoom(
      exploreUntilSecondRoom(() => 0.13, knight.stats, [8]),
    ).kind).not.toBe("dice");
    expect(currentAdventureRoom(
      exploreUntilSecondRoom(() => 0.13, knight.stats, [9]),
    ).kind).toBe("dice");

    const tiles = createDiceRoomTiles(11);
    expect(tiles.flat().filter((tile) => tile.kind === "diceDisplay" && tile.diceIndex === 0)).toHaveLength(9);
    expect(tiles.flat().filter((tile) => tile.kind === "diceDisplay" && tile.diceIndex === 1)).toHaveLength(9);
    expect(tiles[4][2]).toMatchObject({ kind: "diceDisplay", diceIndex: 0, dicePartX: 0, dicePartY: 0 });
    expect(tiles[4][6]).toMatchObject({ kind: "diceDisplay", diceIndex: 1, dicePartX: 0, dicePartY: 0 });
    expect(tiles[5][5]).toEqual({ kind: "dicePedestal" });
    tiles[0][5] = { kind: "diceGate", exitDirection: "north" };
    tiles[10][5] = { kind: "diceGate", exitDirection: "south" };
    const room: DungeonRoom = {
      key: "10,0",
      number: 42,
      position: { x: 10, y: 0 },
      width: 11,
      height: 11,
      tiles,
      exits: [
        { direction: "north", position: { x: 5, y: 0 } },
        { direction: "south", position: { x: 5, y: 10 } },
      ],
      ring: 4,
      kind: "dice",
      regenUsedBy: [],
      diceRolled: false,
    };
    const rolled = moveInAdventure(
      testAdventure(room, { x: 5, y: 4 }),
      { x: 5, y: 5 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(rolled.diceCurseRoll).toBeUndefined();
    expect(currentAdventureRoom(rolled.state).diceValue).toBe(8);
    expect(currentAdventureRoom(rolled.state).diceValues).toEqual([4, 4]);
    expect(currentAdventureRoom(rolled.state).diceRolling).toBe(true);
    expect(currentAdventureRoom(rolled.state).tiles.flat().filter((tile) =>
      tile.kind === "diceGate"
    )).toHaveLength(2);
    const settled = settleDiceRoomRoll(rolled.state);
    expect(currentAdventureRoom(settled).diceRolling).toBe(false);
    expect(currentAdventureRoom(settled).tiles.flat().filter((tile) =>
      tile.kind === "diceGate"
    )).toHaveLength(0);
    expect(currentAdventureRoom(settled).tiles.flat().filter((tile) =>
      tile.kind === "exit"
    )).toHaveLength(2);
    expect(settled.log.filter((entry) => /weakening curse/i.test(entry))).toHaveLength(1);

    const curse = createAdventureDiceCurse(3);
    const weakened = diceCursedAdventureStats(knight.stats, curse);
    expect(weakened.hp.eq(knight.stats.hp)).toBe(true);
    expect(weakened.stamina.eq(knight.stats.stamina)).toBe(true);
    expect(weakened.attack.eq(knight.stats.attack.mul(0.75))).toBe(true);
    expect(weakened.defense.eq(knight.stats.defense.mul(0.75))).toBe(true);
    expect(weakened.spAttack.eq(knight.stats.spAttack.mul(0.75))).toBe(true);
    expect(weakened.spDefense.eq(knight.stats.spDefense.mul(0.75))).toBe(true);
    expect(weakened.speed.eq(knight.stats.speed.mul(0.75))).toBe(true);
    expect(weakened.luck.eq(knight.stats.luck.mul(0.75))).toBe(true);
    const afterOneExplorer = advanceAdventureDiceCurse(curse)!;
    const afterAnotherExplorer = advanceAdventureDiceCurse(afterOneExplorer)!;
    expect(afterOneExplorer.turnsRemaining).toBe(2);
    expect(afterAnotherExplorer.turnsRemaining).toBe(1);
    expect(advanceAdventureDiceCurse(afterAnotherExplorer)).toBeNull();
  });

  it("defines Fire Alligators as a major zone-4 jump with a 1x2 footprint", () => {
    expect(fireAlligator.footprintWidth).toBe(1);
    expect(fireAlligator.footprintHeight).toBe(2);
    expect(fireAlligator.attackType).toBe("special");
    expect(adventureEnemyStats(4, "fire-alligator").hp.gt(
      adventureEnemyStats(3, "clay-golem").hp,
    )).toBe(true);
    expect(adventureEnemyStats(4, "fire-alligator").spAttack.gt(
      adventureEnemyStats(3, "clay-golem").spAttack,
    )).toBe(true);
  });

  it("always mirrors exits already pointing at a newly generated room", () => {
    const westRoom = emptyTestRoom(0, { x: -1, y: 0 });
    westRoom.exits = [{ direction: "east", position: { x: 8, y: 3 } }];
    const southRoom = emptyTestRoom(0, { x: 0, y: 1 });
    southRoom.exits = [{ direction: "north", position: { x: 5, y: 0 } }];
    const northRoom = emptyTestRoom(0, { x: 0, y: -1 });

    const exits = chooseExitDirections(
      0,
      { x: 0, y: 0 },
      "west",
      {
        [westRoom.key]: westRoom,
        [southRoom.key]: southRoom,
        [northRoom.key]: northRoom,
      },
      () => 0.99,
    );

    expect(exits).toContain("west");
    expect(exits).toContain("south");
    expect(exits).not.toContain("north");
  });

  it("makes two-exit rooms common, three-exit rooms slightly more common than dead ends, and four rarest", () => {
    const random = seededRandom(4107);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (let sample = 0; sample < 20_000; sample += 1) {
      counts[rollRoomExitCount(random)] += 1;
    }
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(counts[2]).toBeGreaterThan(counts[3]);
    expect(counts[3]).toBeGreaterThan(counts[1]);
    expect(counts[3] - counts[1]).toBeGreaterThan(1_500);
    expect(counts[3] - counts[1]).toBeLessThan(2_500);
    expect(counts[4]).toBeLessThan(counts[1]);
    expect(counts[4]).toBeLessThan(counts[3]);
  });

  it("makes a straight-through exit least likely after the room's first entrance", () => {
    const random = seededRandom(8821);
    const optionalExits = { north: 0, south: 0, west: 0 };
    for (let sample = 0; sample < 30_000; sample += 1) {
      const exits = chooseExitDirections(
        1,
        { x: 1, y: 0 },
        "east",
        {},
        random,
      );
      if (exits.length !== 2) continue;
      const optional = exits.find((direction) => direction !== "east");
      if (optional === "north" || optional === "south" || optional === "west") {
        optionalExits[optional] += 1;
      }
    }
    expect(optionalExits.west).toBeLessThan(optionalExits.north);
    expect(optionalExits.west).toBeLessThan(optionalExits.south);
    expect(optionalExits.west * 3).toBeLessThan(optionalExits.north);
    expect(optionalExits.west * 3).toBeLessThan(optionalExits.south);
    expect(Math.abs(optionalExits.north - optionalExits.south)).toBeLessThan(300);
  });

  it("does not close the dungeon when generating its final frontier room", () => {
    const start = emptyTestRoom(0, { x: 0, y: 0 });
    start.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    const exits = chooseExitDirections(
      1,
      { x: 1, y: 0 },
      "west",
      { [start.key]: start },
      () => 0.6,
    );
    expect(exits).toContain("west");
    expect(exits).toHaveLength(2);
  });

  it("adds an outward exit when a new room inherits three entrances at the final frontier", () => {
    const north = emptyTestRoom(0, { x: 0, y: -1 });
    north.exits = [{ direction: "south", position: { x: 4, y: 8 } }];
    const south = emptyTestRoom(0, { x: 0, y: 1 });
    south.exits = [{ direction: "north", position: { x: 4, y: 0 } }];
    const west = emptyTestRoom(0, { x: -1, y: 0 });
    west.exits = [{ direction: "east", position: { x: 8, y: 4 } }];

    const exits = chooseExitDirections(
      1,
      { x: 0, y: 0 },
      "west",
      { [north.key]: north, [south.key]: south, [west.key]: west },
      () => 0.1,
    );

    expect(exits).toEqual(expect.arrayContaining(["north", "east", "south", "west"]));
    expect(exits).toHaveLength(4);
  });

  it("repairs an already-locked explored map without changing special dead ends", () => {
    const start = emptyTestRoom(1, { x: 0, y: 0 });
    const north = emptyTestRoom(2, { x: 0, y: -1 });
    const east = emptyTestRoom(3, { x: 1, y: 0 });
    const south = emptyTestRoom(4, { x: 0, y: 1 });
    const westTreasure = emptyTestRoom(5, { x: -1, y: 0 });
    westTreasure.kind = "treasure";
    start.exits = [
      { direction: "north", position: { x: 4, y: 0 } },
      { direction: "east", position: { x: 8, y: 4 } },
      { direction: "south", position: { x: 4, y: 8 } },
      { direction: "west", position: { x: 0, y: 4 } },
    ];
    north.exits = [{ direction: "south", position: { x: 4, y: 8 } }];
    east.exits = [{ direction: "west", position: { x: 0, y: 4 } }];
    south.exits = [{ direction: "north", position: { x: 4, y: 0 } }];
    westTreasure.exits = [{ direction: "east", position: { x: 8, y: 4 } }];
    const state = testAdventure(start, { x: 4, y: 4 });
    state.rooms = Object.fromEntries([start, north, east, south, westTreasure].map((room) => [room.key, room]));
    state.currentRoomKey = east.key;
    state.playerPosition = { x: 4, y: 4 };

    expect(hasViableUnexploredFrontier(state.rooms)).toBe(false);
    const repaired = repairAdventureFrontier(state);
    expect(hasViableUnexploredFrontier(repaired.rooms)).toBe(true);
    expect(repaired.rooms[westTreasure.key].exits).toHaveLength(1);
    expect(repaired.rooms[east.key].exits.length).toBeGreaterThan(1);
  });

  it("does not mistake an interior pocket for an outward dungeon frontier", () => {
    const rooms: Record<string, DungeonRoom> = {};
    let roomNumber = 1;
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        if ((x === 0 || x === 1) && y === 0) continue;
        const room = emptyTestRoom(roomNumber, { x, y });
        roomNumber += 1;
        rooms[room.key] = room;
      }
    }
    const exitPosition = (direction: ExitDirection) => direction === "north"
      ? { x: 4, y: 0 }
      : direction === "east"
        ? { x: 8, y: 4 }
        : direction === "south"
          ? { x: 4, y: 8 }
          : { x: 0, y: 4 };
    const directions: Array<[ExitDirection, number, number]> = [
      ["north", 0, -1],
      ["east", 1, 0],
      ["south", 0, 1],
      ["west", -1, 0],
    ];
    for (const room of Object.values(rooms)) {
      room.exits = directions
        .filter(([, xOffset, yOffset]) => rooms[`${room.position.x + xOffset},${room.position.y + yOffset}`])
        .map(([direction]) => ({ direction, position: exitPosition(direction) }));
    }
    const interiorNeighbor = rooms["-1,0"];
    interiorNeighbor.exits.push({ direction: "east", position: { x: 8, y: 4 } });
    const current = rooms["2,0"];
    const state = testAdventure(current, { x: 4, y: 4 });
    state.rooms = rooms;
    state.currentRoomKey = current.key;

    expect(hasViableUnexploredFrontier(state.rooms, null, current.key)).toBe(false);
    const repaired = repairAdventureFrontier(state);
    expect(hasViableUnexploredFrontier(repaired.rooms, null, current.key)).toBe(true);
    expect(repaired.rooms[current.key].exits).toContainEqual({
      direction: "east",
      position: { x: 8, y: 4 },
    });
  });

  it("auto pathfinding explores open rooms of the correct ring size without walking into walls", () => {
    const random = seededRandom(1729);
    const pathfinderStats = {
      ...knight.stats,
      attack: new Decimal(1e6),
      spAttack: new Decimal(1e6),
      speed: new Decimal(1e4),
    };
    let adventure: AdventureState = startAdventure(pathfinderStats, random);
    let hp = new Decimal(1e9);
    let moves = 0;

    while (Object.keys(adventure.rooms).length < 30 && moves < 20_000) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        expect(destination).not.toBeNull();
        const room = currentAdventureRoom(adventure);
        expect(room.tiles[destination!.y][destination!.x].kind).not.toBe("wall");
        const result = moveInAdventure(
          adventure,
          destination!,
          pathfinderStats,
          hp,
          new Decimal(1e9),
          random,
        );
        expect(result.error).toBeUndefined();
        adventure = result.state;
        hp = result.hp;
      } else {
        const result = performAdventureEnemyTurn(
          adventure,
          pathfinderStats,
          hp,
          new Decimal(1e9),
        );
        adventure = result.state;
        hp = result.hp;
      }
      moves += 1;
    }

    expect(Object.keys(adventure.rooms)).toHaveLength(30);
    const rooms = Object.values(adventure.rooms);
    expect(rooms.every((room) => {
      const expectedSize = room.ring >= 4 ? 11 : 9;
      return room.width === expectedSize && room.height === expectedSize;
    })).toBe(true);
    expect(rooms.every((room) => openInteriorRatio(room) >= 0.65)).toBe(true);
    const normalRoomWallCounts = rooms
      .filter((room) => room.number > 1 && room.kind === "normal")
      .map((room) => room.tiles.slice(1, -1).reduce(
        (count, row) => count + row.slice(1, -1).filter((tile) => tile.kind === "wall").length,
        0,
      ));
    expect(normalRoomWallCounts.reduce((total, count) => total + count, 0) / normalRoomWallCounts.length)
      .toBeGreaterThanOrEqual(4);
    expect(rooms.every((room) =>
      room.ring === ringForPosition(room.position)
    )).toBe(true);
    expect(rooms.every((room) => allNonWallTilesReachable(room))).toBe(true);
    for (const room of rooms) {
      for (const exit of room.exits) {
        const offset = exit.direction === "north"
          ? { x: 0, y: -1 }
          : exit.direction === "east"
            ? { x: 1, y: 0 }
            : exit.direction === "south"
              ? { x: 0, y: 1 }
              : { x: -1, y: 0 };
        const neighbor = adventure.rooms[
          `${room.position.x + offset.x},${room.position.y + offset.y}`
        ];
        if (!neighbor) continue;
        const reciprocal = exit.direction === "north"
          ? "south"
          : exit.direction === "east"
            ? "west"
            : exit.direction === "south"
              ? "north"
              : "east";
        expect(neighbor.exits.some((candidate) => candidate.direction === reciprocal)).toBe(true);
      }
    }
    const reachableRoomKeys = new Set<string>(["0,0"]);
    const pendingRoomKeys = ["0,0"];
    while (pendingRoomKeys.length > 0) {
      const roomKey = pendingRoomKeys.shift()!;
      const reachableRoom = adventure.rooms[roomKey];
      for (const exit of reachableRoom.exits) {
        const offset = exit.direction === "north"
          ? { x: 0, y: -1 }
          : exit.direction === "east"
            ? { x: 1, y: 0 }
            : exit.direction === "south"
              ? { x: 0, y: 1 }
              : { x: -1, y: 0 };
        const neighborKey = `${reachableRoom.position.x + offset.x},${reachableRoom.position.y + offset.y}`;
        if (!adventure.rooms[neighborKey] || reachableRoomKeys.has(neighborKey)) continue;
        reachableRoomKeys.add(neighborKey);
        pendingRoomKeys.push(neighborKey);
      }
    }
    expect(reachableRoomKeys.size).toBe(rooms.length);
    expect(hasViableUnexploredFrontier(adventure.rooms, adventure.questTarget)).toBe(true);
  });

  it("spends one stamina every five actions and reports exhaustion at zero", () => {
    const random = () => 0.99;
    let adventure = startAdventure(knight.stats, random);
    let stamina = new Decimal(1);

    for (let action = 1; action <= 5; action += 1) {
      const destination = suggestAdventureMove(adventure)!;
      const result = moveInAdventure(
        adventure,
        destination,
        knight.stats,
        knight.stats.hp,
        stamina,
        random,
      );
      adventure = result.state;
      stamina = result.stamina;
      expect(adventure.staminaActionProgress).toBe(action % 5);
      expect(result.exhausted).toBe(action === 5);
    }

    expect(stamina.eq(0)).toBe(true);
    expect(adventure.steps).toBe(5);
  });

  it("passes a player turn without moving or spending stamina actions", () => {
    const room = emptyTestRoom(1);
    const adventure = testAdventure(room, { x: 4, y: 4 });
    const beforeReadyAt = adventure.readyAt[ADVENTURE_KNIGHT_ID];

    const passed = passAdventureTurn(adventure, knight.stats);

    expect(passed.playerPosition).toEqual({ x: 4, y: 4 });
    expect(passed.steps).toBe(0);
    expect(passed.staminaActionProgress).toBe(0);
    expect(passed.readyAt[ADVENTURE_KNIGHT_ID].gt(beforeReadyAt)).toBe(true);
    expect(passed.log).toEqual(adventure.log);
  });

  it("waits on a portal tile instead of shuffling across the platform", () => {
    const room = emptyTestRoom(2);
    room.kind = "portal";
    room.tiles[4][4] = { kind: "portal", portalPartX: 1, portalPartY: 1 };
    const adventure = testAdventure(room, { x: 4, y: 4 });

    expect(suggestAdventureMove(adventure)).toBeNull();
    const passed = passAdventureTurn(adventure, knight.stats);
    expect(passed.playerPosition).toEqual(adventure.playerPosition);
    expect(passed.log).toEqual(adventure.log);
  });

  it("overrides exploration strategy to clear a locked throne room and claim its chest", () => {
    const room = emptyTestRoom(0);
    room.kind = "mermanThrone";
    room.tiles[4][6] = {
      kind: "enemy",
      enemyId: "locked-merman",
      enemyKind: "merman",
      enemyHp: adventureEnemyStats(0, "merman").hp,
    };
    const adventure = testAdventure(room, { x: 2, y: 4 });
    expect(suggestAdventureMove(adventure, {
      preferredDirection: "west",
      avoidManualInteractions: true,
    })).toEqual({ x: 3, y: 4 });

    room.tiles[4][6] = { kind: "tridentChest" };
    expect(suggestAdventureMove(adventure, {
      preferredDirection: "west",
      avoidManualInteractions: true,
    })).toEqual({ x: 3, y: 4 });
  });

  it("only pauses auto when first entering a sealed offering room from the dungeon", () => {
    const ordinaryRoom = emptyTestRoom(0, { x: 0, y: 0 });
    const offeringRoom = emptyTestRoom(0, { x: 0, y: -1 });
    offeringRoom.kind = "offering";
    offeringRoom.offeringDoorOpened = false;
    const throneRoom = emptyTestRoom(0, { x: 0, y: -2 });
    throneRoom.kind = "mermanThrone";

    expect(shouldPauseAutoForOfferingEntry(ordinaryRoom, offeringRoom)).toBe(true);
    expect(shouldPauseAutoForOfferingEntry(throneRoom, offeringRoom)).toBe(false);
    offeringRoom.offeringDoorOpened = true;
    expect(shouldPauseAutoForOfferingEntry(ordinaryRoom, offeringRoom)).toBe(false);
  });

  it("counts an attack toward stamina without immediately spending a point", () => {
    const room = openTestRoom(0, { x: 3, y: 2 });
    const adventure = testAdventure(room, { x: 2, y: 2 });
    const target = suggestAdventureMove(adventure);
    expect(target).toEqual({ x: 3, y: 2 });
    const result = moveInAdventure(
      adventure,
      target!,
      knight.stats,
      knight.stats.hp,
      new Decimal(7),
      () => 0.99,
    );
    expect(result.stamina.eq(7)).toBe(true);
    expect(result.state.staminaActionProgress).toBe(1);
    expect(result.state.steps).toBe(0);
    expect(result.state.log[0]).toMatch(/Knight (hits|defeats) a Rat/);
  });

  it("drops a Rat Pelt when a Rat is defeated", () => {
    const room = openTestRoom(0, { x: 3, y: 2 });
    room.tiles[2][3].enemyHp = new Decimal(1);
    const result = moveInAdventure(
      testAdventure(room, { x: 2, y: 2 }),
      { x: 3, y: 2 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(result.materialGained).toBe("rat-pelt");
  });

  it("drops Ant Chitin when a ring-2 Ant is defeated", () => {
    const room = openTestRoom(2, { x: 3, y: 2 });
    room.tiles[2][3].enemyHp = new Decimal(1);
    const result = moveInAdventure(
      testAdventure(room, { x: 2, y: 2 }),
      { x: 3, y: 2 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(result.materialGained).toBe("ant-chitin");
    expect(result.state.log[0]).toMatch(/defeats an Ant/);
  });

  it("drops an Ink Sac when a Water Dungeon Octopus is defeated", () => {
    const room = openTestRoom(0, { x: 3, y: 2 });
    room.tiles[2][3].enemyKind = "octopus";
    room.tiles[2][3].enemyHp = new Decimal(1);
    const result = moveInAdventure(
      { ...testAdventure(room, { x: 2, y: 2 }), dungeonTheme: "water" },
      { x: 3, y: 2 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(result.materialGained).toBe("ink-sac");
    expect(result.state.log[0]).toMatch(/Obtained Ink Sac/);
  });

  it("moves enemies toward the Knight after each valid step", () => {
    const room = openTestRoom(0, { x: 6, y: 2 });
    const adventure = testAdventure(room, { x: 2, y: 2 });
    const playerResult = moveInAdventure(
      adventure,
      { x: 3, y: 2 },
      knight.stats,
      new Decimal(999),
      new Decimal(10),
      () => 0.99,
    );
    const enemyResult = performAdventureEnemyTurn(
      playerResult.state,
      knight.stats,
      playerResult.hp,
      playerResult.stamina,
    );
    const movedRoom = currentAdventureRoom(enemyResult.state);
    expect(movedRoom.tiles[2][6].kind).toBe("floor");
    expect(movedRoom.tiles[2][5].kind).toBe("enemy");
  });

  it("does not route around hidden spikes and reveals them when the Knight steps on them", () => {
    const room = emptyTestRoom(0);
    room.tiles[2][3] = { kind: "trap" };
    room.tiles[2][4] = { kind: "gold" };
    const adventure = testAdventure(room, { x: 2, y: 2 });

    expect(suggestAdventureMove(adventure)).toEqual({ x: 3, y: 2 });
    const result = moveInAdventure(
      adventure,
      { x: 3, y: 2 },
      knight.stats,
      knight.stats.hp,
      new Decimal(10),
      () => 0.99,
    );

    const triggered = currentAdventureRoom(result.state).tiles[2][3];
    expect(triggered.kind).toBe("trap");
    expect(triggered.revealed).toBe(true);
    expect(result.hp.lt(knight.stats.hp)).toBe(true);
    expect(result.state.staminaActionProgress).toBe(2);
  });

  it("lets Shaman's Ring replace trap damage with a safe random teleport", () => {
    const room = emptyTestRoom(0);
    room.tiles[2][3] = { kind: "trap" };
    const rolls = [0.99, 0.1, 0];
    const result = moveInAdventure(
      testAdventure(room, { x: 2, y: 2 }),
      { x: 3, y: 2 },
      knight.stats,
      knight.stats.hp,
      new Decimal(10),
      () => rolls.shift() ?? 0,
      [],
      false,
      false,
      true,
    );
    expect(result.hp.eq(knight.stats.hp)).toBe(true);
    expect(result.state.playerPosition).not.toEqual({ x: 3, y: 2 });
    expect(currentAdventureRoom(result.state).tiles[result.state.playerPosition.y][result.state.playerPosition.x].kind)
      .toBe("floor");
    expect(result.state.log[0]).toMatch(/Shaman's Ring teleported/);
  });

  it("reveals spikes and damages an enemy that steps on them", () => {
    const room = openTestRoom(0, { x: 4, y: 2 });
    room.tiles[2][3] = { kind: "trap" };
    const adventure = testAdventure(room, { x: 2, y: 2 }, "test-goblin");
    const result = performAdventureEnemyTurn(
      adventure,
      knight.stats,
      knight.stats.hp,
      new Decimal(10),
    );
    const enemyOnSpikes = currentAdventureRoom(result.state).tiles[2][3];

    expect(enemyOnSpikes.kind).toBe("enemy");
    expect(enemyOnSpikes.underlyingKind).toBe("trap");
    expect(enemyOnSpikes.underlyingTrapRevealed).toBe(true);
    expect(enemyOnSpikes.enemyHp!.lt(adventureEnemyStats(0).hp)).toBe(true);
    expect(result.state.log[0]).toMatch(/stepped on hidden spikes/);
  });

  it("makes enemy attacks stronger in farther rings", () => {
    const startingHp = new Decimal(999);
    const near = performAdventureEnemyTurn(
      testAdventure(openTestRoom(0, { x: 3, y: 3 }), { x: 2, y: 3 }, "test-goblin"),
      knight.stats,
      startingHp,
      new Decimal(7),
    );
    const far = performAdventureEnemyTurn(
      testAdventure(openTestRoom(3, { x: 3, y: 3 }), { x: 2, y: 3 }, "test-goblin"),
      knight.stats,
      startingHp,
      new Decimal(7),
    );
    expect(far.hp.lt(near.hp)).toBe(true);
  });

  it("gives active Mystery Potions a five-percent chance to dodge direct Adventure attacks", () => {
    const startingHp = new Decimal(999);
    const result = performAdventureEnemyTurn(
      testAdventure(openTestRoom(0, { x: 3, y: 3 }), { x: 2, y: 3 }, "test-goblin"),
      knight.stats,
      startingHp,
      new Decimal(7),
      [],
      false,
      () => 0.049,
      false,
      0.05,
    );
    expect(result.hp.eq(startingHp)).toBe(true);
    expect(result.stamina.eq(7)).toBe(true);
    expect(result.state.log[0]).toMatch(/Mystery Potion/i);
  });

  it("lets Shaman's Ring replace enemy damage with a safe random teleport", () => {
    const startingHp = new Decimal(999);
    const result = performAdventureEnemyTurn(
      testAdventure(openTestRoom(0, { x: 3, y: 3 }), { x: 2, y: 3 }, "test-goblin"),
      knight.stats,
      startingHp,
      new Decimal(7),
      [],
      true,
      () => 0.1,
    );
    expect(result.hp.eq(startingHp)).toBe(true);
    expect(result.state.playerPosition).not.toEqual({ x: 2, y: 3 });
    expect(result.state.log[0]).toMatch(/Shaman's Ring teleports/);
  });

  it("makes ring-3 Clay Golems 2–3× slower than the Knight with a major damage jump", () => {
    const antStats = adventureEnemyStats(2, "ant");
    const golemStats = adventureEnemyStats(3, "clay-golem");
    expect(antStats.hp.eq(65)).toBe(true);
    expect(antStats.attack.eq(14)).toBe(true);
    expect(golemStats.hp.eq(240)).toBe(true);
    expect(golemStats.spAttack.eq(48)).toBe(true);
    expect(golemStats.defense.eq(29)).toBe(true);
    const speedRatio = knight.stats.speed.div(golemStats.speed);
    expect(speedRatio.gte(1.75)).toBe(true);
    expect(speedRatio.lte(3)).toBe(true);

    const startingHp = new Decimal(200);
    const antRoom = openTestRoom(2, { x: 3, y: 2 });
    antRoom.tiles[2][3].enemyKind = "ant";
    const antResult = performAdventureEnemyTurn(
      testAdventure(antRoom, { x: 2, y: 2 }, "test-goblin"),
      knight.stats,
      startingHp,
      new Decimal(10),
    );
    const golemRoom = openTestRoom(3, { x: 6, y: 6 });
    golemRoom.tiles[6][6].enemyKind = "clay-golem";
    const golemResult = performAdventureEnemyTurn(
      testAdventure(golemRoom, { x: 2, y: 2 }, "test-goblin"),
      knight.stats,
      startingHp,
      new Decimal(10),
    );
    expect(startingHp.sub(golemResult.hp).gt(startingHp.sub(antResult.hp).mul(2))).toBe(true);
    expect(golemResult.state.log[0]).toMatch(/Crimson Beam/);
  });

  it("fires a Clay Golem laser diagonally through the Knight until the next wall", () => {
    const room = openTestRoom(3, { x: 6, y: 6 });
    room.tiles[6][6].enemyKind = "clay-golem";
    const result = performAdventureEnemyTurn(
      testAdventure(room, { x: 2, y: 2 }, "test-goblin"),
      knight.stats,
      new Decimal(100),
      new Decimal(10),
    );
    expect(result.hp.lt(100)).toBe(true);
    expect(result.state.lastProjectile).toEqual({
      from: { x: 6, y: 6 },
      to: { x: 1, y: 1 },
      kind: "laser",
    });
  });

  it("blocks a Clay Golem laser with walls", () => {
    const room = openTestRoom(3, { x: 6, y: 6 });
    room.tiles[6][6].enemyKind = "clay-golem";
    room.tiles[4][4] = { kind: "wall" };
    const result = performAdventureEnemyTurn(
      testAdventure(room, { x: 2, y: 2 }, "test-goblin"),
      knight.stats,
      new Decimal(100),
      new Decimal(10),
    );
    expect(result.hp.eq(100)).toBe(true);
    expect(result.state.lastProjectile).toBeNull();
  });

  it("can generate a peaceful treasure room without guaranteeing one", () => {
    const rare = exploreUntilSecondRoom(() => 0);
    expect(currentAdventureRoom(rare).kind).toBe("treasure");
    expect(currentAdventureRoom(rare).exits).toHaveLength(1);
    expect(currentAdventureRoom(rare).tiles.flat().some((tile) => tile.kind === "treasureChest")).toBe(true);
    expect(currentAdventureRoom(rare).tiles.flat().some(
      (tile) => tile.kind === "enemy" || tile.kind === "trap" || tile.kind === "gold",
    )).toBe(false);

    const ordinary = exploreUntilSecondRoom(() => 0.99);
    expect(currentAdventureRoom(ordinary).kind).toBe("normal");
  });

  it("only disguises Mimics as treasure after Battle 7", () => {
    const beforeUnlock = currentAdventureRoom(exploreUntilSecondRoom(() => 0, knight.stats, [6]));
    expect(beforeUnlock.kind).toBe("treasure");
    expect(beforeUnlock.tiles[4][4].mimicDisguise).toBe(false);

    const afterUnlock = currentAdventureRoom(exploreUntilSecondRoom(() => 0, knight.stats, [7]));
    expect(afterUnlock.kind).toBe("treasure");
    expect(afterUnlock.tiles[4][4]).toMatchObject({
      kind: "treasureChest",
      mimicDisguise: true,
    });
  });

  it("reveals a disguised Mimic without moving or awarding treasure", () => {
    const room = emptyTestRoom(1);
    room.kind = "treasure";
    room.tiles[4][4] = { kind: "treasureChest", mimicDisguise: true };
    const result = moveInAdventure(
      testAdventure(room, { x: 3, y: 4 }),
      { x: 4, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    const revealed = currentAdventureRoom(result.state).tiles[4][4];
    expect(result.state.playerPosition).toEqual({ x: 3, y: 4 });
    expect(result.gearFound).toBeNull();
    expect(revealed).toMatchObject({ kind: "enemy", enemyKind: "mimic" });
    expect(revealed.enemyHp?.eq(adventureEnemyStats(1, "mimic").hp)).toBe(true);
    expect(result.state.activeActorId).toBe(revealed.enemyId);
    expect(result.state.log[0]).toMatch(/Mimic/i);
  });

  it("makes even a zone-one Mimic stronger and faster than Battle 7 summons", () => {
    const zoneOne = adventureEnemyStats(1, "mimic");
    const summons = [fireAnt, alligator, dragonfly, bee];
    expect(summons.every((enemy) => zoneOne.hp.gt(enemy.stats.hp))).toBe(true);
    expect(summons.every((enemy) => zoneOne.attack.gt(enemy.stats.attack))).toBe(true);
    expect(summons.every((enemy) => zoneOne.speed.gt(enemy.stats.speed))).toBe(true);
    expect(adventureEnemyStats(3, "mimic").hp.gt(zoneOne.hp)).toBe(true);
    expect(adventureEnemyStats(3, "mimic").attack.gt(zoneOne.attack)).toBe(true);
    expect(adventureEnemyStats(3, "mimic").speed.gt(zoneOne.speed)).toBe(true);
  });

  it("leaves an opened chest sprite after ordinary loot is claimed", () => {
    const treasureRoom = emptyTestRoom(1);
    treasureRoom.kind = "treasure";
    treasureRoom.tiles[4][4] = { kind: "treasureChest", gearSlot: "helmet" };
    const treasure = moveInAdventure(
      testAdventure(treasureRoom, { x: 3, y: 4 }),
      { x: 4, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(treasure.gearFound).not.toBeNull();
    expect(currentAdventureRoom(treasure.state).tiles[4][4].kind).toBe("openedChest");

  });

  it("completes the fishing-rod quest by speaking with its one-time NPC", () => {
    const lostRoom = emptyTestRoom(0);
    lostRoom.kind = "lostItem";
    lostRoom.tiles[4][4] = { kind: "rodKeeper" };
    const adventure = {
      ...testAdventure(lostRoom, { x: 3, y: 4 }),
      dungeonTheme: "water" as const,
      lostItemRoomNumber: 8,
      // Portal dungeons do not inherit the marked route from the earth dungeon.
      questTarget: null,
    };
    const lost = moveInAdventure(
      adventure,
      { x: 4, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(lost.completedQuestId).toBe("retrieve-lost-item");
    expect(lost.state.questTarget).toBeNull();
    expect(currentAdventureRoom(lost.state).tiles[4][4].kind).toBe("rodKeeper");
  });

  it("can generate a hot spring room that restores stamina only once", () => {
    const generated = exploreUntilSecondRoom(() => 0.04);
    const generatedRoom = currentAdventureRoom(generated);
    expect(generatedRoom.kind).toBe("regen");
    expect(generatedRoom.tiles.flat().filter((tile) => tile.kind === "regen")).toHaveLength(9);

    const room = emptyTestRoom(0);
    room.kind = "regen";
    room.tiles = createRegenRoomTiles();
    const adventure = testAdventure(room, { x: 2, y: 4 });
    const first = moveInAdventure(
      adventure,
      { x: 3, y: 4 },
      knight.stats,
      knight.stats.hp,
      new Decimal(3),
      () => 0.99,
    );
    expect(first.stamina.eq(18)).toBe(true);
    expect(currentAdventureRoom(first.state).regenUsedBy).toEqual([ADVENTURE_KNIGHT_ID]);

    const second = moveInAdventure(
      first.state,
      { x: 4, y: 4 },
      knight.stats,
      first.hp,
      first.stamina,
      () => 0.99,
    );
    expect(second.stamina.eq(first.stamina)).toBe(true);
    expect(currentAdventureRoom(second.state).regenUsedBy).toEqual([ADVENTURE_KNIGHT_ID]);
  });

  it("keeps hot spring terrain intact when an enemy crosses it", () => {
    const room = emptyTestRoom(0);
    room.kind = "regen";
    room.tiles = createRegenRoomTiles();
    room.tiles[4][2] = {
      kind: "enemy",
      enemyId: "test-goblin",
      enemyHp: adventureEnemyStats(0).hp,
    };
    const adventure = testAdventure(room, { x: 6, y: 4 }, "test-goblin");
    const moved = performAdventureEnemyTurn(
      adventure,
      knight.stats,
      knight.stats.hp,
      new Decimal(10),
    );
    const enemyOnSpring = currentAdventureRoom(moved.state).tiles[4][3];

    expect(enemyOnSpring.kind).toBe("enemy");
    expect(enemyOnSpring.underlyingKind).toBe("regen");
    expect(enemyOnSpring.underlyingRegenPartX).toBe(0);
    expect(enemyOnSpring.underlyingRegenPartY).toBe(1);
  });

  it("marks a reachable inner-ring-2 rescue room and generates it as a dead end", () => {
    const random = () => 0;
    let adventure = startAdventure(knight.stats, random, 0, "rescue-me");
    expect(adventure.questTarget).not.toBeNull();
    expect(ringForPosition(adventure.questTarget!.position)).toBe(2);
    expect(Math.max(
      Math.abs(adventure.questTarget!.position.x),
      Math.abs(adventure.questTarget!.position.y),
    )).toBe(4);

    for (let step = 0; step < 2_000 && currentAdventureRoom(adventure).kind !== "rescue"; step += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        expect(destination).not.toBeNull();
        adventure = moveInAdventure(
          adventure,
          destination!,
          knight.stats,
          new Decimal(1e9),
          new Decimal(1e9),
          random,
        ).state;
      } else {
        adventure = performAdventureEnemyTurn(
          adventure,
          knight.stats,
          new Decimal(1e9),
          new Decimal(1e9),
        ).state;
      }
    }

    const rescueRoom = currentAdventureRoom(adventure);
    expect(rescueRoom.kind).toBe("rescue");
    expect(rescueRoom.exits).toHaveLength(1);
    expect(rescueRoom.tiles.flat().filter((tile) => tile.kind === "cage")).toHaveLength(1);
    const spiderTiles = rescueRoom.tiles.flat().filter((tile) => tile.enemyKind === "spider");
    expect(spiderTiles).toHaveLength(7);
    expect(spiderTiles.every((tile) => tile.enemyHp?.eq(adventureEnemyStats(2, "spider").hp))).toBe(true);
    for (const pathPosition of adventure.questTarget!.path) {
      expect(adventure.rooms[`${pathPosition.x},${pathPosition.y}`]).toBeDefined();
    }
    expect(adventure.questTarget!.path.slice(0, -1).every((pathPosition) =>
      adventure.rooms[`${pathPosition.x},${pathPosition.y}`].kind === "normal"
    )).toBe(true);
  });

  it("places the rescue room across the inner edge of ring 2 with a legal modestly bent route", () => {
    let foundDiagonal = false;
    let foundDetour = false;
    for (let seed = 1; seed <= 30; seed += 1) {
      const target = startAdventure(knight.stats, seededRandom(seed), 0, "rescue-me").questTarget!;
      const manhattan = Math.abs(target.position.x) + Math.abs(target.position.y);
      expect(Math.max(Math.abs(target.position.x), Math.abs(target.position.y))).toBe(4);
      expect(manhattan).toBeGreaterThanOrEqual(4);
      expect(manhattan).toBeLessThanOrEqual(7);
      expect(target.path.length).toBeGreaterThanOrEqual(manhattan);
      expect(target.path.length).toBeLessThanOrEqual(manhattan + 2);
      expect(target.path[target.path.length - 1]).toEqual(target.position);
      let previous = { x: 0, y: 0 };
      const visited = new Set([`${previous.x},${previous.y}`]);
      for (const step of target.path) {
        expect(Math.abs(step.x - previous.x) + Math.abs(step.y - previous.y)).toBe(1);
        expect(visited.has(`${step.x},${step.y}`)).toBe(false);
        visited.add(`${step.x},${step.y}`);
        previous = step;
      }
      if (target.position.x !== 0 && target.position.y !== 0) foundDiagonal = true;
      if (target.path.length > manhattan) foundDetour = true;
    }
    expect(foundDiagonal).toBe(true);
    expect(foundDetour).toBe(true);
  });

  it("places Retrieve Lost Item at depth 2 of ring 2 in a dead-end portal room", () => {
    const random = () => 0.99;
    let adventure = startAdventure(knight.stats, random, 0, "retrieve-lost-item");
    expect(adventure.questTarget?.questId).toBe("retrieve-lost-item");
    expect(Math.max(
      Math.abs(adventure.questTarget!.position.x),
      Math.abs(adventure.questTarget!.position.y),
    )).toBe(5);

    for (let step = 0; step < 3_000 && currentAdventureRoom(adventure).kind !== "portal"; step += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        expect(destination).not.toBeNull();
        adventure = moveInAdventure(adventure, destination!, knight.stats, new Decimal(1e9), new Decimal(1e9), random).state;
      } else {
        adventure = performAdventureEnemyTurn(adventure, knight.stats, new Decimal(1e9), new Decimal(1e9)).state;
      }
    }
    const portal = currentAdventureRoom(adventure);
    expect(portal.kind).toBe("portal");
    expect(portal.exits).toHaveLength(1);
    expect(portal.tiles.flat().filter((tile) => tile.kind === "portal")).toHaveLength(9);
  });

  it("uses dense, ringless Water Dungeon generation with common fixed-strength Octopi", () => {
    const waterChances = generationChances(knight.stats.luck, 0, "water");
    expect(waterChances.enemy).toBe(0.17);
    expect(waterChances.enemy).toBeGreaterThan(generationChances(knight.stats.luck, 1).enemy);
    expect(adventureEnemyStats(0, "octopus").hp.eq(adventureEnemyStats(99, "octopus").hp)).toBe(true);
    expect(adventureEnemyStats(0, "octopus").hp.eq(70)).toBe(true);
    expect(adventureEnemyStats(0, "octopus").spAttack.eq(19)).toBe(true);
    expect(adventureEnemyStats(0, "merman").hp.eq(190)).toBe(true);
    expect(adventureEnemyStats(0, "merman").attack.eq(32)).toBe(true);
    expect(adventureEnemyStats(2, "spider").hp.gte(100)).toBe(true);
    expect(adventureEnemyStats(2, "spider").attack.gte(19)).toBe(true);
    for (let seed = 1; seed <= 12; seed += 1) {
      const adventure = startWaterAdventure(knight.stats, seededRandom(seed));
      const room = currentAdventureRoom(adventure);
      expect(room.ring, `seed ${seed}`).toBe(0);
      expect(room.kind, `seed ${seed}`).toBe("waterPortal");
      expect(room.exits, `seed ${seed}`).toHaveLength(4);
      expect(room.tiles.flat().filter((tile) => tile.kind === "waterPortal"), `seed ${seed}`).toHaveLength(9);
      expect(allNonWallTilesReachable(room), `seed ${seed}`).toBe(true);
    }
  });

  it.each([
    ["water", "waterPortal"],
    ["forge", "forgePortal"],
  ] as const)("starts the %s sub-dungeon beside a return platform and can route back onto it", (theme, portalKind) => {
    const adventure = theme === "water"
      ? startWaterAdventure(knight.stats, () => 0.5)
      : startForgeAdventure(knight.stats, () => 0.5);
    const room = currentAdventureRoom(adventure);
    expect(room.kind).toBe(portalKind);
    expect(room.tiles[adventure.playerPosition.y][adventure.playerPosition.x].kind).toBe("floor");

    const returnStep = suggestAdventureMove(adventure, {
      avoidManualInteractions: true,
      returnToDungeonPortal: true,
      routeRoomKey: room.key,
    });
    expect(returnStep).not.toBeNull();
    expect(room.tiles[returnStep!.y][returnStep!.x].kind).toBe(portalKind);
    const result = moveInAdventure(
      adventure,
      returnStep!,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
    );
    expect(result.returnedPortalType).toBe(theme);
  });

  it("caches an exact, detached portal map for same-expedition re-entry", () => {
    const earth = startAdventure(knight.stats, () => 0.5);
    const water = startWaterAdventure(knight.stats, () => 0.5);
    const parent: AdventureSession = {
      explorers: { knight: earth },
      order: ["knight"],
      focusedMemberId: "knight",
      carriedGold: new Decimal(42),
    };
    const child: AdventureSession = {
      explorers: { knight: water },
      order: ["knight"],
      focusedMemberId: "knight",
      returnSession: parent,
      returnToDungeonPortal: true,
      routeTargetRoomKey: "0,0",
      carriedGold: new Decimal(42),
    };

    const cachedParent = cachePortalDungeonSession(parent, "water", child);
    const snapshot = cachedParent.portalSessions?.water;
    expect(snapshot?.explorers.knight?.rooms).toBe(water.rooms);
    expect(snapshot?.returnSession).toBeNull();
    expect(snapshot?.returnToDungeonPortal).toBe(false);
    expect(snapshot?.routeTargetRoomKey).toBeNull();
  });

  it("waits on a Water return platform until every living explorer has arrived", () => {
    const adventure = startWaterAdventure(knight.stats, () => 0.5);
    const room = currentAdventureRoom(adventure);
    const returnStep = suggestAdventureMove(adventure, {
      avoidManualInteractions: true,
      returnToDungeonPortal: true,
      routeRoomKey: room.key,
    })!;
    const waiting = moveInAdventure(
      adventure,
      returnStep,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.5,
      [{ roomKey: room.key, position: { x: adventure.playerPosition.x + 1, y: adventure.playerPosition.y } }],
    );
    expect(waiting.returnedPortalType).toBeUndefined();
  });

  it("generates a Water Dungeon lost-item room only after six rooms and by room ten", () => {
    const random = () => 0.99;
    let adventure = startWaterAdventure(knight.stats, random);
    expect(adventure.dungeonTheme).toBe("water");
    expect(adventure.lostItemRoomNumber).toBe(10);
    for (let step = 0; step < 4_000 && currentAdventureRoom(adventure).kind !== "lostItem"; step += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        expect(destination).not.toBeNull();
        adventure = moveInAdventure(adventure, destination!, knight.stats, new Decimal(1e9), new Decimal(1e9), random).state;
      } else {
        adventure = performAdventureEnemyTurn(adventure, knight.stats, new Decimal(1e9), new Decimal(1e9)).state;
      }
    }
    const lostRoom = currentAdventureRoom(adventure);
    expect(lostRoom.number).toBeGreaterThan(6);
    expect(lostRoom.number).toBeLessThanOrEqual(10);
    expect(lostRoom.kind).toBe("lostItem");
    expect(lostRoom.ring).toBe(0);
    expect(lostRoom.exits).toHaveLength(1);
    expect(interiorWallCount(lostRoom)).toBeGreaterThanOrEqual(20);
    expect(lostRoom.tiles.flat().filter((tile) => tile.kind === "rodKeeper")).toHaveLength(1);
    expect(Object.values(adventure.rooms).every((room) =>
      room.ring === 0 && (room.kind === "waterPortal" || room.kind === "normal" || room.kind === "lostItem")
    )).toBe(true);
    expect(Object.values(adventure.rooms).some((room) =>
      room.kind === "treasure" || room.kind === "regen"
    )).toBe(false);
  });

  it("ramps a single post-quest Water portal toward a guarantee during ring-2 exploration", () => {
    expect(waterPortalSpawnChance(1)).toBe(0.1);
    expect(waterPortalSpawnChance(9)).toBe(0.1);
    expect(waterPortalSpawnChance(10)).toBe(0.35);
    expect(waterPortalSpawnChance(12)).toBeCloseTo(0.67);
    expect(waterPortalSpawnChance(15)).toBe(1);

    const random = seededRandom(9157);
    // This is a room-generation test. Keep combat scheduling from dominating
    // the deterministic walk now that later enemy bands act much faster.
    const explorerStats = { ...knight.stats, speed: new Decimal(100) };
    let adventure = startAdventure(explorerStats, random, 0, null, "knight", true);
    let hp = new Decimal(1e9);
    for (let turn = 0; turn < 50_000 && !Object.values(adventure.rooms).some((room) => room.kind === "waterPortal"); turn += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        if (!destination) {
          adventure = passAdventureTurn(adventure, explorerStats);
          continue;
        }
        const result = moveInAdventure(adventure, destination, explorerStats, hp, new Decimal(1e9), random);
        expect(result.error).toBeUndefined();
        adventure = result.state;
        hp = result.hp;
      } else {
        const result = performAdventureEnemyTurn(adventure, explorerStats, hp, new Decimal(1e9));
        adventure = result.state;
        hp = result.hp;
      }
    }
    const portalRooms = Object.values(adventure.rooms).filter((room) => room.kind === "waterPortal");
    expect(portalRooms).toHaveLength(1);
    expect(portalRooms[0].ring).toBe(2);
    expect(portalRooms[0].tiles.flat().filter((tile) => tile.kind === "waterPortal")).toHaveLength(9);
    expect(Object.values(adventure.rooms).flatMap((room) => room.tiles.flat()).filter((tile) =>
      tile.kind === "waterPortal"
    )).toHaveLength(9);
  });

  it("adds an offering chamber only when it can reserve the throne room behind it", () => {
    const random = () => 0.99;
    let adventure = startWaterAdventure(knight.stats, random, 0, "knight", {
      visitNumber: 2,
      fishingRodRecovered: true,
    });
    expect(adventure.lostItemRoomNumber).toBeNull();
    expect(adventure.offeringRoomNumber).toBe(8);
    for (let step = 0; step < 8_000 && currentAdventureRoom(adventure).kind !== "offering"; step += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure, { avoidManualInteractions: true });
        expect(destination).not.toBeNull();
        adventure = moveInAdventure(
          adventure,
          destination!,
          knight.stats,
          new Decimal(1e9),
          new Decimal(1e9),
          random,
        ).state;
      } else {
        adventure = performAdventureEnemyTurn(
          adventure,
          knight.stats,
          new Decimal(1e9),
          new Decimal(1e9),
        ).state;
      }
    }
    const chamber = currentAdventureRoom(adventure);
    expect(chamber.kind).toBe("offering");
    expect(chamber.exits).toHaveLength(2);
    expect(chamber.offeringBossDirection).toBeDefined();
    const offeringTiles = chamber.tiles.flat().filter((tile) => tile.kind === "offering");
    expect(offeringTiles).toHaveLength(4);
    expect(new Set(offeringTiles.map((tile) => tile.offeringStat))).toEqual(new Set(adventure.offeringStats));
    const doorPositions = chamber.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.kind === "woodenDoor" ? [{ x, y }] : []
    ));
    expect(doorPositions).toHaveLength(5);
    expect(doorPositions.every(({ x, y }) => x === 0 || y === 0 || x === 8 || y === 8)).toBe(true);
    const bossOffset = chamber.offeringBossDirection === "north" ? { x: 0, y: -1 }
      : chamber.offeringBossDirection === "south" ? { x: 0, y: 1 }
      : chamber.offeringBossDirection === "east" ? { x: 1, y: 0 }
      : { x: -1, y: 0 };
    const bossKey = `${chamber.position.x + bossOffset.x},${chamber.position.y + bossOffset.y}`;
    expect(adventure.rooms[bossKey]).toBeUndefined();
    expect(Object.values(adventure.rooms).filter((room) => room.key !== chamber.key).every((room) =>
      room.exits.every((exit) => {
        const offset = exit.direction === "north" ? { x: 0, y: -1 }
          : exit.direction === "south" ? { x: 0, y: 1 }
          : exit.direction === "east" ? { x: 1, y: 0 }
          : { x: -1, y: 0 };
        return `${room.position.x + offset.x},${room.position.y + offset.y}` !== bossKey;
      })
    )).toBe(true);
  });

  it("opens into a separate locked throne room, then reveals and opens the Trident chest", () => {
    const layout = createOfferingRoomTiles("south", false);
    const room: DungeonRoom = {
      ...emptyTestRoom(0, { x: 0, y: 0 }),
      kind: "offering",
      tiles: layout.tiles,
      exits: [
        { direction: "south", position: { x: 4, y: 8 } },
        { direction: "north", position: { x: 4, y: 0 } },
      ],
      offeringDoorOpened: false,
      offeringBossDirection: "north",
    };
    const finalOfferingPosition = { x: 4, y: 1 };
    const beforeOpening = {
      ...testAdventure(room, { x: 4, y: 1 }),
      dungeonTheme: "water" as const,
      offeringRoomNumber: 2,
      readyAt: {
        [ADVENTURE_KNIGHT_ID]: new Decimal(37),
      },
    };
    const opened = openOfferingChamber(beforeOpening, knight.stats);
    const openedRoom = currentAdventureRoom(opened);
    expect(openedRoom.offeringDoorOpened).toBe(true);
    expect(openedRoom.tiles.flat().filter((tile) => tile.kind === "woodenDoor" && tile.doorOpen)).toHaveLength(5);
    expect(openedRoom.tiles.flat().filter((tile) => tile.kind === "enemy")).toHaveLength(0);
    expect(opened.playerPosition).toEqual(finalOfferingPosition);
    expect(opened.activeActorId).toBe(beforeOpening.activeActorId);
    expect(opened.readyAt[ADVENTURE_KNIGHT_ID].eq(37)).toBe(true);

    const entered = moveInAdventure(
      { ...opened, activeActorId: ADVENTURE_KNIGHT_ID },
      { x: 4, y: 0 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      () => 0.99,
    );
    expect(entered.error).toBeUndefined();
    const throne = currentAdventureRoom(entered.state);
    expect(throne.kind).toBe("mermanThrone");
    expect(throne.exits).toHaveLength(1);
    expect(throne.tiles.flat().filter((tile) => tile.kind === "woodenDoor" && !tile.doorOpen)).toHaveLength(5);
    expect(throne.tiles.flat().filter((tile) => tile.kind === "wall" && tile.decoration === "waterThrone")).toHaveLength(1);
    const mermen = throne.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.kind === "enemy" && tile.enemyKind === "merman" ? [{ x, y }] : []
    ));
    expect(mermen).toHaveLength(3);
    const finalMerman = mermen.find(({ x }) => x === 4)!;
    for (const position of mermen.filter((position) => position !== finalMerman)) {
      throne.tiles[position.y][position.x] = { kind: "floor" };
    }
    const result = moveInAdventure(
      {
        ...entered.state,
        activeActorId: ADVENTURE_KNIGHT_ID,
        playerPosition: { x: finalMerman.x, y: finalMerman.y + 1 },
      },
      finalMerman,
      { ...knight.stats, attack: new Decimal(10_000) },
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(result.completedTridentTrial).toBe(false);
    expect(result.gearFound).toBeNull();
    expect(currentAdventureRoom(result.state).tiles.flat().filter((tile) => tile.kind === "tridentChest")).toHaveLength(1);
    expect(currentAdventureRoom(result.state).tiles.flat().filter((tile) => tile.kind === "woodenDoor" && !tile.doorOpen)).toHaveLength(5);

    const steppedAway = moveInAdventure(
      { ...result.state, activeActorId: ADVENTURE_KNIGHT_ID },
      { x: 3, y: 4 },
      knight.stats,
      result.hp,
      result.stamina,
    );
    const claimed = moveInAdventure(
      { ...steppedAway.state, activeActorId: ADVENTURE_KNIGHT_ID },
      { x: 4, y: 4 },
      knight.stats,
      steppedAway.hp,
      steppedAway.stamina,
    );
    expect(claimed.completedTridentTrial).toBe(true);
    expect(claimed.gearFound?.definitionId).toBe("trident");
    expect(currentAdventureRoom(claimed.state).tiles.flat().filter((tile) => tile.kind === "openedChest")).toHaveLength(1);
    expect(currentAdventureRoom(claimed.state).tiles.flat().filter((tile) => tile.kind === "woodenDoor" && tile.doorOpen)).toHaveLength(5);
  });

  it("makes Mermen pass after a long cardinal Trident Throw", () => {
    const room = emptyTestRoom(0);
    room.tiles[4][6] = {
      kind: "enemy",
      enemyId: "test-merman",
      enemyKind: "merman",
      enemyHp: adventureEnemyStats(0, "merman").hp,
    };
    const state = {
      ...testAdventure(room, { x: 2, y: 4 }, "test-merman"),
      readyAt: { [ADVENTURE_KNIGHT_ID]: new Decimal(200), "test-merman": new Decimal(100) },
    };
    const thrown = performAdventureEnemyTurn(state, knight.stats, new Decimal(1_000), new Decimal(100));
    expect(thrown.hp.lt(1_000)).toBe(true);
    expect(thrown.state.lastProjectile?.kind).toBe("trident");
    expect(currentAdventureRoom(thrown.state).tiles[4][6].enemyMustPass).toBe(true);
    const recovering = performAdventureEnemyTurn(
      { ...thrown.state, activeActorId: "test-merman" },
      knight.stats,
      thrown.hp,
      thrown.stamina,
    );
    expect(recovering.hp.eq(thrown.hp)).toBe(true);
    expect(recovering.state.log[0]).toMatch(/retrieves its trident and passes/i);
  });

  it("lets the equipped Trident throw hit to the wall and forces the player's next turn to pass", () => {
    const room = openTestRoom(0, { x: 5, y: 4 });
    room.tiles[4][5].enemyHp = new Decimal(500);
    const adventure = testAdventure(room, { x: 2, y: 4 });
    const thrown = moveInAdventure(
      adventure,
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      Math.random,
      [],
      true,
      true,
    );
    expect(thrown.error).toBeUndefined();
    expect(thrown.state.lastProjectile).toEqual({
      from: { x: 2, y: 4 },
      to: { x: 7, y: 4 },
      kind: "trident",
    });
    expect(thrown.state.playerMustPass).toBe(true);
    const forcedState = { ...thrown.state, activeActorId: ADVENTURE_KNIGHT_ID };
    expect(moveInAdventure(
      forcedState,
      { x: 3, y: 4 },
      knight.stats,
      thrown.hp,
      thrown.stamina,
    ).error).toMatch(/must recover/i);
    expect(passAdventureTurn(forcedState, knight.stats).playerMustPass).toBe(false);
  });

  it("keeps manual basic and secondary weapon attacks on separate mouse inputs", () => {
    const room = openTestRoom(0, { x: 3, y: 4 });
    room.tiles[4][3].enemyHp = new Decimal(500);
    const adventure = testAdventure(room, { x: 2, y: 4 });
    const attack = (mode: "basic" | "secondary") => moveInAdventure(
      adventure,
      { x: 3, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      Math.random,
      [],
      false,
      false,
      false,
      "burst-staff",
      true,
      false,
      mode,
    );

    const basic = attack("basic");
    expect(basic.error).toBeUndefined();
    expect(basic.state.log[0]).not.toMatch(/Burst Orb/);
    expect(basic.state.weaponCooldownRemaining ?? 0).toBe(0);
    expect(basic.state.lastAttackVisual).toBe("knight-slash");

    const secondary = attack("secondary");
    expect(secondary.error).toBeUndefined();
    expect(secondary.state.log[0]).toMatch(/Burst Orb/);
    expect(secondary.state.weaponCooldownRemaining).toBe(3);
    expect(secondary.state.lastAttackVisual).toBe("burst-orb");
  });

  it("lets an Octopus fire a two-tile Water Bolt", () => {
    const room = openTestRoom(0, { x: 4, y: 2 });
    room.tiles[2][4].enemyKind = "octopus";
    const adventure = { ...testAdventure(room, { x: 2, y: 2 }, "test-goblin"), dungeonTheme: "water" as const };
    const result = performAdventureEnemyTurn(adventure, knight.stats, new Decimal(100), new Decimal(10));
    expect(result.hp.lt(100)).toBe(true);
    expect(result.state.lastProjectile).toEqual({ from: { x: 4, y: 2 }, to: { x: 2, y: 2 } });
    expect(result.state.log[0]).toMatch(/Water Bolt/);
  });

  it("lets Worm use its straight-line Acid Shot while adventuring", () => {
    const room = openTestRoom(1, { x: 6, y: 4 });
    room.tiles[4][6].enemyHp = new Decimal(1);
    const adventure: AdventureState = {
      ...testAdventure(room, { x: 2, y: 4 }, adventurePlayerActorId("worm")),
      playerId: "worm",
      playerName: "Worm",
      readyAt: {
        [adventurePlayerActorId("worm")]: new Decimal(100),
        "test-goblin": new Decimal(150),
      },
    };
    expect(suggestAdventureMove(adventure)).toEqual({ x: 6, y: 4 });
    const result = moveInAdventure(
      adventure,
      { x: 6, y: 4 },
      worm.stats,
      worm.stats.hp,
      worm.stats.stamina,
    );
    expect(result.error).toBeUndefined();
    expect(currentAdventureRoom(result.state).tiles[4][6].kind).toBe("floor");
    expect(result.state.log[0]).toMatch(/Worm defeats/);

    const distantRoom = openTestRoom(1, { x: 7, y: 4 });
    const distantAdventure: AdventureState = {
      ...testAdventure(distantRoom, { x: 2, y: 4 }, adventurePlayerActorId("worm")),
      playerId: "worm",
      playerName: "Worm",
    };
    expect(moveInAdventure(
      distantAdventure,
      { x: 7, y: 4 },
      worm.stats,
      worm.stats.hp,
      worm.stats.stamina,
    ).error).toMatch(/cannot attack/i);
  });

  it("completes Rescue Me only when the final guarding Spider dies", () => {
    const room = emptyTestRoom(2, { x: 4, y: 0 });
    room.kind = "rescue";
    room.tiles[4][6] = { kind: "cage" };
    room.tiles[4][5] = {
      kind: "enemy",
      enemyId: "quest-spider-1",
      enemyKind: "spider",
      enemyHp: new Decimal(1),
    };
    room.tiles[5][4] = {
      kind: "enemy",
      enemyId: "quest-spider-2",
      enemyKind: "spider",
      enemyHp: new Decimal(1),
    };
    const adventure = {
      ...testAdventure(room, { x: 4, y: 4 }),
      questTarget: {
        questId: "rescue-me" as const,
        position: { x: 4, y: 0 },
        path: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      },
    };
    const firstKill = moveInAdventure(
      adventure,
      { x: 5, y: 4 },
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(firstKill.completedQuestId).toBeUndefined();
    expect(firstKill.state.questTarget).not.toBeNull();
    expect(currentAdventureRoom(firstKill.state).tiles.flat().some((tile) => tile.kind === "cage")).toBe(true);
    expect(firstKill.state.log[0]).toMatch(/1 guard remains/i);

    const finalKill = moveInAdventure(
      { ...firstKill.state, activeActorId: ADVENTURE_KNIGHT_ID },
      { x: 4, y: 5 },
      knight.stats,
      firstKill.hp,
      firstKill.stamina,
    );
    expect(finalKill.completedQuestId).toBe("rescue-me");
    expect(finalKill.state.questTarget).toBeNull();
    expect(currentAdventureRoom(finalKill.state).tiles.flat().some((tile) => tile.kind === "cage")).toBe(false);
  });

  it("places the Miner quest in zone 3 and recruits him by giving the Pickaxe from beside him", () => {
    const random = () => 0.99;
    const generated = startAdventure(knight.stats, random, 0, "find-miner");
    expect(generated.questTarget?.questId).toBe("find-miner");
    expect(ringForPosition(generated.questTarget!.position)).toBe(3);

    let adventure = generated;
    for (let step = 0; step < 4_000 && currentAdventureRoom(adventure).kind !== "miner"; step += 1) {
      if (isAdventurePlayerTurn(adventure)) {
        const destination = suggestAdventureMove(adventure);
        expect(destination).not.toBeNull();
        adventure = moveInAdventure(
          adventure,
          destination!,
          knight.stats,
          new Decimal(1e9),
          new Decimal(1e9),
          random,
        ).state;
      } else {
        adventure = performAdventureEnemyTurn(
          adventure,
          knight.stats,
          new Decimal(1e9),
          new Decimal(1e9),
        ).state;
      }
    }
    const room = currentAdventureRoom(adventure);
    expect(room.kind).toBe("miner");
    expect(room.exits).toHaveLength(1);
    const minerPosition = room.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.kind === "miner" ? [{ x, y }] : []
    ))[0];
    if (!minerPosition) throw new Error("Generated Miner room has no Miner.");
    const approach = [
      { x: minerPosition.x - 1, y: minerPosition.y },
      { x: minerPosition.x + 1, y: minerPosition.y },
      { x: minerPosition.x, y: minerPosition.y - 1 },
      { x: minerPosition.x, y: minerPosition.y + 1 },
    ].find((position) => room.tiles[position.y]?.[position.x]?.kind === "floor")!;
    adventure = {
      ...adventure,
      playerPosition: approach,
      activeActorId: ADVENTURE_KNIGHT_ID,
    };
    expect(suggestAdventureMove(adventure)).toEqual(minerPosition);
    const result = moveInAdventure(
      adventure,
      minerPosition,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
    );
    expect(result.error).toBeUndefined();
    expect(result.completedQuestId).toBe("find-miner");
    expect(result.state.questTarget).toBeNull();
    expect(result.state.playerPosition).toEqual(approach);
  });

  it("lets the Miner strike an adjacent enemy diagonally", () => {
    const room = emptyTestRoom(3);
    room.tiles[5][5] = {
      kind: "enemy",
      enemyId: "diagonal-rat",
      enemyKind: "rat",
      enemyHp: new Decimal(1),
    };
    const adventure: AdventureState = {
      ...testAdventure(room, { x: 4, y: 4 }, adventurePlayerActorId("miner")),
      playerId: "miner",
      playerName: "Miner",
    };
    const result = moveInAdventure(
      adventure,
      { x: 5, y: 5 },
      miner.stats,
      miner.stats.hp,
      miner.stats.stamina,
    );
    expect(result.error).toBeUndefined();
    expect(currentAdventureRoom(result.state).tiles[5][5].kind).toBe("floor");
  });

  it("activates the Hammer quest only at the Blacksmith and places its vault 5–10 zone-3 rooms away", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const room = emptyTestRoom(3, { x: 7, y: 0 });
      room.kind = "blacksmith";
      const adventure = {
        ...testAdventure(room, { x: 4, y: 4 }),
        hammerQuestPurchased: true,
      };
      const result = activateHammerQuestAtBlacksmith(adventure, seededRandom(seed));
      expect(result.error).toBeUndefined();
      const target = result.state.questTarget;
      expect(target?.questId).toBe("retrieve-hammer");
      expect((target?.path.length ?? 1) - 1).toBeGreaterThanOrEqual(5);
      expect((target?.path.length ?? 1) - 1).toBeLessThanOrEqual(10);
      expect(target?.path.every((position) => ringForPosition(position) === 3)).toBe(true);
      expect(Math.abs((target?.position.x ?? 7) - 7) + Math.abs(target?.position.y ?? 0)).toBeGreaterThan(1);
      expect(currentAdventureRoom(result.state).exits.length).toBeGreaterThan(0);
    }

    const ordinaryRoom = emptyTestRoom(3, { x: 7, y: 0 });
    const awayFromBlacksmith = activateHammerQuestAtBlacksmith({
      ...testAdventure(ordinaryRoom, { x: 4, y: 4 }),
      hammerQuestPurchased: true,
    });
    expect(awayFromBlacksmith.error).toMatch(/visit the blacksmith/i);
  });

  it("marks a same-expedition Miner cave from the Blacksmith after the Pickaxe is bought", () => {
    const room = emptyTestRoom(3, { x: 7, y: 0 });
    room.kind = "blacksmith";
    const result = activateMinerQuestAtBlacksmith(
      testAdventure(room, { x: 4, y: 4 }),
      seededRandom(43),
    );
    expect(result.error).toBeUndefined();
    expect(result.state.questTarget?.questId).toBe("find-miner");
    expect((result.state.questTarget?.path.length ?? 1) - 1).toBeGreaterThanOrEqual(5);
    expect(result.state.questTarget?.path.every((position) => ringForPosition(position) === 3)).toBe(true);
  });

  it("guarantees a Hammer-vault route when explored rooms surround the Blacksmith", () => {
    const blacksmithRoom = emptyTestRoom(3, { x: 7, y: 0 });
    blacksmithRoom.kind = "blacksmith";
    const surroundingRooms = [
      emptyTestRoom(4, { x: 8, y: 0 }),
      emptyTestRoom(5, { x: 7, y: -1 }),
      emptyTestRoom(6, { x: 7, y: 1 }),
    ];
    const rooms = Object.fromEntries(
      [blacksmithRoom, ...surroundingRooms].map((room) => [room.key, room]),
    );

    for (let seed = 1; seed <= 12; seed += 1) {
      const result = activateHammerQuestAtBlacksmith({
        ...testAdventure(blacksmithRoom, { x: 4, y: 4 }),
        rooms,
        hammerQuestPurchased: true,
      }, seededRandom(seed));
      expect(result.error).toBeUndefined();
      expect(result.state.questTarget?.questId).toBe("retrieve-hammer");
      expect((result.state.questTarget?.path.length ?? 1) - 1).toBeGreaterThanOrEqual(5);
      expect((result.state.questTarget?.path.length ?? 1) - 1).toBeLessThanOrEqual(10);
      const firstStep = result.state.questTarget?.path[1];
      expect(surroundingRooms.map((room) => room.key)).toContain(
        `${firstStep?.x},${firstStep?.y}`,
      );
      expect(suggestAdventureMove(result.state, { prioritizeQuest: true })).not.toBeNull();
    }
  });

  it("interacts with the Blacksmith from beside him without occupying his tile or trapping auto movement", () => {
    const room = emptyTestRoom(3, { x: 7, y: 0 });
    room.kind = "blacksmith";
    const blacksmithPosition = { x: 5, y: 4 };
    room.tiles[blacksmithPosition.y][blacksmithPosition.x] = { kind: "blacksmith" };
    const interacted = moveInAdventure(
      {
        ...testAdventure(room, { x: 4, y: 4 }),
        hammerQuestPurchased: true,
      },
      blacksmithPosition,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      seededRandom(31),
    );
    expect(interacted.error).toBeUndefined();
    expect(interacted.state.playerPosition).toEqual({ x: 4, y: 4 });
    expect(currentAdventureRoom(interacted.state).tiles[4][5].kind).toBe("blacksmith");

    const activated = activateHammerQuestAtBlacksmith(interacted.state, seededRandom(32));
    expect(activated.error).toBeUndefined();
    const autoMove = suggestAdventureMove(activated.state, { prioritizeQuest: true });
    expect(autoMove).not.toBeNull();
    expect(autoMove).not.toEqual(blacksmithPosition);
    const moved = moveInAdventure(
      activated.state,
      autoMove!,
      knight.stats,
      interacted.hp,
      interacted.stamina,
      seededRandom(33),
    );
    expect(moved.error).toBeUndefined();
    expect(moved.state.playerPosition).not.toEqual({ x: 4, y: 4 });
  });

  it("keeps Clay Mummies durable but below their previous damage and bulk", () => {
    const stats = adventureEnemyStats(3, "mummy");
    expect(stats.hp.eq(1_280)).toBe(true);
    expect(stats.defense.eq(77)).toBe(true);
    expect(stats.spDefense.eq(84)).toBe(true);
    expect(stats.speed.gte(10)).toBe(true);
    expect(stats.attack.eq(48)).toBe(true);
    expect(stats.spAttack.eq(58)).toBe(true);
  });

  it("moves a 2x2 Clay Mummy toward the player when it has no clear attack", () => {
    const layout = createHammerVaultRoomTiles();
    const room: DungeonRoom = {
      key: "7,0",
      number: 20,
      position: { x: 7, y: 0 },
      width: 13,
      height: 13,
      tiles: layout.tiles,
      exits: [{ direction: "south", position: layout.gatePosition }],
      ring: 3,
      kind: "hammerVault",
      regenUsedBy: [],
      hammerChestPosition: layout.chestPosition,
    };
    const state = {
      ...testAdventure(room, { x: 6, y: 10 }),
      activeActorId: "hammer-mummy-1",
    };
    const moved = performAdventureEnemyTurn(
      state,
      knight.stats,
      knight.stats.hp,
      knight.stats.stamina,
      [],
      false,
      () => 0.99,
    );
    const movedRoom = currentAdventureRoom(moved.state);
    const anchor = movedRoom.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile.enemyId === "hammer-mummy-1" && tile.enemyPart === 0 ? [{ x, y }] : []
    ));
    expect(anchor).toEqual([{ x: 2, y: 3 }]);
  });
});

function runPairAuto(
  explorers: Record<"knight" | "worm", AdventureState>,
  headings: Record<"knight" | "worm", ExitDirection>,
  random: () => number,
  prioritizeQuest: boolean,
): Partial<Record<"knight" | "worm", string>> {
  const ids = ["knight", "worm"] as const;
  const firstRooms: Partial<Record<"knight" | "worm", string>> = {};
  for (let tick = 0; tick < 200 && Object.keys(firstRooms).length < 2; tick += 1) {
    const id = ids[tick % ids.length];
    const otherId = id === "knight" ? "worm" : "knight";
    const current = explorers[id];
    const other = explorers[otherId];
    const stats = id === "knight" ? knight.stats : worm.stats;
    if (!isAdventurePlayerTurn(current)) {
      explorers[id] = performAdventureEnemyTurn(
        current,
        stats,
        new Decimal(1e9),
        new Decimal(1e9),
        other.currentRoomKey === current.currentRoomKey ? [other.playerPosition] : [],
      ).state;
      continue;
    }
    const destination = suggestAdventureMove(current, {
      prioritizeQuest,
      preferredDirection: headings[id],
      occupiedPositions: other.currentRoomKey === current.currentRoomKey ? [other.playerPosition] : [],
    });
    if (!destination) continue;
    const result = moveInAdventure(
      current,
      destination,
      stats,
      new Decimal(1e9),
      new Decimal(1e9),
      random,
      [{ roomKey: other.currentRoomKey, position: other.playerPosition }],
    );
    expect(result.error).toBeUndefined();
    explorers[id] = result.state;
    explorers[otherId] = { ...other, rooms: result.state.rooms, questTarget: result.state.questTarget };
    if (result.state.currentRoomKey !== "0,0" && !firstRooms[id]) {
      firstRooms[id] = result.state.currentRoomKey;
    }
  }
  return firstRooms;
}

function runPairQuestUntilPortal(
  explorers: Record<"knight" | "worm", AdventureState>,
  random: () => number,
): void {
  const ids = ["knight", "worm"] as const;
  for (let tick = 0; tick < 8_000; tick += 1) {
    if (ids.every((id) => currentAdventureRoom(explorers[id]).kind === "portal")) return;
    const id = ids[tick % ids.length];
    const otherId = id === "knight" ? "worm" : "knight";
    const current = explorers[id];
    const other = explorers[otherId];
    const stats = id === "knight" ? knight.stats : worm.stats;
    const otherPositions = other.currentRoomKey === current.currentRoomKey ? [other.playerPosition] : [];
    const next = isAdventurePlayerTurn(current)
      ? (() => {
          const destination = suggestAdventureMove(current, {
            prioritizeQuest: true,
            occupiedPositions: otherPositions,
          });
          return destination
            ? moveInAdventure(
                current,
                destination,
                stats,
                new Decimal(1e9),
                new Decimal(1e9),
                random,
                [{ roomKey: other.currentRoomKey, position: other.playerPosition }],
              ).state
            : current;
        })()
      : performAdventureEnemyTurn(
          current,
          stats,
          new Decimal(1e9),
          new Decimal(1e9),
          otherPositions,
        ).state;
    explorers[id] = next;
    explorers[otherId] = { ...other, rooms: next.rooms, questTarget: next.questTarget };
  }
}

function exploreUntilSecondRoom(
  random: () => number,
  playerStats = knight.stats,
  completedBattleNumbers: number[] = [],
): AdventureState {
  let adventure = startAdventure(
    playerStats,
    random,
    0,
    null,
    "knight",
    false,
    false,
    completedBattleNumbers,
  );
  // This helper deliberately probes room-generation thresholds with a fixed
  // injected random source. Disable coordinate seeding here so those focused
  // probability assertions continue to exercise the supplied value directly.
  adventure = { ...adventure, dungeonSeed: undefined };
  for (let step = 0; step < 200 && Object.keys(adventure.rooms).length < 2; step += 1) {
    if (isAdventurePlayerTurn(adventure)) {
      const destination = suggestAdventureMove(adventure);
      if (!destination) break;
      adventure = moveInAdventure(
        adventure,
        destination,
        playerStats,
        new Decimal(1e9),
        new Decimal(1e9),
        random,
      ).state;
    } else {
      adventure = performAdventureEnemyTurn(
        adventure,
        playerStats,
        new Decimal(1e9),
        new Decimal(1e9),
      ).state;
    }
  }
  expect(Object.keys(adventure.rooms)).toHaveLength(2);
  return adventure;
}

function openTestRoom(ring: number, enemy: { x: number; y: number }): DungeonRoom {
  const room = emptyTestRoom(ring);
  room.tiles[enemy.y][enemy.x] = {
    kind: "enemy",
    enemyId: "test-goblin",
    enemyHp: adventureEnemyStats(ring).hp,
  };
  return room;
}

function emptyTestRoom(
  ring: number,
  position = { x: ring, y: 0 },
): DungeonRoom {
  return emptySizedTestRoom(ring, 9, position);
}

function emptySizedTestRoom(
  ring: number,
  size: number,
  position = { x: ring, y: 0 },
): DungeonRoom {
  const tiles: AdventureTile[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      kind: x === 0 || y === 0 || x === size - 1 || y === size - 1
        ? "wall" as const
        : "floor" as const,
    })),
  );
  return {
    key: `${position.x},${position.y}`,
    number: ring + 1,
    position,
    width: size,
    height: size,
    tiles,
    exits: [],
    ring,
    kind: "normal",
    regenUsedBy: [],
  };
}

function lotteryTestRoom(): DungeonRoom {
  const tiles = createLotteryRoomTiles();
  tiles[0][4] = { kind: "lotteryGate", exitDirection: "north" };
  tiles[8][4] = { kind: "lotteryGate", exitDirection: "south" };
  return {
    key: "2,0",
    number: 8,
    position: { x: 2, y: 0 },
    width: 9,
    height: 9,
    tiles,
    exits: [
      { direction: "north", position: { x: 4, y: 0 } },
      { direction: "south", position: { x: 4, y: 8 } },
    ],
    ring: 2,
    kind: "lottery",
    regenUsedBy: [],
    lotterySpun: false,
    lotteryResolved: false,
  };
}

function testAdventure(
  room: DungeonRoom,
  playerPosition: { x: number; y: number },
  activeActorId = ADVENTURE_KNIGHT_ID,
): AdventureState {
  return {
    playerId: "knight",
    playerName: "Knight",
    currentRoomKey: room.key,
    previousRoomKey: null,
    rooms: { [room.key]: room },
    playerPosition,
    steps: 0,
    staminaActionProgress: 0,
    log: [],
    activeActorId,
    readyAt: {
      [ADVENTURE_KNIGHT_ID]: new Decimal(100),
      "test-goblin": new Decimal(150),
    },
    questTarget: null,
  };
}

function openInteriorRatio(room: ReturnType<typeof currentAdventureRoom>): number {
  let open = 0;
  let total = 0;
  for (let y = 1; y < room.height - 1; y += 1) {
    for (let x = 1; x < room.width - 1; x += 1) {
      total += 1;
      if (room.tiles[y][x].kind !== "wall") open += 1;
    }
  }
  return open / total;
}

function interiorWallCount(room: ReturnType<typeof currentAdventureRoom>): number {
  return room.tiles.slice(1, -1).reduce(
    (count, row) => count + row.slice(1, -1).filter((tile) => tile.kind === "wall").length,
    0,
  );
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

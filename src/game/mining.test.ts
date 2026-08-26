import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { caveBat } from "@/content/enemies/cave-bat";
import { clayGolem } from "@/content/enemies/clay-golem";
import { getPlayer } from "@/content/players";
import {
  MAX_MINING_ROOM,
  advanceMining,
  createMiningEnemy,
  createMiningRoom,
  enterNextMiningRoom,
  frontierMiningRocks,
  miningEnemyChance,
  miningGoldChance,
  miningRockDurability,
  rollMiningGold,
  selectMiningRock,
} from "./mining";
import type { Stats } from "./types";

const strongStats: Stats = {
  ...getPlayer("miner").stats,
  hp: new Decimal(1_000_000),
  attack: new Decimal(1_000_000),
  defense: new Decimal(1_000_000),
  speed: new Decimal(1_000),
  stamina: new Decimal(1_000),
  luck: new Decimal(100),
};

describe("mining", () => {
  it("creates a rock-filled 11x11 room with one entrance, hidden door, and key", () => {
    const state = createMiningRoom("miner", 1, strongStats, () => 0.42);
    expect(state.width).toBe(11);
    expect(state.height).toBe(11);
    expect(Object.values(state.rocks)).toHaveLength(81);
    expect(Object.values(state.rocks).filter((rock) => rock.content === "key")).toHaveLength(1);
    expect(Object.values(state.rocks).filter((rock) => rock.hidesDoor)).toHaveLength(1);
    expect(state.tiles[10][5].kind).toBe("entrance");
    expect(state.tiles[state.doorPosition.y][state.doorPosition.x].kind).toBe("wall");
    expect(state.doorRevealed).toBe(false);
    expect(state.hasKey).toBe(false);

    for (let y = 0; y < state.height; y += 1) {
      for (let x = 0; x < state.width; x += 1) {
        const perimeter = x === 0 || y === 0 || x === 10 || y === 10;
        if (perimeter && !(x === 5 && y === 10)) expect(state.tiles[y][x].kind).toBe("wall");
      }
    }
  });

  it("only exposes rocks connected to excavated floor and lets manual mining break one", () => {
    const state = createMiningRoom("miner", 1, strongStats, () => 0.73);
    const frontier = frontierMiningRocks(state);
    expect(frontier).toHaveLength(1);
    expect(frontier[0].position).toEqual({ x: 5, y: 9 });
    const unreachable = Object.values(state.rocks).find((rock) => rock.position.y === 1 && rock.position.x === 1);
    expect(unreachable).toBeDefined();
    expect(selectMiningRock(state, unreachable!.id).error).toMatch(/clear a path/i);

    const chosen = selectMiningRock(state, frontier[0].id).state;
    chosen.rocks[frontier[0].id] = {
      ...chosen.rocks[frontier[0].id],
      content: "gold",
      goldAmount: new Decimal(123),
      durability: new Decimal(1),
      maxDurability: new Decimal(1),
    };
    const result = advanceMining(
      chosen,
      strongStats,
      strongStats.hp,
      strongStats.stamina,
      1,
      false,
      () => 0.5,
    );
    expect(result.goldGained.eq(123)).toBe(true);
    expect(result.state.rocks[frontier[0].id]).toBeUndefined();
    expect(result.state.playerPosition).toEqual(frontier[0].position);
    expect(frontierMiningRocks(result.state).length).toBeGreaterThan(1);
  });

  it("requires both the revealed door and key before generating the stronger next room", () => {
    const state = createMiningRoom("miner", 2, strongStats, () => 0.5);
    expect(enterNextMiningRoom(state, strongStats).error).toMatch(/hidden/i);
    const revealed = {
      ...state,
      doorRevealed: true,
      tiles: state.tiles.map((row) => row.map((tile) => ({ ...tile }))),
    };
    revealed.tiles[state.doorPosition.y][state.doorPosition.x] = { kind: "door" };
    expect(enterNextMiningRoom(revealed, strongStats).error).toMatch(/key/i);
    expect(enterNextMiningRoom({ ...revealed, hasKey: true }, strongStats).error).toMatch(/walking/i);
    const advanced = enterNextMiningRoom({
      ...revealed,
      hasKey: true,
      playerPosition: { ...state.doorPosition },
    }, strongStats, () => 0.5);
    expect(advanced.error).toBeUndefined();
    expect(advanced.state.roomNumber).toBe(3);
    const expectedEntrance = state.doorPosition.y === 0
      ? { x: state.doorPosition.x, y: state.height - 1 }
      : state.doorPosition.y === state.height - 1
        ? { x: state.doorPosition.x, y: 0 }
        : state.doorPosition.x === 0
          ? { x: state.width - 1, y: state.doorPosition.y }
          : { x: 0, y: state.doorPosition.y };
    expect(advanced.state.playerPosition).toEqual(expectedEntrance);
    expect(advanced.state.tiles[expectedEntrance.y][expectedEntrance.x].kind).toBe("entrance");
    expect(advanced.state.doorPosition).not.toEqual(expectedEntrance);
    expect(Object.values(advanced.state.rocks)[0].maxDurability.gt(Object.values(state.rocks)[0].maxDurability)).toBe(true);
  });

  it("scales passive gold with luck and depth while alternating baseline and crowded enemy rooms", () => {
    expect(miningGoldChance(new Decimal(0))).toBeCloseTo(0.09);
    expect(rollMiningGold(new Decimal(0), 1, () => 0.5).toNumber()).toBe(40);
    expect(miningGoldChance(new Decimal(100))).toBeGreaterThan(miningGoldChance(new Decimal(1)));
    expect(rollMiningGold(new Decimal(100), 1, () => 0.5).gt(
      rollMiningGold(new Decimal(1), 1, () => 0.5),
    )).toBe(true);
    expect(rollMiningGold(new Decimal(10), 5, () => 0.5).gt(
      rollMiningGold(new Decimal(10), 1, () => 0.5),
    )).toBe(true);
    expect(miningRockDurability(5).gt(miningRockDurability(1))).toBe(true);
    for (const room of [1, 3, 5, 7, 9]) {
      expect(miningEnemyChance(room)).toBe(miningEnemyChance(1));
      expect(miningEnemyChance(room + 1)).toBeGreaterThan(miningEnemyChance(room));
    }
  });

  it("introduces a substantially stronger mining enemy every two rooms", () => {
    const enemies = Array.from({ length: MAX_MINING_ROOM }, (_, index) =>
      createMiningEnemy(index + 1, { x: 5, y: 5 })
    );
    expect(enemies.map((enemy) => enemy.definitionId)).toEqual([
      "cave-bat", "cave-bat",
      "glow-scorpion", "glow-scorpion",
      "ore-beetle", "ore-beetle",
      "gloom-wisp", "gloom-wisp",
      "basalt-wyrm", "basalt-wyrm",
    ]);
    for (const room of [2, 4, 6, 8]) {
      const previousBand = enemies[room - 2];
      const nextBand = enemies[room];
      expect(nextBand.maxHp.gt(previousBand.maxHp)).toBe(true);
      expect(nextBand.attack.gt(previousBand.attack)).toBe(true);
      expect(nextBand.defense.gt(previousBand.defense)).toBe(true);
    }
    for (const evenRoom of [2, 4, 6, 8, 10]) {
      const oddEnemy = enemies[evenRoom - 2];
      const crowdedEnemy = enemies[evenRoom - 1];
      expect(crowdedEnemy.definitionId).toBe(oddEnemy.definitionId);
      expect(crowdedEnemy.maxHp.gt(oddEnemy.maxHp)).toBe(true);
    }
  });

  it("ends the run instead of generating Room 11", () => {
    const state = createMiningRoom("miner", MAX_MINING_ROOM, strongStats, () => 0.5);
    state.doorRevealed = true;
    state.hasKey = true;
    state.playerPosition = { ...state.doorPosition };
    state.tiles[state.doorPosition.y][state.doorPosition.x] = { kind: "door" };
    const transition = enterNextMiningRoom(state, strongStats, () => 0.5);
    expect(transition.error).toBeUndefined();
    expect(transition.limitReached).toBe(true);
    expect(transition.state.roomNumber).toBe(MAX_MINING_ROOM);
    expect(transition.state.status).toBe("exhausted");
    const automatic = advanceMining(
      { ...state, status: "running" },
      strongStats,
      strongStats.hp,
      strongStats.stamina,
      1,
      true,
      () => 0.5,
    );
    expect(automatic.depthLimitReached).toBe(true);
    expect(automatic.exhausted).toBe(true);
    expect(automatic.stamina.eq(0)).toBe(true);
    expect(automatic.roomAdvanced).toBe(false);
    expect(createMiningRoom("miner", 11, strongStats).roomNumber).toBe(MAX_MINING_ROOM);
  });

  it("can excavate, fight, find the key and advance entirely on auto", () => {
    let state = createMiningRoom("miner", 1, strongStats, () => 0);
    let hp = strongStats.hp;
    let stamina = strongStats.stamina;
    let advanced = false;
    for (let turn = 0; turn < 500 && !advanced; turn += 1) {
      const result = advanceMining(state, strongStats, hp, stamina, 1, true, () => 0);
      state = result.state;
      hp = result.hp;
      stamina = result.stamina;
      advanced = Boolean(result.roomAdvanced);
    }
    expect(advanced).toBe(true);
    expect(state.roomNumber).toBe(2);
    expect(hp.gt(0)).toBe(true);
  });

  it("walks one floor tile at a time toward a selected rock instead of teleporting", () => {
    const state = createMiningRoom("miner", 1, strongStats, () => 0.61);
    const target = Object.values(state.rocks).find(({ position }) => position.x === 4 && position.y === 7);
    expect(target).toBeDefined();
    for (const position of [{ x: 5, y: 9 }, { x: 5, y: 8 }, { x: 5, y: 7 }]) {
      const cleared = Object.values(state.rocks).find((rock) =>
        rock.position.x === position.x && rock.position.y === position.y
      );
      if (cleared) delete state.rocks[cleared.id];
      state.tiles[position.y][position.x] = { kind: "floor" };
    }
    const selected = selectMiningRock(state, target!.id).state;
    expect(selected.playerPosition).toEqual({ x: 5, y: 10 });
    const result = advanceMining(
      selected,
      strongStats,
      strongStats.hp,
      strongStats.stamina,
      10,
      false,
      () => 0.5,
    );
    expect(result.state.playerPosition).toEqual({ x: 5, y: 9 });
    expect(result.state.rocks[target!.id]).toBeDefined();
  });

  it("walks to a discovered door before advancing to the next room", () => {
    const state = createMiningRoom("miner", 1, strongStats, () => 0.34);
    for (let y = 1; y < state.height - 1; y += 1) {
      for (let x = 1; x < state.width - 1; x += 1) {
        const cleared = Object.values(state.rocks).find((rock) =>
          rock.position.x === x && rock.position.y === y
        );
        if (cleared) delete state.rocks[cleared.id];
        state.tiles[y][x] = { kind: "floor" };
      }
    }
    state.doorRevealed = true;
    state.hasKey = true;
    state.tiles[state.doorPosition.y][state.doorPosition.x] = { kind: "door" };
    let current = state;
    let previous = { ...current.playerPosition };
    let advanced = false;
    for (let turn = 0; turn < 30 && !advanced; turn += 1) {
      const result = advanceMining(
        current,
        strongStats,
        strongStats.hp,
        strongStats.stamina,
        10,
        false,
        () => 0.5,
      );
      if (!result.roomAdvanced) {
        const moved = Math.abs(result.state.playerPosition.x - previous.x)
          + Math.abs(result.state.playerPosition.y - previous.y);
        expect(moved).toBeLessThanOrEqual(1);
        previous = { ...result.state.playerPosition };
      }
      current = result.state;
      advanced = Boolean(result.roomAdvanced);
    }
    expect(advanced).toBe(true);
    expect(current.roomNumber).toBe(2);
  });

  it("targets the outer rock layer after finding the key but before finding the door", () => {
    const state = createMiningRoom("miner", 1, strongStats, () => 0.34);
    const perimeterRock = Object.values(state.rocks).find(({ position }) => position.x === 1 && position.y === 5)!;
    const interiorRock = Object.values(state.rocks).find(({ position }) => position.x === 5 && position.y === 5)!;
    for (let y = 1; y < state.height - 1; y += 1) {
      for (let x = 1; x < state.width - 1; x += 1) state.tiles[y][x] = { kind: "floor" };
    }
    state.rocks = {
      [perimeterRock.id]: perimeterRock,
      [interiorRock.id]: interiorRock,
    };
    state.tiles[perimeterRock.position.y][perimeterRock.position.x] = {
      kind: "rock",
      rockId: perimeterRock.id,
    };
    state.tiles[interiorRock.position.y][interiorRock.position.x] = {
      kind: "rock",
      rockId: interiorRock.id,
    };
    state.playerPosition = { x: 4, y: 5 };
    state.hasKey = true;
    state.doorRevealed = false;

    const result = advanceMining(
      state,
      strongStats,
      strongStats.hp,
      strongStats.stamina,
      0,
      true,
      () => 0.99,
    );
    expect(result.state.activeRockId).toBe(perimeterRock.id);
  });

  it("uses one stamina after every fifth broken rock and ends at zero stamina", () => {
    const state = createMiningRoom("miner", 1, strongStats, () => 0.77);
    const rock = frontierMiningRocks(state)[0];
    state.staminaRockProgress = 4;
    state.activeRockId = rock.id;
    state.rocks[rock.id] = {
      ...rock,
      content: "empty",
      durability: new Decimal(1),
      maxDurability: new Decimal(1),
    };
    const result = advanceMining(
      state,
      strongStats,
      strongStats.hp,
      new Decimal(1),
      1,
      false,
      () => 0.5,
    );
    expect(result.stamina.eq(0)).toBe(true);
    expect(result.exhausted).toBe(true);
    expect(result.state.status).toBe("exhausted");
  });

  it("makes Cave Bats a post-zone-three threat above Clay Golems", () => {
    expect(caveBat.stats.hp.gt(clayGolem.stats.hp)).toBe(true);
    expect(caveBat.stats.attack.gt(clayGolem.stats.attack)).toBe(true);
    expect(caveBat.stats.defense.gt(clayGolem.stats.defense)).toBe(true);
    expect(caveBat.stats.spDefense.gt(clayGolem.stats.spDefense)).toBe(true);
  });
});

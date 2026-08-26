import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { createRingGear, EMPTY_EQUIPMENT } from "./gear";
import {
  createBattle,
  canStartRaid,
  battleReservedPlayerIds,
  deployPlayerUnit,
  effectiveStat,
  isGapAt,
  isInAttackRange,
  isInWeaponThrowRange,
  isUnitShielded,
  maxHp,
  manualCombatAction,
  occupiedPositions,
  performAction,
  physicalDamage,
  specialDamage,
  syncDeployingBattleHp,
  suggestedAction,
  selectDeploymentUnit,
  startRaid,
  turnPreview,
  undeployPlayerUnit,
  unitAt,
  type PlayerBattleSetup,
} from "./combat";
import { EMPTY_TRAINING, type TrainingLevels } from "./types";
import { WEAPON_SKILLS } from "./weapon-skills";

describe("combat", () => {
  it("mirrors units after horizontal movement while preserving facing on vertical movement", () => {
    const battle = deployedBattle(createBattle(1, knightParty()));
    const knight = battle.units.find((unit) => unit.team === "player")!;
    knight.position = { x: 2, y: 3 };

    const movedLeft = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "move", destination: { x: 1, y: 3 } },
    );
    expect(movedLeft.ok).toBe(true);
    if (!movedLeft.ok) return;
    expect(movedLeft.state.units.find((unit) => unit.id === knight.id)?.facing).toBe("left");

    const movedUp = performAction(
      { ...movedLeft.state, activeUnitId: knight.id },
      { type: "move", destination: { x: 1, y: 2 } },
    );
    expect(movedUp.ok).toBe(true);
    if (!movedUp.ok) return;
    expect(movedUp.state.units.find((unit) => unit.id === knight.id)?.facing).toBe("left");

    const movedRight = performAction(
      { ...movedUp.state, activeUnitId: knight.id },
      { type: "move", destination: { x: 2, y: 2 } },
    );
    expect(movedRight.ok).toBe(true);
    if (!movedRight.ok) return;
    expect(movedRight.state.units.find((unit) => unit.id === knight.id)?.facing).toBe("right");
  });

  it("never deals less than one damage", () => {
    expect(physicalDamage(new Decimal(1), new Decimal(999)).toNumber()).toBe(1);
    expect(physicalDamage(new Decimal(10), new Decimal(3)).toNumber()).toBe(13);
    expect(specialDamage(new Decimal(1), new Decimal(999)).toNumber()).toBe(1);
  });

  it("gives active Mystery Potions a five-percent chance to dodge direct enemy attacks", () => {
    const battle = deployedBattle(createBattle(1, knightParty()));
    const knight = battle.units.find((unit) => unit.team === "player")!;
    const undertaker = battle.units.find((unit) => unit.team === "enemy")!;
    knight.position = { x: 4, y: 3 };
    undertaker.position = { x: 5, y: 3 };
    const startingHp = knight.hp;

    const dodged = performAction(
      { ...battle, activeUnitId: undertaker.id },
      { type: "attack", targetId: knight.id },
      () => 0.049,
      0.05,
    );
    expect(dodged.ok).toBe(true);
    if (!dodged.ok) return;
    expect(dodged.state.units.find((unit) => unit.id === knight.id)?.hp.eq(startingHp)).toBe(true);
    expect(dodged.state.log[0]).toMatch(/dodged/i);
    expect(dodged.state.attackLog[0]).toBe("Undertaker uses Shovel on Knight for 0 damage");

    const hit = performAction(
      {
        ...battle,
        activeUnitId: undertaker.id,
        attackLog: Array.from({ length: 12 }, (_, index) => `Earlier attack ${index + 1}`),
      },
      { type: "attack", targetId: knight.id },
      () => 0.05,
      0.05,
    );
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.state.units.find((unit) => unit.id === knight.id)?.hp.lt(startingHp)).toBe(true);
    expect(hit.state.attackLog).toHaveLength(13);
    expect(hit.state.attackLog[0]).toMatch(/^Undertaker uses Shovel on Knight for [\d,]+ damage$/);
    expect(hit.state.attackLog.at(-1)).toBe("Earlier attack 12");
  });

  it("buffs every relevant stat on home territory", () => {
    const battle = deployedBattle(createBattle(1, knightParty()));
    const player = battle.units[0];
    expect(player.name).toBe("Knight");
    expect(battle.units[1].name).toBe("Undertaker");
    expect(maxHp(battle, player).toNumber()).toBe(65);
    expect(effectiveStat(battle, player, "attack").toNumber()).toBe(13);
    expect(effectiveStat(battle, player, "speed").toNumber()).toBe(13);
  });

  it("adds fish and equipped gear to base before compounded gold training in raids", () => {
    const training = { ...EMPTY_TRAINING, attack: 2 };
    const fishBonuses = { ...EMPTY_TRAINING, attack: 1 };
    const sword = createRingGear("sword", 0, "training-base-test");
    const equipment = { ...EMPTY_EQUIPMENT, sword: sword.id };
    const battle = createBattle(1, [{
      id: "knight",
      training,
      fishBonuses,
      inventory: [sword],
      equipment,
    }]);
    expect(battle.units[0].stats.attack.eq(new Decimal(16).mul(new Decimal(1.05).pow(2)))).toBe(true);
  });

  it("builds battle 1 as the exact 10x7 graveyard with three neutral columns", () => {
    const battle = createBattle(1, knightParty());
    expect(battle.level.board.width).toBe(10);
    expect(battle.level.board.height).toBe(7);
    expect(battle.level.board.terrain.every((row) =>
      row.length === 10 &&
      row.slice(0, 3).every((tile) => tile === "player") &&
      row.slice(3, 6).every((tile) => tile === "neutral") &&
      row.slice(6).every((tile) => tile === "enemy")
    )).toBe(true);
    expect(battle.level.board.walls).toEqual([
      { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 },
      { x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 },
    ]);
  });

  it("rerolls every support enemy around the gravestones on Battles 2 through 4", () => {
    const validSpawns = new Set([
      "1,2", "3,2", "5,2",
      "1,4", "3,4", "5,4",
    ]);
    for (const level of [2, 3, 4]) {
      const first = createBattle(level, knightParty(), { random: () => 0 });
      const retry = createBattle(level, knightParty(), {
        previousBattle: first,
        random: () => 0,
      });
      const firstEnemies = new Map(first.units
        .filter((unit) => unit.team === "enemy")
        .map((unit) => [unit.id, unit]));
      const retrySupports = retry.units.filter((unit) => unit.team === "enemy" && !unit.isRaidBoss);

      expect(new Set(retrySupports.map((unit) => `${unit.position.x},${unit.position.y}`)).size)
        .toBe(retrySupports.length);
      for (const unit of retrySupports) {
        expect(validSpawns.has(`${unit.position.x},${unit.position.y}`)).toBe(true);
        expect(unit.position).not.toEqual(firstEnemies.get(unit.id)?.position);
      }
      expect(retry.units.find((unit) => unit.isRaidBoss)?.position)
        .toEqual(first.units.find((unit) => unit.isRaidBoss)?.position);

      const preserved = createBattle(level, knightParty(), {
        previousBattle: retry,
        rerollRandomSpawns: false,
      });
      expect(preserved.units.filter((unit) => unit.team === "enemy").map((unit) => unit.position))
        .toEqual(retry.units.filter((unit) => unit.team === "enemy").map((unit) => unit.position));
    }
  });

  it("requires unique deployment on open player-owned tiles before starting", () => {
    let battle = createBattle(2, [
      ...knightParty(),
      { id: "worm", training: { ...EMPTY_TRAINING } },
    ]);
    expect(battle.status).toBe("deploying");
    expect(canStartRaid(battle)).toBe(false);
    expect(deployPlayerUnit(battle, { x: 5, y: 5 }).ok).toBe(false);

    let result = deployPlayerUnit(battle, { x: 2, y: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    battle = result.state;
    expect(deployPlayerUnit(battle, { x: 2, y: 5 }).ok).toBe(false);
    result = deployPlayerUnit(battle, { x: 2, y: 6 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    battle = result.state;
    expect(canStartRaid(battle)).toBe(true);
    expect(startRaid(battle).ok).toBe(true);
  });

  it("lets deployment remove a member and starts with only the remaining deployed party", () => {
    let battle = createBattle(2, [
      ...knightParty(),
      { id: "worm", training: { ...EMPTY_TRAINING } },
    ]);
    let result = deployPlayerUnit(battle, { x: 2, y: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    battle = result.state;
    result = deployPlayerUnit(battle, { x: 2, y: 6 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    battle = result.state;

    const worm = battle.units.find((unit) => unit.definitionId === "worm")!;
    const removed = undeployPlayerUnit(battle, worm.id);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.state.units.find((unit) => unit.id === worm.id)?.position.x).toBe(-1);
    expect(canStartRaid(removed.state)).toBe(true);

    const started = startRaid(removed.state);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.state.units.some((unit) => unit.id === worm.id)).toBe(false);
    expect(started.state.units.some((unit) => unit.definitionId === "knight")).toBe(true);
  });

  it("forbids Battle 6 deployment on the isolated Archer platforms", () => {
    const battle = createBattle(6, knightParty());
    expect(battle.level.board.terrain[0][5]).toBe("player");
    expect(deployPlayerUnit(battle, { x: 5, y: 0 }).ok).toBe(false);
    expect(deployPlayerUnit(battle, { x: 4, y: 10 }).ok).toBe(false);
    expect(deployPlayerUnit(battle, { x: 1, y: 5 }).ok).toBe(true);
  });

  it("reserves Battle members only while the Battle is running", () => {
    let battle = createBattle(1, knightParty());
    expect(battleReservedPlayerIds(battle)).toEqual([]);
    const deployed = deployPlayerUnit(battle, { x: 0, y: 3 });
    expect(deployed.ok).toBe(true);
    if (!deployed.ok) return;
    battle = deployed.state;
    expect(battleReservedPlayerIds(battle)).toEqual([]);
    const started = startRaid(battle);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(battleReservedPlayerIds(started.state)).toEqual(["knight"]);
    expect(battleReservedPlayerIds({ ...started.state, status: "won" })).toEqual([]);
  });

  it("keeps deployment HP synchronized with persistent party HP", () => {
    const damaged = createBattle(1, [{
      id: "knight",
      training: { ...EMPTY_TRAINING },
      startingHp: new Decimal(13),
    }]);
    const deployed = deployPlayerUnit(damaged, { x: 0, y: 3 });
    expect(deployed.ok).toBe(true);
    if (!deployed.ok) return;
    expect(deployed.state.units[0].hp.toNumber()).toBeCloseTo(16.25);

    const healed = syncDeployingBattleHp(deployed.state, { knight: new Decimal(52) });
    expect(healed.units[0].position).toEqual({ x: 0, y: 3 });
    expect(healed.units[0].hp.eq(maxHp(healed, healed.units[0]))).toBe(true);

    const fighting = startRaid(healed);
    expect(fighting.ok).toBe(true);
    if (!fighting.ok) return;
    expect(syncDeployingBattleHp(fighting.state, { knight: new Decimal(1) })).toBe(fighting.state);
  });

  it("makes battle 1 free and battle 2 require a few upgrades", () => {
    expect(runAuto(createBattle(1, knightParty())).status).toBe("won");
    for (let seed = 1; seed <= 24; seed += 1) {
      expect(runAuto(createBattle(2, knightParty(), { random: seededRandom(seed) })).status)
        .toBe("lost");
    }
    const upgraded: TrainingLevels = {
      ...EMPTY_TRAINING,
      hp: 6,
      attack: 8,
      defense: 5,
      speed: 3,
    };
    const upgradedResults = Array.from({ length: 24 }, (_, index) =>
      runAuto(createBattle(2, knightParty(upgraded), { random: seededRandom(index + 1) })).status
    );
    expect(upgradedResults).toContain("won");
  });

  it("gives the Goblin Shaman three-tile magic range in every direction", () => {
    const battle = deployedBattle(createBattle(6, knightParty()));
    const knight = battle.units.find((unit) => unit.team === "player")!;
    const shaman = battle.units.find((unit) => unit.isRaidBoss)!;
    expect(shaman.stats.spAttack.eq(30)).toBe(true);
    shaman.position = { x: 8, y: 2 };
    knight.position = { x: 5, y: 2 };
    expect(performAction(
      { ...battle, activeUnitId: shaman.id },
      { type: "attack", targetId: knight.id },
    ).ok).toBe(true);

    knight.position = { x: 10, y: 4 };
    expect(performAction(
      { ...battle, activeUnitId: shaman.id },
      { type: "attack", targetId: knight.id },
    ).ok).toBe(true);

    knight.position = { x: 8, y: 6 };
    expect(performAction(
      { ...battle, activeUnitId: shaman.id },
      { type: "attack", targetId: knight.id },
    ).ok).toBe(false);
  });

  it("lets Goblin Archers fire at any unobstructed line-of-sight angle", () => {
    const battle = deployedBattle(createBattle(6, knightParty()));
    const knight = battle.units.find((unit) => unit.team === "player")!;
    const archer = battle.units.find((unit) => unit.definitionId === "goblin-archer")!;
    knight.position = { x: 0, y: 3 };
    archer.position = { x: 5, y: 0 };
    expect(archer.stats.attack.eq(30)).toBe(true);
    expect(archer.attackRange).toBe(7);
    expect(isInAttackRange(archer, knight.position, battle)).toBe(true);
    expect(isInAttackRange(archer, { x: 12, y: 0 })).toBe(true);
    expect(isInAttackRange(archer, { x: 13, y: 0 })).toBe(false);
    const result = performAction(
      { ...battle, activeUnitId: archer.id },
      { type: "attack", targetId: knight.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.units.find((unit) => unit.id === knight.id)?.hp.lt(knight.hp)).toBe(true);
  });

  it("requires progressively more all-stat training for Battles 4, 5, and 6", () => {
    const firstWinningLevel = (battleNumber: number) => Array.from(
      { length: 61 },
      (_, level) => level,
    ).find((level) => {
      const training = Object.fromEntries(
        Object.keys(EMPTY_TRAINING).map((stat) => [stat, level]),
      ) as unknown as TrainingLevels;
      const party: PlayerBattleSetup[] = [
        { id: "knight", training, hasUndeadGem: true },
        { id: "worm", training },
      ];
      return runAuto(createBattle(
        battleNumber,
        party,
        battleNumber === 4 || battleNumber === 6 ? { random: seededRandom(12_349) } : undefined,
      )).status === "won";
    });
    const battle4Level = firstWinningLevel(4);
    const battle5Level = firstWinningLevel(5);
    const battle6Level = firstWinningLevel(6);
    expect(battle4Level).toBeTypeOf("number");
    expect(battle5Level).toBeTypeOf("number");
    expect(battle6Level).toBeTypeOf("number");
    expect(battle5Level!).toBeGreaterThan(battle4Level!);
    expect(battle6Level!).toBeGreaterThan(battle5Level!);
  });

  it("blocks movement and ranged attacks through battle walls", () => {
    const battle = deployedBattle(createBattle(6, knightParty()));
    const knight = battle.units.find((unit) => unit.team === "player")!;
    const chief = battle.units.find((unit) => unit.isRaidBoss)!;
    knight.position = { x: 13, y: 5 };
    chief.position = { x: 15, y: 5 };
    expect(performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "move", destination: { x: 14, y: 5 } },
    ).ok).toBe(false);
    expect(performAction(
      { ...battle, activeUnitId: chief.id },
      { type: "attack", targetId: knight.id },
    ).ok).toBe(false);
  });

  it("wins battle 2 when its boss dies while guards remain", () => {
    const battle = deployedBattle(createBattle(2, knightParty()));
    const knight = battle.units.find((unit) => unit.team === "player")!;
    const chief = battle.units.find((unit) => unit.isRaidBoss)!;
    knight.position = { x: 6, y: 3 };
    chief.position = { x: 7, y: 3 };
    chief.hp = new Decimal(1);
    const result = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "attack", targetId: chief.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("won");
    expect(result.state.units.some(
      (unit) => unit.team === "enemy" && !unit.isRaidBoss && unit.hp.gt(0),
    )).toBe(true);
  });

  it("routes automatic Battle movement around the graveyard layout", () => {
    expect(runAuto(createBattle(2, knightParty())).status).not.toBe("fighting");
  });

  it("lets Worm fire a straight-line special Acid Shot", () => {
    const party: PlayerBattleSetup[] = [
      ...knightParty(),
      { id: "worm", training: { ...EMPTY_TRAINING } },
    ];
    const battle = deployedBattle(createBattle(2, party));
    const worm = battle.units.find((unit) => unit.definitionId === "worm")!;
    const chief = battle.units.find((unit) => unit.isRaidBoss)!;
    worm.position = { x: 3, y: 3 };
    chief.position = { x: 7, y: 3 };
    expect(worm.attackRange).toBe(4);
    expect(worm.attackPattern).toBe("eight-way");
    expect(isInAttackRange(worm, { x: 7, y: 3 })).toBe(true);
    expect(isInAttackRange(worm, { x: 6, y: 6 })).toBe(true);
    expect(isInAttackRange(worm, { x: 8, y: 3 })).toBe(false);
    const before = chief.hp;
    const result = performAction(
      { ...battle, activeUnitId: worm.id },
      { type: "attack", targetId: chief.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const after = result.state.units.find((unit) => unit.id === chief.id)!.hp;
    expect(before.sub(after).eq(specialDamage(
      effectiveStat(battle, worm, "spAttack"),
      effectiveStat(battle, chief, "spDefense"),
    ))).toBe(true);
    expect(result.state.log[0]).toContain("Acid Shot");
  });

  it("makes Battle 8 water gaps block movement without blocking ranged attacks", () => {
    const party: PlayerBattleSetup[] = [
      { ...knightParty()[0], weaponThrowUnlocked: true, hasTrident: true },
      { id: "worm", training: { ...EMPTY_TRAINING } },
    ];
    const battle = deployedBattle(createBattle(8, party));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const worm = battle.units.find((unit) => unit.definitionId === "worm")!;
    const squid = battle.units.find((unit) => unit.definitionId === "abyssal-squid")!;

    knight.position = { x: 9, y: 6 };
    expect(isGapAt(battle, { x: 10, y: 6 })).toBe(true);
    expect(performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "move", destination: { x: 10, y: 6 } },
    ).ok).toBe(false);

    knight.position = { x: 9, y: 6 };
    worm.position = { x: 8, y: 6 };
    expect(isInAttackRange(knight, squid.position, battle)).toBe(false);
    expect(isInAttackRange(worm, squid.position, battle)).toBe(true);
    expect(isInWeaponThrowRange(knight, squid.position, battle)).toBe(true);
    knight.position = { x: 8, y: 6 };
    expect(isInWeaponThrowRange(knight, squid.position, battle)).toBe(false);
    const nearTentacle = battle.units
      .filter((unit) => unit.definitionId === "squid-tentacle")
      .sort((a, b) => a.position.x - b.position.x)[0]!;
    knight.position = { x: 9, y: nearTentacle.position.y };
    expect(isInWeaponThrowRange(knight, nearTentacle.position, battle)).toBe(true);
  });

  it("keeps the Squid invulnerable behind its Tentacles and forces a recovery pass after throwing", () => {
    const party: PlayerBattleSetup[] = [
      { ...knightParty()[0], weaponThrowUnlocked: true, hasTrident: true },
    ];
    const battle = deployedBattle(createBattle(8, party));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const squid = battle.units.find((unit) => unit.definitionId === "abyssal-squid")!;
    knight.position = { x: 11, y: 6 };

    expect(squid.canMove).toBe(false);
    expect(unitAt(battle, { x: 12, y: 5 })?.id).toBe(squid.id);
    expect(unitAt(battle, { x: 14, y: 7 })?.id).toBe(squid.id);
    const squidHp = squid.hp;
    const thrown = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "weaponThrow", targetId: squid.id },
    );
    expect(thrown.ok).toBe(true);
    if (!thrown.ok) return;
    const afterThrow = thrown.state.units.find((unit) => unit.id === knight.id)!;
    expect(afterThrow.forcedPasses).toBe(1);
    expect(afterThrow.weaponCooldownRemaining).toBe(4);
    expect(thrown.state.lastAttack?.attackName).toBe("Tidecaller Throw");
    expect(thrown.state.lastAttack?.visual).toBe("trident-throw");
    expect(thrown.state.units.find((unit) => unit.id === squid.id)?.hp.eq(squidHp)).toBe(true);
    expect(thrown.state.log[0]).toMatch(/Tentacles.*invulnerable/i);

    const passed = performAction(
      { ...thrown.state, status: "fighting", activeUnitId: knight.id },
      { type: "wait" },
    );
    expect(passed.ok).toBe(true);
    if (!passed.ok) return;
    expect(passed.state.units.find((unit) => unit.id === knight.id)?.forcedPasses).toBe(0);
    expect(passed.state.units.find((unit) => unit.id === knight.id)?.weaponCooldownRemaining).toBe(3);
    expect(passed.state.log[0]).toContain("must pass");

    const prematureThrow = performAction(
      { ...passed.state, status: "fighting", activeUnitId: knight.id },
      { type: "weaponThrow", targetId: squid.id },
    );
    expect(prematureThrow.ok).toBe(false);
    if (prematureThrow.ok) return;
    expect(prematureThrow.error).toMatch(/ready in 3 turns/i);
  });

  it("lets the Abyssal Squid attack while its Tentacle ward is active", () => {
    const battle = deployedBattle(createBattle(8, [
      { ...knightParty()[0], weaponThrowUnlocked: true, hasTrident: true },
    ]));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const squid = battle.units.find((unit) => unit.definitionId === "abyssal-squid")!;

    expect(battle.units.some((unit) =>
      unit.definitionId === "squid-tentacle" && unit.hp.gt(0)
    )).toBe(true);
    const ready = { ...battle, activeUnitId: squid.id };
    expect(suggestedAction(ready)).toEqual({ type: "attack", targetId: knight.id });
    const attacked = performAction(ready, suggestedAction(ready)!);
    expect(attacked.ok).toBe(true);
    if (!attacked.ok) return;
    expect(attacked.state.units.find((unit) => unit.id === knight.id)?.hp.lt(knight.hp)).toBe(true);
    expect(attacked.state.lastAttack?.attackName).toBe("Abyssal Orb");
  });

  it("lets ordinary attacks damage Tentacles while the Trident remains the stronger ranged option", () => {
    const battle = deployedBattle(createBattle(8, [
      { ...knightParty()[0], weaponThrowUnlocked: true, hasTrident: true },
      { id: "worm", training: { ...EMPTY_TRAINING }, weaponThrowUnlocked: true },
    ]));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const worm = battle.units.find((unit) => unit.definitionId === "worm")!;
    const westTentacle = battle.units.find((unit) =>
      unit.definitionId === "squid-tentacle" && unit.position.x === 11
    )!;
    const eastTentacle = battle.units.find((unit) =>
      unit.definitionId === "squid-tentacle" && unit.position.x === 15
    )!;

    worm.position = { x: 8, y: 6 };
    expect(worm.weaponThrowUnlocked).toBe(false);
    expect(isInWeaponThrowRange(worm, westTentacle.position, battle)).toBe(false);
    const acidBlocked = performAction(
      { ...battle, activeUnitId: worm.id },
      { type: "attack", targetId: westTentacle.id },
    );
    expect(acidBlocked.ok).toBe(true);
    if (!acidBlocked.ok) return;
    expect(acidBlocked.state.units.find((unit) => unit.id === westTentacle.id)?.hp.lt(westTentacle.hp)).toBe(true);

    knight.position = { x: 9, y: 6 };
    expect(isInWeaponThrowRange(knight, eastTentacle.position, battle)).toBe(false);
    knight.position = { x: 17, y: 6 };
    expect(isInWeaponThrowRange(knight, eastTentacle.position, battle)).toBe(true);

    knight.position = { x: 9, y: 6 };
    const tridentHit = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "weaponThrow", targetId: westTentacle.id },
    );
    expect(tridentHit.ok).toBe(true);
    if (!tridentHit.ok) return;
    const hitTentacle = tridentHit.state.units.find((unit) => unit.id === westTentacle.id)!;
    expect(WEAPON_SKILLS["trident-throw"].damageMultiplier).toBe(3);
    expect(westTentacle.hp.sub(hitTentacle.hp).eq(specialDamage(
      effectiveStat(battle, knight, "spAttack").mul(WEAPON_SKILLS["trident-throw"].damageMultiplier),
      effectiveStat(battle, westTentacle, "spDefense"),
    ))).toBe(true);

    for (const unit of battle.units.filter((candidate) => candidate.definitionId === "squid-tentacle")) {
      unit.hp = new Decimal(0);
    }
    const squid = battle.units.find((unit) => unit.definitionId === "abyssal-squid")!;
    worm.position = { x: 8, y: 6 };
    const acidAfterTentacles = performAction(
      { ...battle, activeUnitId: worm.id },
      { type: "attack", targetId: squid.id },
    );
    expect(acidAfterTentacles.ok).toBe(true);
    if (!acidAfterTentacles.ok) return;
    expect(acidAfterTentacles.state.units.find((unit) => unit.id === squid.id)?.hp.lt(squid.hp)).toBe(true);
  });

  it("keeps a character's innate basic attack when a Trident supplies its separate throw", () => {
    const battle = createBattle(8, [{
      id: "worm",
      training: { ...EMPTY_TRAINING },
      weaponThrowUnlocked: true,
      hasTrident: true,
    }]);
    const worm = battle.units.find((unit) => unit.definitionId === "worm")!;
    expect(worm.attackName).toBe("Acid Shot");
    expect(worm.attackType).toBe("special");
    expect(worm.attackRange).toBe(4);
    expect(worm.weaponAbilityId).toBe("trident-throw");
  });

  it("maps manual left-clicks to basic attacks and right-clicks to weapon attacks", () => {
    const sweep = { ...createRingGear("sword", 2, "manual-input-test"), weaponAbilityId: "sweep" as const };
    const battle = deployedBattle(createBattle(2, [{
      id: "knight",
      training: { ...EMPTY_TRAINING },
      inventory: [sweep],
      equipment: { ...EMPTY_EQUIPMENT, sword: sweep.id },
    }]));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const enemy = battle.units.find((unit) => unit.team === "enemy")!;
    knight.position = { x: 4, y: 3 };
    enemy.position = { x: 5, y: 3 };

    expect(manualCombatAction(
      { ...battle, activeUnitId: knight.id },
      enemy.position,
      "primary",
    )).toEqual({ type: "attack", targetId: enemy.id });
    expect(manualCombatAction(
      { ...battle, activeUnitId: knight.id },
      enemy.position,
      "secondary",
    )).toEqual({ type: "weaponSkill", targetId: enemy.id });
  });

  it("casts an equipped sweeping weapon skill across adjacent enemies and then cools down", () => {
    const sweep = { ...createRingGear("sword", 2, "sweep-test"), weaponAbilityId: "sweep" as const };
    const battle = deployedBattle(createBattle(2, [{
      id: "knight",
      training: { ...EMPTY_TRAINING },
      inventory: [sweep],
      equipment: { ...EMPTY_EQUIPMENT, sword: sweep.id },
    }]));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const enemies = battle.units.filter((unit) => unit.team === "enemy").slice(0, 2);
    knight.position = { x: 4, y: 3 };
    enemies[0].position = { x: 4, y: 2 };
    enemies[1].position = { x: 5, y: 3 };
    const before = enemies.map((enemy) => enemy.hp);
    const cast = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "weaponSkill", targetId: enemies[0].id },
    );
    expect(cast.ok).toBe(true);
    if (!cast.ok) return;
    expect(cast.state.units.find((unit) => unit.id === enemies[0].id)?.hp.lt(before[0])).toBe(true);
    expect(cast.state.units.find((unit) => unit.id === enemies[1].id)?.hp.lt(before[1])).toBe(true);
    expect(cast.state.units.find((unit) => unit.id === knight.id)?.weaponCooldownRemaining).toBe(3);
    expect(cast.state.lastAttack?.visual).toBe("sword-sweep");

    const cooled = performAction(
      { ...cast.state, activeUnitId: knight.id },
      { type: "wait" },
    );
    expect(cooled.ok).toBe(true);
    if (!cooled.ok) return;
    expect(cooled.state.units.find((unit) => unit.id === knight.id)?.weaponCooldownRemaining).toBe(2);
  });

  it("lets a prepared Trident party solve Battle 8 on auto without pathing into water", () => {
    const veteran: TrainingLevels = {
      hp: 60,
      stamina: 0,
      attack: 60,
      defense: 60,
      spAttack: 60,
      spDefense: 60,
      speed: 60,
      luck: 0,
    };
    const result = runAuto(createBattle(8, [
      { id: "knight", training: veteran, weaponThrowUnlocked: true, hasTrident: true },
      { id: "worm", training: veteran, weaponThrowUnlocked: true },
    ]));
    expect(result.status).toBe("won");
    expect(result.units.find((unit) => unit.isRaidBoss)?.hp.eq(0)).toBe(true);
  });

  it("lets a prepared party clear Battle 8 without treating the Trident as a hard requirement", () => {
    const veteran: TrainingLevels = {
      hp: 60,
      stamina: 0,
      attack: 60,
      defense: 60,
      spAttack: 60,
      spDefense: 60,
      speed: 60,
      luck: 0,
    };
    const result = runAuto(createBattle(8, [
      { id: "knight", training: veteran },
      { id: "worm", training: veteran },
    ]));
    expect(result.status).toBe("won");
    expect(result.units.find((unit) => unit.isRaidBoss)?.hp.eq(0)).toBe(true);
  });

  it("keeps Battle 8 auto moving or attacking after the Tentacles are gone", () => {
    const battle = deployedBattle(createBattle(8, [
      { id: "knight", training: { ...EMPTY_TRAINING }, weaponThrowUnlocked: true, hasTrident: true },
      { id: "worm", training: { ...EMPTY_TRAINING } },
    ]));
    for (const enemy of battle.units.filter((unit) => unit.team === "enemy" && !unit.isRaidBoss)) {
      enemy.hp = new Decimal(0);
    }
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const worm = battle.units.find((unit) => unit.definitionId === "worm")!;
    knight.position = { x: 9, y: 6 };
    worm.position = { x: 9, y: 5 };

    expect(suggestedAction({ ...battle, activeUnitId: knight.id })?.type).not.toBe("wait");
    expect(suggestedAction({ ...battle, activeUnitId: worm.id })?.type).not.toBe("wait");
  });

  it("keeps the Battle 9 Ooze vulnerable while its Guardians are alive", () => {
    const battle = deployedBattle(createBattle(9, knightParty()));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const ooze = battle.units.find((unit) => unit.definitionId === "abyssal-ooze")!;
    const occupiedEnemyTiles = battle.units
      .filter((unit) => unit.team === "enemy")
      .flatMap(occupiedPositions);
    expect(new Set(occupiedEnemyTiles.map(({ x, y }) => `${x},${y}`)).size).toBe(occupiedEnemyTiles.length);
    expect(occupiedEnemyTiles.every((position) => !isGapAt(battle, position))).toBe(true);
    knight.position = { x: 13, y: 6 };
    const before = ooze.hp;

    const hit = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "attack", targetId: ooze.id },
    );
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.state.units.find((unit) => unit.id === ooze.id)?.hp.lt(before)).toBe(true);
    expect(hit.state.log[0]).not.toMatch(/invulnerable/i);
  });

  it("limits late-battle deployment to the marked start platform and lets the 3x3 Ooze advance", () => {
    const deployingEight = createBattle(8, knightParty());
    expect(deployPlayerUnit(deployingEight, { x: 4, y: 2 }).ok).toBe(false);
    expect(deployPlayerUnit(deployingEight, { x: 4, y: 4 }).ok).toBe(true);

    const battle = deployedBattle(createBattle(9, knightParty()));
    const ooze = battle.units.find((unit) => unit.definitionId === "abyssal-ooze")!;
    const action = suggestedAction({ ...battle, activeUnitId: ooze.id });
    expect(action?.type).toBe("move");
  });

  it("lowers every combat stat and maximum HP when a Battle 9 Guardian falls", () => {
    const battle = deployedBattle(createBattle(9, knightParty()));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const ooze = battle.units.find((unit) => unit.definitionId === "abyssal-ooze")!;
    const guardian = battle.units.find((unit) => unit.definitionId === "ooze-guardian")!;
    const maximumBefore = maxHp(battle, ooze);
    const defenseBefore = effectiveStat(battle, ooze, "defense");
    const speedBefore = effectiveStat(battle, ooze, "speed");
    knight.position = { x: guardian.position.x - 1, y: guardian.position.y };
    knight.stats.attack = new Decimal(1_000);
    guardian.hp = new Decimal(1);

    const defeated = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "attack", targetId: guardian.id },
    );
    expect(defeated.ok).toBe(true);
    if (!defeated.ok) return;
    const weakenedOoze = defeated.state.units.find((unit) => unit.id === ooze.id)!;
    expect(weakenedOoze.weakeningStacks).toBe(1);
    expect(maxHp(defeated.state, weakenedOoze).eq(maximumBefore.mul(0.8).round())).toBe(true);
    expect(effectiveStat(defeated.state, weakenedOoze, "defense").lt(defenseBefore)).toBe(true);
    expect(effectiveStat(defeated.state, weakenedOoze, "speed").lt(speedBefore)).toBe(true);
    expect(weakenedOoze.hp.eq(maxHp(defeated.state, weakenedOoze))).toBe(true);
    expect(defeated.state.log[0]).toMatch(/fallen guardian drains its power/i);
  });

  it("prioritizes Battle 9 Guardians over the Ooze on auto", () => {
    const battle = deployedBattle(createBattle(9, knightParty()));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const guardian = battle.units.find((unit) => unit.definitionId === "ooze-guardian")!;
    for (const enemy of battle.units.filter((unit) => unit.team === "enemy")) {
      if (enemy.id !== guardian.id && enemy.definitionId !== "abyssal-ooze") enemy.hp = new Decimal(0);
    }
    knight.position = { x: guardian.position.x - 1, y: guardian.position.y };
    expect(suggestedAction({ ...battle, activeUnitId: knight.id })).toEqual({
      type: "attack",
      targetId: guardian.id,
    });
  });

  it("keeps the mobile Battle 10 Engine shielded until its rear Dynamo falls", () => {
    const battle = deployedBattle(createBattle(10, knightParty()));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const engine = battle.units.find((unit) => unit.definitionId === "rustmire-engine")!;
    const dynamo = battle.units.find((unit) => unit.definitionId === "brine-dynamo")!;

    expect(isUnitShielded(battle, engine)).toBe(true);
    knight.position = { x: 16, y: 7 };
    const engineHp = engine.hp;
    const blocked = performAction(
      { ...battle, activeUnitId: knight.id },
      { type: "attack", targetId: engine.id },
    );
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;
    expect(blocked.state.units.find((unit) => unit.id === engine.id)?.hp.eq(engineHp)).toBe(true);
    expect(blocked.state.log[0]).toMatch(/Brine Dynamo/i);

    const opened = {
      ...blocked.state,
      activeUnitId: knight.id,
      units: blocked.state.units.map((unit) => {
        if (unit.definitionId === "barnacle-drone") return { ...unit, hp: new Decimal(0) };
        if (unit.id === knight.id) {
          return { ...unit, position: { x: 23, y: 7 }, stats: { ...unit.stats, attack: new Decimal(1_000) } };
        }
        if (unit.id === dynamo.id) return { ...unit, hp: new Decimal(1) };
        return unit;
      }),
    };
    expect(suggestedAction(opened)).toEqual({ type: "attack", targetId: dynamo.id });
    const destroyed = performAction(opened, suggestedAction(opened)!);
    expect(destroyed.ok).toBe(true);
    if (!destroyed.ok) return;
    expect(isUnitShielded(
      destroyed.state,
      destroyed.state.units.find((unit) => unit.id === engine.id)!,
    )).toBe(false);
  });

  it("routes both the 3x3 Rustmire Engine and veteran auto through Battle 10", () => {
    const battle = deployedBattle(createBattle(10, knightParty()));
    const engine = battle.units.find((unit) => unit.definitionId === "rustmire-engine")!;
    const belchAction = suggestedAction({ ...battle, activeUnitId: engine.id });
    expect(belchAction).toEqual({ type: "oozeBelch" });
    const belched = performAction(
      { ...battle, activeUnitId: engine.id },
      belchAction!,
      () => 0.42,
    );
    expect(belched.ok).toBe(true);
    if (!belched.ok) return;
    expect(belched.state.hazards.length).toBeGreaterThanOrEqual(2);
    expect(belched.state.hazards.length).toBeLessThanOrEqual(3);
    expect(belched.state.hazards.every((hazard) => hazard.kind === "acid-ooze")).toBe(true);
    expect(belched.state.log[0]).toMatch(/corrosive belch/i);
    expect(suggestedAction({ ...belched.state, activeUnitId: engine.id })?.type).toBe("move");

    const veteran: TrainingLevels = {
      hp: 70,
      stamina: 0,
      attack: 70,
      defense: 70,
      spAttack: 70,
      spDefense: 70,
      speed: 70,
      luck: 0,
    };
    const result = runAuto(createBattle(10, [
      { id: "knight", training: veteran, weaponThrowUnlocked: true, hasTrident: true },
      { id: "worm", training: veteran },
      { id: "miner", training: veteran },
    ]));
    expect(result.status).toBe("won");
    expect(result.units.find((unit) => unit.definitionId === "brine-dynamo")?.hp.eq(0)).toBe(true);
    expect(result.units.find((unit) => unit.definitionId === "rustmire-engine")?.hp.eq(0)).toBe(true);
  });

  it("applies visible multi-turn corrosion after a party member enters Battle 10 ooze", () => {
    const battle = deployedBattle(createBattle(10, knightParty()));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    knight.position = { x: 1, y: 7 };
    const hazardous = {
      ...battle,
      activeUnitId: knight.id,
      hazards: [{
        id: "test-acid-ooze",
        kind: "acid-ooze" as const,
        position: { x: 2, y: 7 },
        sourceTeam: "enemy" as const,
        remainingActions: 12,
        corrosionTurns: 3,
        damagePerTurn: new Decimal(36),
      }],
    };
    const entered = performAction(hazardous, { type: "move", destination: { x: 2, y: 7 } });
    expect(entered.ok).toBe(true);
    if (!entered.ok) return;
    const afflicted = entered.state.units.find((unit) => unit.id === knight.id)!;
    expect(afflicted.corrosionTurns).toBe(3);
    expect(afflicted.corrosionDamage.eq(36)).toBe(true);
    expect(entered.state.log[0]).toMatch(/corrosive ooze/i);

    const beforeTick = afflicted.hp;
    const ticked = performAction(
      { ...entered.state, activeUnitId: knight.id },
      { type: "wait" },
    );
    expect(ticked.ok).toBe(true);
    if (!ticked.ok) return;
    const afterTick = ticked.state.units.find((unit) => unit.id === knight.id)!;
    expect(beforeTick.sub(afterTick.hp).eq(36)).toBe(true);
    expect(afterTick.corrosionTurns).toBe(2);
    expect(ticked.state.log[0]).toMatch(/corrosion damage/i);
  });

  it("shows the next five scheduled actions and enforces one-tile movement", () => {
    const battle = deployedBattle(createBattle(1, knightParty()));
    expect(turnPreview(battle, 5)).toHaveLength(5);
    expect(performAction(battle, { type: "move", destination: { x: 0, y: 0 } }).ok).toBe(false);
    expect(performAction(battle, { type: "move", destination: { x: 1, y: 3 } }).ok).toBe(true);
  });

  it("keeps the Skele-King invulnerable until a deployed member equips the Undead Gem", () => {
    const withoutGem = deployedBattle(createBattle(4, knightParty()));
    const knight = withoutGem.units.find((unit) => unit.team === "player")!;
    const king = withoutGem.units.find((unit) => unit.definitionId === "skeleton-king")!;
    knight.position = { x: 6, y: 3 };
    king.position = { x: 7, y: 3 };
    const blocked = performAction(
      { ...withoutGem, activeUnitId: knight.id },
      { type: "attack", targetId: king.id },
    );
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;
    expect(blocked.state.units.find((unit) => unit.id === king.id)?.hp.eq(king.hp)).toBe(true);
    expect(blocked.state.log[0]).toMatch(/invulnerable/i);

    const withGem = deployedBattle(createBattle(4, [{ ...knightParty()[0], hasUndeadGem: true }]));
    const gemKnight = withGem.units.find((unit) => unit.team === "player")!;
    const gemKing = withGem.units.find((unit) => unit.definitionId === "skeleton-king")!;
    gemKnight.position = { x: 6, y: 3 };
    gemKing.position = { x: 7, y: 3 };
    const hit = performAction(
      { ...withGem, activeUnitId: gemKnight.id },
      { type: "attack", targetId: gemKing.id },
    );
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.state.units.find((unit) => unit.id === gemKing.id)?.hp.lt(gemKing.hp)).toBe(true);
  });

  it("lets the Beast Tamer randomly drop one or two temporary beast cages", () => {
    const battle = deployedBattle(createBattle(7, knightParty()));
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    const oneSummoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0,
    );
    expect(oneSummoned.ok).toBe(true);
    if (!oneSummoned.ok) return;
    const summons = oneSummoned.state.units.filter((unit) => unit.summonedById === tamer.id);
    expect(summons).toHaveLength(1);
    const fireAnt = summons[0];
    expect(fireAnt.definitionId).toBe("fire-ant");
    expect(fireAnt.summonCaged).toBe(true);
    expect(fireAnt.hp.gt(0)).toBe(true);
    expect(oneSummoned.state.readyAt[fireAnt.id]).toBeDefined();
    expect(oneSummoned.state.log[0]).toMatch(/a cage crashes down/i);

    const twoSummoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0.99,
    );
    expect(twoSummoned.ok).toBe(true);
    if (!twoSummoned.ok) return;
    const pair = twoSummoned.state.units.filter((unit) => unit.summonedById === tamer.id);
    expect(pair).toHaveLength(2);
    expect(pair.every((unit) => unit.definitionId === "bee")).toBe(true);
    expect(pair.every((unit) => twoSummoned.state.readyAt[unit.id] !== undefined)).toBe(true);
    expect(twoSummoned.state.log[0]).toMatch(/two cages crash down/i);

    const exitAction = suggestedAction({ ...oneSummoned.state, activeUnitId: fireAnt.id });
    expect(exitAction?.type).toBe("move");
    if (!exitAction || exitAction.type !== "move") return;
    const exited = performAction({ ...oneSummoned.state, activeUnitId: fireAnt.id }, exitAction);
    expect(exited.ok).toBe(true);
    if (!exited.ok) return;
    expect(exited.state.units.find((unit) => unit.id === fireAnt.id)?.summonCaged).toBe(false);
    expect(exited.state.log[0]).toMatch(/walks out/i);
  });

  it("has the Goblin Shaman frequently teleport from targets within spell range", () => {
    const battle = deployedBattle(createBattle(6, knightParty()));
    const shaman = battle.units.find((unit) => unit.definitionId === "goblin-shaman")!;
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    shaman.position = { x: 5, y: 3 };
    knight.position = { x: 2, y: 3 };
    shaman.teleportCooldown = 0;
    const ready = { ...battle, activeUnitId: shaman.id };

    const action = suggestedAction(ready);
    expect(action?.type).toBe("teleport");
    if (!action || action.type !== "teleport") return;
    expect(Math.max(
      Math.abs(action.destination.x - shaman.position.x),
      Math.abs(action.destination.y - shaman.position.y),
    )).toBeLessThanOrEqual(10);

    const teleported = performAction(ready, action);
    expect(teleported.ok).toBe(true);
    if (!teleported.ok) return;
    const movedShaman = teleported.state.units.find((unit) => unit.id === shaman.id)!;
    expect(movedShaman.position).toEqual(action.destination);
    expect(movedShaman.teleportCooldown).toBe(2);
    expect(teleported.state.log[0]).toMatch(/shadow step/i);

    const tooFar = performAction(
      { ...battle, activeUnitId: shaman.id },
      { type: "teleport", destination: { x: 19, y: 0 } },
    );
    expect(tooFar.ok).toBe(false);
  });

  it("deploys one visible Goblin Shaman boss in Battle 6", () => {
    const battle = createBattle(6, knightParty());
    const shamans = battle.units.filter((unit) => unit.definitionId === "goblin-shaman");

    expect(shamans).toHaveLength(1);
    expect(shamans[0].isRaidBoss).toBe(true);
    expect(shamans[0].concealsBossIdentity).toBe(false);
    expect(shamans[0].position).toEqual({ x: 17, y: 5 });
  });

  it("shields the Beast Tamer behind living summons and makes auto clear them first", () => {
    const battle = deployedBattle(createBattle(7, knightParty()));
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    const summoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0,
    );
    expect(summoned.ok).toBe(true);
    if (!summoned.ok) return;
    const knight = summoned.state.units.find((unit) => unit.definitionId === "knight")!;
    const livingSummons = summoned.state.units.filter((unit) => unit.summonedById === tamer.id);
    const summon = livingSummons[0];
    for (const extra of livingSummons.slice(1)) extra.hp = new Decimal(0);
    const liveTamer = summoned.state.units.find((unit) => unit.id === tamer.id)!;
    knight.position = { x: 9, y: 4 };
    liveTamer.position = { x: 10, y: 4 };
    summon.position = { x: 9, y: 3 };
    summon.summonCaged = false;
    const shieldedState = { ...summoned.state, activeUnitId: knight.id };
    const tamerHp = liveTamer.hp;

    const blocked = performAction(shieldedState, { type: "attack", targetId: tamer.id });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;
    expect(blocked.state.units.find((unit) => unit.id === tamer.id)?.hp.eq(tamerHp)).toBe(true);
    expect(blocked.state.log[0]).toMatch(/summoned-beast shield/i);

    const autoTarget = suggestedAction(shieldedState);
    expect(autoTarget).toEqual({ type: "attack", targetId: summon.id });
    knight.stats = { ...knight.stats, attack: new Decimal(1_000_000) };
    const cleared = performAction(shieldedState, autoTarget!);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.state.units.find((unit) => unit.id === summon.id)?.hp.eq(0)).toBe(true);

    const exposedTamer = cleared.state.units.find((unit) => unit.id === tamer.id)!;
    const exposedKnight = cleared.state.units.find((unit) => unit.id === knight.id)!;
    const hit = performAction(
      { ...cleared.state, activeUnitId: exposedKnight.id },
      { type: "attack", targetId: exposedTamer.id },
    );
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.state.units.find((unit) => unit.id === exposedTamer.id)?.hp.lt(exposedTamer.hp)).toBe(true);
  });

  it("keeps summoned enemies invulnerable and out of auto targeting until their cage opens", () => {
    const battle = deployedBattle(createBattle(7, knightParty()));
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    const summoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0,
    );
    expect(summoned.ok).toBe(true);
    if (!summoned.ok) return;
    const knight = summoned.state.units.find((unit) => unit.definitionId === "knight")!;
    const caged = summoned.state.units.find((unit) => unit.summonedById === tamer.id)!;
    knight.position = { x: 8, y: 3 };
    caged.position = { x: 9, y: 3 };
    tamer.position = { x: 10, y: 4 };
    const cagedHp = caged.hp;
    const ready = { ...summoned.state, activeUnitId: knight.id };

    expect(suggestedAction(ready)).toEqual({ type: "wait" });
    const blocked = performAction(ready, { type: "attack", targetId: caged.id });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;
    expect(blocked.state.units.find((unit) => unit.id === caged.id)?.hp.eq(cagedHp)).toBe(true);
    expect(blocked.state.log[0]).toMatch(/sealed cage/i);
  });

  it("keeps a ranged boss fighting instead of endlessly retreating from melee", () => {
    const battle = deployedBattle(createBattle(7, knightParty()));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    knight.position = { x: 2, y: 2 };
    tamer.position = { x: 3, y: 2 };
    tamer.summonCooldown = 2;
    const action = suggestedAction({ ...battle, activeUnitId: tamer.id });
    expect(action?.type).toBe("attack");
  });

  it("hits the three forward tiles with the Alligator's Wide Snap", () => {
    const party: PlayerBattleSetup[] = [
      ...knightParty(),
      { id: "worm", training: { ...EMPTY_TRAINING } },
    ];
    const battle = deployedBattle(createBattle(7, party));
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    const summoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0.25,
    );
    expect(summoned.ok).toBe(true);
    if (!summoned.ok) return;
    const alligator = summoned.state.units.find((unit) => unit.definitionId === "alligator")!;
    const knight = summoned.state.units.find((unit) => unit.definitionId === "knight")!;
    const worm = summoned.state.units.find((unit) => unit.definitionId === "worm")!;
    alligator.position = { x: 2, y: 3 };
    alligator.summonCaged = false;
    knight.position = { x: 4, y: 3 };
    worm.position = { x: 4, y: 2 };
    expect(unitAt(summoned.state, { x: 2, y: 3 })?.id).toBe(alligator.id);
    expect(unitAt(summoned.state, { x: 3, y: 3 })?.id).toBe(alligator.id);
    const knightHp = knight.hp;
    const wormHp = worm.hp;
    const snapped = performAction(
      { ...summoned.state, activeUnitId: alligator.id },
      { type: "attack", targetId: knight.id },
    );
    expect(snapped.ok).toBe(true);
    if (!snapped.ok) return;
    expect(snapped.state.units.find((unit) => unit.id === knight.id)?.hp.lt(knightHp)).toBe(true);
    expect(snapped.state.units.find((unit) => unit.id === worm.id)?.hp.lt(wormHp)).toBe(true);
  });

  it("gives the Dragonfly an exact two-tile orthogonal or diagonal ranged attack", () => {
    const battle = deployedBattle(createBattle(7, knightParty()));
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    const summoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0.6,
    );
    expect(summoned.ok).toBe(true);
    if (!summoned.ok) return;
    const dragonfly = summoned.state.units.find((unit) => unit.definitionId === "dragonfly")!;
    dragonfly.position = { x: 4, y: 4 };
    dragonfly.summonCaged = false;
    expect(isInAttackRange(dragonfly, { x: 6, y: 6 }, summoned.state)).toBe(true);
    expect(isInAttackRange(dragonfly, { x: 6, y: 4 }, summoned.state)).toBe(true);
    expect(isInAttackRange(dragonfly, { x: 6, y: 5 }, summoned.state)).toBe(false);
    expect(isInAttackRange(dragonfly, { x: 7, y: 7 }, summoned.state)).toBe(false);
  });

  it("lets the Bee paralyze a target for its next turn half the time", () => {
    const battle = deployedBattle(createBattle(7, knightParty()));
    const tamer = battle.units.find((unit) => unit.definitionId === "beast-tamer")!;
    const summoned = performAction(
      { ...battle, activeUnitId: tamer.id },
      { type: "summonBeast" },
      () => 0.99,
    );
    expect(summoned.ok).toBe(true);
    if (!summoned.ok) return;
    const bee = summoned.state.units.find((unit) => unit.definitionId === "bee")!;
    const knight = summoned.state.units.find((unit) => unit.definitionId === "knight")!;
    bee.position = { x: 4, y: 4 };
    bee.summonCaged = false;
    knight.position = { x: 6, y: 4 };
    const hit = performAction(
      { ...summoned.state, activeUnitId: bee.id },
      { type: "attack", targetId: knight.id },
      () => 0.49,
    );
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    const paralyzedKnight = hit.state.units.find((unit) => unit.id === knight.id)!;
    expect(paralyzedKnight.paralyzedTurns).toBe(1);
    expect(hit.state.log[0]).toMatch(/paralyzed/i);
    expect(suggestedAction({ ...hit.state, activeUnitId: knight.id })).toEqual({ type: "wait" });

    const skipped = performAction(
      { ...hit.state, activeUnitId: knight.id },
      { type: "wait" },
    );
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) return;
    expect(skipped.state.units.find((unit) => unit.id === knight.id)?.paralyzedTurns).toBe(0);
    expect(skipped.state.log[0]).toMatch(/cannot act/i);
  });

  it("lets Suction Cups paralyze a non-boss attacker but never a boss", () => {
    const party: PlayerBattleSetup[] = [{
      id: "knight",
      training: { ...EMPTY_TRAINING },
      hasSuctionCups: true,
    }];
    const battle = deployedBattle(createBattle(2, party));
    const knight = battle.units.find((unit) => unit.definitionId === "knight")!;
    const support = battle.units.find((unit) => unit.team === "enemy" && !unit.isRaidBoss)!;
    knight.position = { x: 4, y: 3 };
    support.position = { x: 5, y: 3 };
    const retaliated = performAction(
      { ...battle, activeUnitId: support.id },
      { type: "attack", targetId: knight.id },
      () => 0.1,
    );
    expect(retaliated.ok).toBe(true);
    if (!retaliated.ok) return;
    expect(retaliated.state.units.find((unit) => unit.id === support.id)?.paralyzedTurns).toBe(1);
    expect(retaliated.state.log[0]).toMatch(/Suction Cups paralyze/i);

    const bossBattle = deployedBattle(createBattle(2, party));
    const bossKnight = bossBattle.units.find((unit) => unit.definitionId === "knight")!;
    const boss = bossBattle.units.find((unit) => unit.isRaidBoss)!;
    bossKnight.position = { x: 6, y: 3 };
    boss.position = { x: 7, y: 3 };
    const bossHit = performAction(
      { ...bossBattle, activeUnitId: boss.id },
      { type: "attack", targetId: bossKnight.id },
      () => 0.1,
    );
    expect(bossHit.ok).toBe(true);
    if (!bossHit.ok) return;
    expect(bossHit.state.units.find((unit) => unit.id === boss.id)?.paralyzedTurns).toBe(0);
  });
});

function knightParty(training = { ...EMPTY_TRAINING }): PlayerBattleSetup[] {
  return [{ id: "knight", training }];
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function runAuto(initial: ReturnType<typeof createBattle>) {
  let state = deployedBattle(initial);
  for (let step = 0; step < 2_000 && state.status === "fighting"; step += 1) {
    const action = suggestedAction(state);
    if (!action) break;
    const result = performAction(state, action);
    if (!result.ok) throw new Error(result.error);
    state = result.state;
  }
  return state;
}

function deployedBattle(initial: ReturnType<typeof createBattle>) {
  let state = initial;
  for (const unit of state.units.filter((candidate) => candidate.team === "player")) {
    const selected = selectDeploymentUnit(state, unit.id);
    if (!selected.ok) throw new Error(selected.error);
    const position = state.level.playerPositions[unit.definitionId as "knight" | "worm"];
    if (!position) throw new Error(`No test deployment position for ${unit.definitionId}`);
    const deployed = deployPlayerUnit(selected.state, position);
    if (!deployed.ok) throw new Error(deployed.error);
    state = deployed.state;
  }
  const started = startRaid(state);
  if (!started.ok) throw new Error(started.error);
  return started.state;
}

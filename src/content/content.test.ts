import { describe, expect, it } from "vitest";
import { createHammerVaultRoomTiles } from "./adventure-rooms/hammer-vault-room";
import { createBlacksmithRoomTiles } from "./adventure-rooms/blacksmith-room";
import { createMinerRoomTiles } from "./adventure-rooms/miner-room";
import { createPortalRoomTiles } from "./adventure-rooms/portal-room";
import { createPotionmasterRoomTiles } from "./adventure-rooms/potionmaster-room";
import { createCartographerRoomTiles } from "./adventure-rooms/cartographer-room";
import { createAnglerRoomTiles } from "./adventure-rooms/angler-room";
import { createOddityBrewerRoomTiles } from "./adventure-rooms/oddity-brewer-room";
import { createRegenRoomTiles } from "./adventure-rooms/regen-room";
import { createRescueRoomTiles } from "./adventure-rooms/rescue-room";
import { createShopkeeperRoomTiles } from "./adventure-rooms/shopkeeper-room";
import { createTowerExteriorRoomTiles, TOWER_DOOR_HEIGHT, TOWER_DOOR_WIDTH, TOWER_EXTERIOR_SIZE } from "./adventure-rooms/tower-exterior-room";
import { archipelagoBoard, beastTamerBoard, boards, graveyardBoard, graveyardRandomSpawnPositions, goblinArcherBoard, goblinBridgeBoard, oozeBoard, rustmireBoard, squidBoard } from "./boards";
import { abyssalOoze, abyssalSquid, alligator, barnacleDrone, basaltWyrm, beastTamer, bee, brineDynamo, caveBat, clayGolem, coconutBailiff, dragonfly, enemies, fireAlligator, fireAnt, glowScorpion, gloomWisp, goblin, goblinArcher, goblinChief, goblinShaman, mummy, oozeGuardian, oreBeetle, reefAuditor, rustmireEngine, squidKnight, squidTentacle, skeleton, skeletonBrachiosaurus, skeletonGiraffe, skeletonHippo, skeletonKing, skeletonPrince, skeletonRhino, undertaker, vacationEmperor } from "./enemies";
import { level01, level02, level03, level04, level05, level06, level07, level08, level09, level10, level11, levels } from "./levels";
import { knight, miner, players, worm } from "./players";
import { ESCAPE_ROPE_SPRITES, FISH_SPRITES, GEAR_SPRITES, KEY_ITEM_SPRITES, MATERIAL_SPRITES, POTION_SPRITES, gearSprite } from "./inventory-sprites";
import { sprites } from "./sprites";
import { miningSpritesForRoom, miningVisualBand } from "./mining-sprites";
import { createRingGear, createShamanRingGear, createTridentGear } from "../game/gear";

describe("prototype content", () => {
  it("uses one fixed, fully dressed Blacksmith workshop layout", () => {
    const west = createBlacksmithRoomTiles("west");
    for (const direction of ["north", "east", "south"] as const) {
      expect(createBlacksmithRoomTiles(direction)).toEqual(west);
    }
    expect(west.tiles[west.blacksmithPosition.y][west.blacksmithPosition.x].kind).toBe("blacksmith");
    expect(west.tiles.flat().filter((tile) => tile.kind === "blacksmithForge")).toHaveLength(1);
    expect(west.tiles.flat().filter((tile) => tile.kind === "blacksmithAnvil")).toHaveLength(1);
    expect(west.tiles.flat().filter((tile) => tile.kind === "blacksmithWorkbench")).toHaveLength(1);
    expect(west.tiles.flat().filter((tile) => tile.kind === "blacksmithToolRack")).toHaveLength(2);
    expect(west.tiles.flat().filter((tile) => tile.kind === "blacksmithSupplies")).toHaveLength(2);
  });

  it("builds the 13x13 one-exit Hammer vault with two shared-id 2x2 Mummies", () => {
    const layout = createHammerVaultRoomTiles();
    expect(layout.tiles).toHaveLength(13);
    expect(layout.tiles.every((row) => row.length === 13)).toBe(true);
    expect(layout.tiles[12][6].kind).toBe("clayGate");
    expect(layout.mummyPositions).toHaveLength(2);
    for (const position of layout.mummyPositions) {
      const footprint = [
        layout.tiles[position.y][position.x],
        layout.tiles[position.y][position.x + 1],
        layout.tiles[position.y + 1][position.x],
        layout.tiles[position.y + 1][position.x + 1],
      ];
      expect(new Set(footprint.map((tile) => tile.enemyId)).size).toBe(1);
      expect(footprint.map((tile) => tile.enemyPart)).toEqual([0, 1, 2, 3]);
    }
  });
  it("builds a connected fixed Miner cave with rock and gem fixtures", () => {
    const layout = createMinerRoomTiles("south");
    expect(layout.tiles).toHaveLength(9);
    expect(layout.tiles[layout.minerPosition.y][layout.minerPosition.x].kind).toBe("miner");
    expect(layout.tiles.flat().filter((tile) => tile.kind === "caveRock")).toHaveLength(3);
    expect(layout.tiles.flat().filter((tile) => tile.kind === "caveGem")).toHaveLength(3);
  });
  it("dresses early fixed rooms without changing their traversable mechanics", () => {
    const rescue = createRescueRoomTiles("west");
    expect(rescue.tiles.flat().filter((tile) => tile.decoration === "cobweb")).toHaveLength(6);
    expect(rescue.spiderPositions).toHaveLength(7);

    const shopkeeper = createShopkeeperRoomTiles("west");
    expect(shopkeeper.tiles.flat().filter((tile) => tile.decoration === "shopShelf")).toHaveLength(2);
    expect(shopkeeper.tiles.flat().filter((tile) => tile.decoration === "shopRug")).toHaveLength(3);

    const spring = createRegenRoomTiles();
    expect(spring.flat().filter((tile) => tile.decoration === "springReeds")).toHaveLength(4);
    expect(spring.flat().filter((tile) => tile.kind === "regen")).toHaveLength(9);

    const portal = createPortalRoomTiles("waterPortal");
    expect(portal.flat().filter((tile) => tile.decoration === "portalRune")).toHaveLength(4);
    expect(portal.flat().filter((tile) => tile.kind === "waterPortal")).toHaveLength(9);

    const cartographer = createCartographerRoomTiles("west");
    expect(cartographer.flat().filter((tile) => tile.kind === "cartographer")).toHaveLength(1);
    expect(cartographer.flat().filter((tile) => tile.kind === "mapTable")).toHaveLength(1);
    expect(cartographer.flat().filter((tile) => tile.decoration === "cartographerScrolls")).toHaveLength(2);
    expect(cartographer.flat().filter((tile) => tile.decoration === "cartographerCompass")).toHaveLength(1);
    expect(cartographer.flat().filter((tile) => tile.decoration === "cartographerTripod")).toHaveLength(1);

    const angler = createAnglerRoomTiles("west");
    expect(angler.flat().filter((tile) => tile.kind === "angler")).toHaveLength(1);
    expect(angler.flat().filter((tile) => tile.kind === "anglerNet")).toHaveLength(1);
    expect(angler.flat().filter((tile) => tile.decoration === "anglerBaitBarrel")).toHaveLength(1);
    expect(angler.flat().filter((tile) => tile.decoration === "anglerFishRack")).toHaveLength(1);

    const crookedStill = createOddityBrewerRoomTiles("west");
    expect(crookedStill.flat().filter((tile) => tile.kind === "oddityBrewer")).toHaveLength(1);
    expect(crookedStill.flat().filter((tile) => tile.kind === "potionCauldron")).toHaveLength(1);
    expect(crookedStill.flat().filter((tile) => tile.kind === "potionShelf")).toHaveLength(2);
  });

  it("builds a lively fixed Potionmaster lab and a large decorated tower exterior", () => {
    const laboratory = createPotionmasterRoomTiles();
    expect(laboratory.tiles).toHaveLength(11);
    expect(laboratory.tiles.flat().filter((tile) => tile.kind === "potionmaster")).toHaveLength(1);
    expect(laboratory.tiles.flat().filter((tile) => tile.kind === "potionShelf")).toHaveLength(4);
    expect(laboratory.tiles.flat().filter((tile) => tile.kind === "potionCauldron")).toHaveLength(2);
    expect(laboratory.tiles.flat().filter((tile) => tile.decoration === "potionHerbs")).toHaveLength(2);
    expect(laboratory.tiles.flat().filter((tile) => tile.decoration === "potionBottleCrate")).toHaveLength(2);

    const tower = createTowerExteriorRoomTiles("south");
    expect(tower).toHaveLength(TOWER_EXTERIOR_SIZE);
    expect(tower.every((row) => row.length === TOWER_EXTERIOR_SIZE)).toBe(true);
    expect(tower.flat().filter((tile) => tile.kind === "towerDoor")).toHaveLength(TOWER_DOOR_WIDTH * TOWER_DOOR_HEIGHT);
    expect(tower.flat().filter((tile) => tile.kind === "gardenFountain")).toHaveLength(2);
    expect(tower.flat().filter((tile) => tile.kind === "gardenWater").length).toBeGreaterThan(30);
    expect(tower.flat().filter((tile) => tile.kind === "gardenFlowers")).toHaveLength(4);
    expect(tower.flat().filter((tile) => tile.decoration === "towerBanner")).toHaveLength(2);
    expect(tower.flat().filter((tile) => tile.decoration === "gardenLantern")).toHaveLength(4);
    expect(tower.flat().filter((tile) => tile.floorVariant === "tower-magma").length).toBeGreaterThan(40);
    expect(tower[TOWER_EXTERIOR_SIZE - 1].filter((tile) => tile.kind === "exit")).toHaveLength(1);
  });
  it("registers modular player, enemy, board, and battle definitions", () => {
    expect(Object.values(players)).toEqual([knight, worm, miner]);
    expect(miner.attackPattern).toBe("eight-way");
    expect(Object.values(enemies)).toContain(undertaker);
    expect(Object.values(enemies)).toContain(skeletonKing);
    expect(Object.values(enemies)).toContain(goblinArcher);
    expect(Object.values(enemies)).toContain(abyssalSquid);
    expect(Object.values(enemies)).toContain(abyssalOoze);
    expect(Object.values(enemies)).toEqual(expect.arrayContaining([
      caveBat, glowScorpion, oreBeetle, gloomWisp, basaltWyrm,
    ]));
    expect(fireAlligator.stats.spAttack.eq(76)).toBe(true);
    expect(undertaker.stats.speed.lt(skeleton.stats.speed)).toBe(true);
    expect(skeleton.stats.speed.lt(goblin.stats.speed)).toBe(true);
    expect(goblin.stats.speed.lt(squidKnight.stats.speed)).toBe(true);
    expect(squidKnight.stats.speed.lt(oozeGuardian.stats.speed)).toBe(true);
    expect(oozeGuardian.stats.speed.lte(abyssalOoze.stats.speed)).toBe(true);
    expect(sprites).toEqual(expect.objectContaining({
      caveBat: expect.any(String),
      glowScorpion: expect.any(String),
      oreBeetle: expect.any(String),
      gloomWisp: expect.any(String),
      basaltWyrm: expect.any(String),
      abyssalOoze: expect.any(String),
      oozeGuardian: expect.any(String),
      rustmireEngine: expect.any(String),
      brineDynamo: expect.any(String),
      barnacleDrone: expect.any(String),
      coconutBailiff: expect.any(String),
      reefAuditor: expect.any(String),
      vacationEmperor: expect.any(String),
    }));
    expect(Object.values(boards)).toEqual([graveyardBoard, goblinBridgeBoard, goblinArcherBoard, squidBoard, beastTamerBoard, oozeBoard, rustmireBoard, archipelagoBoard]);
    expect(levels).toEqual([level01, level02, level03, level04, level05, level06, level07, level08, level09, level10, level11]);
  });

  it("composes battle 1 as the 10x7 Undertaker graveyard", () => {
    expect(level01.board).toBe(graveyardBoard);
    expect(level01.board.width).toBe(10);
    expect(level01.board.height).toBe(7);
    expect(level01.enemies).toHaveLength(1);
    expect(level01.enemies[0].unit).toBe(undertaker);
    expect(level01.enemies[0].unit.isRaidBoss).toBe(true);
    expect(renderLevel(level01, { undertaker: "U" })).toEqual([
      "----------",
      "-W-W-W----",
      "----------",
      "-------U--",
      "----------",
      "-W-W-W----",
      "----------",
    ]);
    expect(level01.board.decorations ?? []).toEqual([
      { position: { x: 8, y: 3 }, kind: "graveRoyalBanner" },
    ]);
    const walls = new Set(level01.board.walls.map(({ x, y }) => `${x},${y}`));
    for (const spawn of graveyardRandomSpawnPositions) {
      const gravestoneY = spawn.y === 2 ? 1 : 5;
      expect(walls.has(`${spawn.x},${gravestoneY}`)).toBe(true);
    }
    for (const { x, y } of level01.board.walls) {
      expect(walls.has(`${x},${level01.board.height - 1 - y}`)).toBe(true);
    }
  });

  it("builds the escalating graveyard battles through the Skele-King", () => {
    expect(level02.enemies.map((spawn) => spawn.unit)).toEqual([skeletonGiraffe, skeletonHippo, skeleton]);
    expect(level03.enemies.map((spawn) => spawn.unit)).toEqual([skeletonGiraffe, skeletonHippo, skeletonRhino, skeletonPrince]);
    expect(level04.enemies.map((spawn) => spawn.unit)).toEqual([
      skeletonGiraffe,
      skeletonHippo,
      skeletonRhino,
      skeletonBrachiosaurus,
      skeletonKing,
    ]);
  });

  it("composes the Goblin Chief and ranged Goblin Shaman scaffold battles", () => {
    expect(level05.board).toBe(goblinBridgeBoard);
    expect(level05.board.height).toBe(11);
    expect(level05.board.floorTheme).toBe("leaves");
    expect(level05.board.wallTheme).toBe("tree-stump");
    expect(level05.enemies.filter((spawn) => spawn.unit === goblinChief)).toHaveLength(1);
    expect(level06.board).toBe(goblinArcherBoard);
    expect(level06.board.height).toBe(11);
    expect(level06.board.floorTheme).toBe("leaves");
    expect(level06.board.wallTheme).toBe("tree-stump");
    expect(level06.board.deploymentExclusions).toEqual(expect.arrayContaining([
      { x: 5, y: 0 }, { x: 5, y: 10 },
    ]));
    expect(level06.enemies.filter((spawn) => spawn.unit === goblinArcher)).toHaveLength(4);
    expect(level06.enemies.filter((spawn) => spawn.unit === goblinShaman)).toHaveLength(1);
    expect(goblinShaman.stats.hp.gte(goblinChief.stats.hp)).toBe(true);
    expect(goblinShaman.attackType).toBe("special");
    expect(goblinShaman.attackRange).toBe(3);
    expect(goblinShaman.attackPattern).toBe("any");
    expect(goblinShaman.teleportRangeFraction).toBe(0.5);
    expect(goblin.stats.hp.gt(skeletonBrachiosaurus.stats.hp)).toBe(true);
    expect(goblin.stats.attack.gt(skeletonBrachiosaurus.stats.attack)).toBe(true);
    expect(goblin.stats.defense.gt(skeletonBrachiosaurus.stats.defense)).toBe(true);
    expect(goblin.stats.speed.gt(skeletonBrachiosaurus.stats.speed)).toBe(true);
    expect(goblinArcher.stats.attack.gt(goblin.stats.attack)).toBe(true);
    expect(renderLevel(level05, { goblin: "e", "goblin-chief": "c" })).toEqual([
      "-------------------",
      "-------------------",
      "--gg------gg--e-e--",
      "--gg------gg-------",
      "------gg------ww---",
      "------gg---e--ww-c-",
      "------gg------ww---",
      "--gg------gg-------",
      "--gg------gg--e-e--",
      "-------------------",
      "-------------------",
    ]);
    expect(renderLevel(level06, { goblin: "e", "goblin-shaman": "s", "goblin-archer": "a" })).toEqual([
      "--gg-a--a-gg--e-e--",
      "--gggggggggg-------",
      "----w-----w--------",
      "-------w-----------",
      "---w----------ww---",
      "------w--ew---ww-s-",
      "--------------ww---",
      "----w---w----------",
      "------------w------",
      "--gggggggggg-------",
      "--gg-a--a-gg--e-e--",
    ]);
  });

  it("composes Battle 7 as the stronger leafy Beast Tamer arena", () => {
    expect(level07.board).toBe(beastTamerBoard);
    expect(level07.board.width).toBe(13);
    expect(level07.board.height).toBe(9);
    expect(level07.enemies[0].unit).toBe(beastTamer);
    expect(beastTamer.attackRange).toBe(2);
    expect(beastTamer.stats.speed.eq(34)).toBe(true);
    expect(beastTamer.summonPool).toEqual(["fire-ant", "alligator", "dragonfly", "bee"]);
    expect(beastTamer.invulnerableWhileSummons).toBe(true);
    expect(Object.values(enemies)).toEqual(expect.arrayContaining([
      beastTamer,
      fireAnt,
      alligator,
      dragonfly,
      bee,
    ]));
    expect(renderLevel(level07, { "beast-tamer": "b" })).toEqual([
      "-------------",
      "-----www-----",
      "-------------",
      "----ggggg----",
      "----ggggg--b-",
      "----ggggg----",
      "-------------",
      "-----www-----",
      "-------------",
    ]);
    expect(level07.board.floorTheme).toBe("leaves");
    expect(level07.board.wallTheme).toBe("tree-stump");
    expect(alligator.attackArea).toBe("front-three");
    expect(alligator.footprintWidth).toBe(2);
    expect(alligator.footprintHeight).toBe(1);
    expect(fireAnt.attackRange).toBe(99);
    expect(fireAnt.stats.spAttack.gt(19)).toBe(true);
    expect(alligator.stats.attack.gt(22)).toBe(true);
    expect(dragonfly.attackRange).toBe(2);
    expect(dragonfly.attackPattern).toBe("eight-way");
    expect(bee.attackRange).toBe(2);
    expect(bee.attackPattern).toBe("orthogonal");
    expect(bee.paralysisChance).toBe(0.5);
  });

  it("composes Battle 8 as the exact 20x13 Tentacle-shielded Squid arena", () => {
    expect(level08.board).toBe(squidBoard);
    expect(level08.board.width).toBe(20);
    expect(level08.board.height).toBe(13);
    expect(level08.enemies.filter((spawn) => spawn.unit === squidKnight)).toHaveLength(4);
    expect(level08.enemies.filter((spawn) => spawn.unit === squidTentacle)).toHaveLength(4);
    expect(level08.enemies.filter((spawn) => spawn.unit === abyssalSquid)).toHaveLength(1);
    expect(abyssalSquid.footprint).toBe(3);
    expect(abyssalSquid.canMove).toBe(false);
    expect(abyssalSquid.attackPattern).toBe("any");
    expect(squidTentacle.requiresTridentThrow).not.toBe(true);
    expect(squidTentacle.stats.hp.toNumber()).toBe(300);
    expect(squidKnight.stats.hp.toNumber()).toBe(220);
    expect(squidKnight.stats.attack.toNumber()).toBe(32);
    expect(squidKnight.stats.defense.toNumber()).toBe(22);
    expect(squidKnight.stats.spDefense.toNumber()).toBe(20);
    expect(abyssalSquid.invulnerableWhileEnemyId).toBe("squid-tentacle");
    expect(renderLevel(level08, {
      "squid-knight": "K",
      "squid-tentacle": "T",
      "abyssal-squid": "S",
    })).toEqual([
      "ggggggg--ggggggggg--",
      "ggggggg-K-g-----g-K-",
      "gggggggg-----------g",
      "ggggggggg---ggg---gg",
      "-----ggg---ggTgg---g",
      "----------ggggggg--g",
      "----------gTgSgTg--g",
      "----------ggggggg--g",
      "-----ggg---ggTgg---g",
      "ggggggggg---ggg---gg",
      "gggggggg-----------g",
      "ggggggg-K-g-----g-K-",
      "ggggggg--ggggggggg--",
    ]);
  });

  it("composes Battle 9 as a 21x13 Ooze arena with three weakening guardians", () => {
    expect(level09.board).toBe(oozeBoard);
    expect(level09.board.width).toBe(21);
    expect(level09.board.height).toBe(13);
    expect(level09.enemies.filter((spawn) => spawn.unit === squidKnight)).toHaveLength(6);
    expect(level09.enemies.filter((spawn) => spawn.unit === oozeGuardian)).toHaveLength(3);
    expect(level09.enemies.filter((spawn) => spawn.unit === abyssalOoze)).toHaveLength(1);
    expect(oozeGuardian.footprint).toBe(2);
    const squidKnightPositions = level09.enemies
      .filter((spawn) => spawn.unit === squidKnight)
      .map((spawn) => spawn.position);
    expect(squidKnightPositions.every((position) =>
      squidKnightPositions.some((mirror) => mirror.x === position.x && mirror.y === 12 - position.y)
    )).toBe(true);
    expect(oozeGuardian.stats.hp.gt(mummy.stats.hp)).toBe(true);
    expect(abyssalOoze.footprint).toBe(3);
    expect(abyssalOoze.canMove).toBe(true);
    expect(abyssalOoze.weakeningGuardDefinitionId).toBe("ooze-guardian");
    expect(abyssalOoze.weakeningGuardCount).toBe(3);
    expect(oozeBoard.blueGaps).toBeUndefined();
    expect(oozeBoard.deploymentTiles?.length).toBeGreaterThan(20);
    expect(squidBoard.deploymentTiles).toHaveLength(34);
    expect(squidBoard.deploymentTiles?.every(({ x, y }) =>
      (x <= 4 && y >= 4 && y <= 8) || (x >= 5 && x <= 7 && y >= 5 && y <= 7)
    )).toBe(true);
  });

  it("composes Battle 10 as a shielded, mobile Rusttide Colossus foundry", () => {
    expect(level10.board).toBe(rustmireBoard);
    expect(rustmireBoard.width).toBe(27);
    expect(rustmireBoard.height).toBe(15);
    expect(rustmireBoard.floorTheme).toBe("abyssal-metal");
    expect(rustmireBoard.wallTheme).toBe("pressure-vat");
    expect(rustmireBoard.walls).toHaveLength(80);
    expect(rustmireBoard.deploymentTiles).toHaveLength(28);

    expect(level10.enemies.filter((spawn) => spawn.unit === barnacleDrone)).toHaveLength(6);
    expect(level10.enemies.filter((spawn) => spawn.unit === brineDynamo)).toHaveLength(1);
    expect(level10.enemies.filter((spawn) => spawn.unit === rustmireEngine)).toHaveLength(1);
    const drones = level10.enemies
      .filter((spawn) => spawn.unit === barnacleDrone)
      .map((spawn) => spawn.position);
    expect(drones.every((position) =>
      drones.some((mirror) => mirror.x === position.x && mirror.y === 14 - position.y)
    )).toBe(true);

    expect(rustmireEngine.footprint).toBe(3);
    expect(rustmireEngine.canMove).toBe(true);
    expect(rustmireEngine.invulnerableWhileEnemyId).toBe("brine-dynamo");
    expect(rustmireEngine.oozeBelch).toMatchObject({
      cooldownTurns: 4,
      minTiles: 2,
      maxTiles: 3,
      corrosionTurns: 3,
    });
    expect(rustmireEngine.stats.speed.gt(abyssalOoze.stats.speed)).toBe(true);
    expect(rustmireEngine.stats.spAttack.lt(abyssalOoze.stats.spAttack)).toBe(true);
    expect(rustmireEngine.name).toBe("Rusttide Colossus");
    expect(rustmireEngine.stats.hp.eq(8_400)).toBe(true);
    expect(barnacleDrone.footprint).toBe(2);
    expect(brineDynamo.footprint).toBe(2);
    expect(brineDynamo.canMove).toBe(false);
    expect(brineDynamo.hideFromBestiary).toBe(true);
  });

  it("makes Battle 11 a geographically blocked archipelago and the largest arena", () => {
    expect(level11.board).toBe(archipelagoBoard);
    expect(archipelagoBoard.width).toBe(39);
    expect(archipelagoBoard.height).toBe(23);
    expect(archipelagoBoard.width * archipelagoBoard.height)
      .toBeGreaterThan(rustmireBoard.width * rustmireBoard.height);
    expect(archipelagoBoard.floorTheme).toBe("sand");
    expect(archipelagoBoard.gapTheme).toBe("ocean");
    expect(archipelagoBoard.gaps?.length).toBeGreaterThan(500);

    const blocked = new Set((archipelagoBoard.gaps ?? []).map(({ x, y }) => `${x},${y}`));
    const reachable = new Set<string>();
    const queue = [...(archipelagoBoard.deploymentTiles ?? [])];
    while (queue.length > 0) {
      const position = queue.shift()!;
      const positionKey = `${position.x},${position.y}`;
      if (reachable.has(positionKey) || blocked.has(positionKey)) continue;
      reachable.add(positionKey);
      for (const neighbor of [
        { x: position.x + 1, y: position.y },
        { x: position.x - 1, y: position.y },
        { x: position.x, y: position.y + 1 },
        { x: position.x, y: position.y - 1 },
      ]) {
        if (
          neighbor.x >= 0 && neighbor.x < archipelagoBoard.width
          && neighbor.y >= 0 && neighbor.y < archipelagoBoard.height
        ) queue.push(neighbor);
      }
    }

    for (const spawn of level11.enemies) {
      expect(blocked.has(`${spawn.position.x},${spawn.position.y}`)).toBe(false);
      expect(reachable.has(`${spawn.position.x},${spawn.position.y}`)).toBe(false);
    }
    expect(level11.enemies.filter((spawn) => spawn.unit === coconutBailiff)).toHaveLength(3);
    expect(level11.enemies.filter((spawn) => spawn.unit === reefAuditor)).toHaveLength(4);
    expect(level11.enemies.filter((spawn) => spawn.unit === vacationEmperor)).toHaveLength(1);
    expect(vacationEmperor.stats.hp.eq(1_000_000)).toBe(true);
    expect(vacationEmperor.stats.hp.gt(rustmireEngine.stats.hp.mul(100))).toBe(true);
  });

  it("defines the Clay Golem as a slow eight-direction special attacker", () => {
    expect(clayGolem.attackPattern).toBe("eight-way");
    expect(clayGolem.attackType).toBe("special");
    expect(clayGolem.attackRange).toBeGreaterThan(9);
    expect(clayGolem.stats.speed.lt(knight.stats.speed)).toBe(true);
  });

  it("leaves battle board perimeters open and gives every board three neutral middle columns", () => {
    for (const board of Object.values(boards)) {
      const walls = new Set(board.walls.map(({ x, y }) => `${x},${y}`));
      expect(walls.has("0,0")).toBe(false);
      expect(walls.has(`${board.width - 1},${board.height - 1}`)).toBe(false);
      const neutralStart = Math.floor((board.width - 3) / 2);
      expect(board.terrain.every((row) => row.slice(neutralStart, neutralStart + 3).every((tile) => tile === "neutral"))).toBe(true);
    }
  });

  it("keeps battle scenery visual-only, in bounds, and off blocked tiles", () => {
    for (const board of Object.values(boards)) {
      const blocked = new Set([
        ...board.walls.map(({ x, y }) => `${x},${y}`),
        ...(board.gaps ?? []).map(({ x, y }) => `${x},${y}`),
      ]);
      const positions = (board.decorations ?? []).map(({ position }) => `${position.x},${position.y}`);
      expect(new Set(positions).size).toBe(positions.length);
      for (const decoration of board.decorations ?? []) {
        expect(decoration.position.x).toBeGreaterThanOrEqual(0);
        expect(decoration.position.x).toBeLessThan(board.width);
        expect(decoration.position.y).toBeGreaterThanOrEqual(0);
        expect(decoration.position.y).toBeLessThan(board.height);
        expect(blocked.has(`${decoration.position.x},${decoration.position.y}`)).toBe(false);
        expect(sprites[decoration.kind]).toEqual(expect.any(String));
      }
    }
  });

  it("assigns distinct SVG sprites to every current inventory item type", () => {
    const inventorySprites = [
      ...Object.values(GEAR_SPRITES),
      ...Object.values(MATERIAL_SPRITES),
      ...Object.values(FISH_SPRITES),
      ...Object.values(KEY_ITEM_SPRITES),
      ...Object.values(POTION_SPRITES),
      ...Object.values(ESCAPE_ROPE_SPRITES),
      ...([2, 3, 4] as const).flatMap((level) =>
        (["helmet", "chestplate", "leggings", "boots", "sword"] as const)
          .map((slot) => gearSprite(createRingGear(slot, level, `sprite-test-${level}-${slot}`)))
      ),
      gearSprite(createTridentGear()),
      gearSprite(createShamanRingGear()),
    ];
    expect(inventorySprites).toHaveLength(77);
    expect(new Set(inventorySprites).size).toBe(inventorySprites.length);
    expect(gearSprite(createRingGear("helmet", 1, "level-one")))
      .not.toBe(gearSprite(createRingGear("helmet", 2, "level-two")));
  });

  it("registers a dedicated wooden battle floor alongside the shared wall sprite", () => {
    expect(sprites.raidFloorPlanks).toMatch(/^(?:data:image\/svg\+xml|.*raid-floor-planks)/);
    expect(sprites.raidFloorPlanks).not.toBe(sprites.wall);
    expect(sprites.raidWaterMurky).not.toBe(sprites.raidWaterBlue);
    expect(sprites.raidWaterOcean).not.toBe(sprites.raidWaterBlue);
    expect(sprites.raidFloorSand).not.toBe(sprites.raidFloorPlanks);
    expect(sprites.raidWaterMurky).not.toBe(sprites.raidGap);
    expect(sprites.lotteryWheelDisc).not.toBe(sprites.lotteryWheelFrame);
    expect(sprites.lotteryWheel).not.toBe(sprites.lotteryWheelDisc);
  });

  it("advances natural mine geology in the same two-room bands as mining enemies", () => {
    const roomNumbers = Array.from({ length: 10 }, (_, index) => index + 1);
    expect(roomNumbers.map(miningVisualBand)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);

    const roomSprites = roomNumbers.map(miningSpritesForRoom);
    for (const oddRoom of [1, 3, 5, 7, 9]) {
      expect(roomSprites[oddRoom - 1]).toEqual(roomSprites[oddRoom]);
    }

    expect(new Set(roomSprites.map(({ floor }) => floor)).size).toBe(5);
    expect(new Set(roomSprites.map(({ wall }) => wall)).size).toBe(5);
    expect(new Set(roomSprites.map(({ rock }) => rock)).size).toBe(5);
  });
});

function renderLevel(
  level: (typeof levels)[number],
  enemyLetters: Record<string, string>,
): string[] {
  const rows = Array.from({ length: level.board.height }, () =>
    Array.from({ length: level.board.width }, () => "-")
  );
  for (const gap of level.board.gaps ?? []) rows[gap.y][gap.x] = "g";
  for (const wall of level.board.walls) rows[wall.y][wall.x] = level.number <= 4 ? "W" : "w";
  for (const spawn of level.enemies) rows[spawn.position.y][spawn.position.x] = enemyLetters[spawn.unit.id] ?? "?";
  return rows.map((row) => row.join(""));
}

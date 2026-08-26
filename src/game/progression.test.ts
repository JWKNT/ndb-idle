import Decimal from "break_eternity.js";
import { describe, expect, it, vi } from "vitest";
import { createRingGear, createShamanRingGear, createSuctionCupsGear } from "./gear";
import { FISH_META, MATERIAL_META, bulkSellAmounts } from "./items";
import { POTION_COST, POTION_DURATION_MS, POTION_LEVEL_2_COST } from "./potions";
import { EMPTY_TRAINING } from "./types";
import {
  activateQuest,
  advanceTimedEffects,
  advanceProgression,
  adventureSpeedMultiplier,
  availableAdventureTargetRings,
  availableAdventureStrategies,
  addGear,
  addMaterial,
  addPotion,
  beginHammerQuestAttempt,
  completeAdventureRun,
  completeQuest,
  completePotionmasterQuest,
  completeOddityBrewerExchange,
  completeAnglerRequest,
  completeCartographerQuest,
  completeTridentTrial,
  discoverAdventureSpecialRoom,
  discoverBlacksmith,
  discoverTowerDoor,
  consumeEscapeRope,
  consumePotion,
  consumeMapmakerChalk,
  defaultProgression,
  deleteSaveSlot,
  equipGear,
  effectiveAdventureStrategy,
  failHammerQuestAttempt,
  gearSellPrice,
  getPartyMember,
  healParty,
  hasPartyMember,
  inventorySlotCapacity,
  inventorySlotUpgradeCost,
  inventoryStackCapacity,
  inventoryStackUpgradeCost,
  inventoryUsedSlots,
  memberMaxStamina,
  memberEquipment,
  fishBonusCap,
  memberStats,
  mysteryPotionDodgeChance,
  loadProgression,
  nextRaidNumber,
  offerFishAtWaterShrine,
  purchaseQuest,
  purchasePotion,
  purchaseEscapeRope,
  purchaseUndeadGem,
  purchaseBlacksmithHealingPotion,
  purchaseCraftingTable,
  purchasePickaxe,
  purchaseHammerQuest,
  purchaseInventorySlots,
  purchaseInventoryStackSize,
  recordAdventureDeath,
  recordAdventureRingVisit,
  recordEnemyDefeats,
  recordMiningRoomReached,
  recordVictory,
  recoverBlacksmithHammer,
  recoverForgeBlueprints,
  returnBlacksmithHammer,
  deliverForgeBlueprints,
  deliverAnglerMaterials,
  availableShopUnlockKeys,
  hasNewShopContent,
  markShopUnlocksSeen,
  recordForgeDungeonVisit,
  recordWaterDungeonVisit,
  saveProgression,
  saveSlotSummaries,
  setMemberHp,
  setMemberStamina,
  setMiningAutoMode,
  setMiningMember,
  setRestartMiningOnFullHp,
  setAdventureMemberSelected,
  setAdventureIgnoreGold,
  setAdventureAutoPauseRoom,
  setAdventureStrategy,
  setAdventureTargetRing,
  setFavoredFishStat,
  setAutoEnterPortalType,
  setRestartAdventureOnFullHp,
  startTraining,
  startFishing,
  sellGear,
  sellFish,
  sellMaterial,
  settleAdventureGold,
  feedFish,
  trainingCost,
  UNDEAD_GEM_COST,
  unequipGear,
  unlockGreatTower,
  unlockShopkeeper,
  useBlacksmithHealingPotion,
  type ProgressionState,
} from "./progression";

describe("progression", () => {
  it("starts with 24 backpack slots and 100 items per stack while key items use reserved storage", () => {
    const state = {
      ...defaultProgression(),
      adventureUnlocked: true,
      fishingRod: true,
      hammerRecovered: true,
      pickaxeOwned: true,
      towerKeyOwned: true,
    };
    expect(inventorySlotCapacity(state)).toBe(24);
    expect(inventoryStackCapacity(state)).toBe(100);
    expect(inventoryUsedSlots(state)).toBe(0);
  });

  it("caps ordinary stacks and expands every item stack with one global purchase", () => {
    let state = {
      ...defaultProgression(),
      gold: new Decimal(100_000),
      materials: { ...defaultProgression().materials, "rat-pelt": 100, "ant-chitin": 100 },
    };
    state = addMaterial(state, "rat-pelt");
    state = addMaterial(state, "ant-chitin");
    expect(state.materials["rat-pelt"]).toBe(100);
    expect(state.materials["ant-chitin"]).toBe(100);

    state = purchaseInventoryStackSize(state).state;
    expect(inventoryStackCapacity(state)).toBe(200);
    state = addMaterial(state, "rat-pelt");
    state = addMaterial(state, "ant-chitin");
    expect(state.materials["rat-pelt"]).toBe(101);
    expect(state.materials["ant-chitin"]).toBe(101);
  });

  it("migrates per-item stack upgrades to the highest global stack tier", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-1";
      saveProgression(defaultProgression(), 1);
      const stored = JSON.parse(values.get(key)!);
      stored.inventoryStackUpgrades = {
        "material:rat-pelt": 1,
        "material:ant-chitin": 3,
      };
      values.set(key, JSON.stringify(stored));

      const loaded = loadProgression(1);
      expect(loaded.inventoryStackUpgrades).toBe(3);
      expect(inventoryStackCapacity(loaded)).toBe(400);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("discards ordinary loot when all unique slots are occupied while equipped gear frees a backpack slot", () => {
    const inventory = Array.from({ length: 24 }, (_, index) =>
      createRingGear("helmet", 1, `capacity-test-${index}`)
    );
    let state = { ...defaultProgression(), inventory };
    expect(inventoryUsedSlots(state)).toBe(24);
    state = addMaterial(state, "rat-pelt");
    expect(state.materials["rat-pelt"]).toBe(0);

    state = equipGear(state, "knight", inventory[0]!.id).state;
    expect(inventoryUsedSlots(state)).toBe(23);
    state = addMaterial(state, "rat-pelt");
    expect(state.materials["rat-pelt"]).toBe(1);
    expect(inventoryUsedSlots(state)).toBe(24);
    expect(unequipGear(state, "knight", "helmet").error).toMatch(/inventory is full/i);
  });

  it("always grants one-time progression rewards even when the backpack is full", () => {
    const inventory = Array.from({ length: 24 }, (_, index) =>
      createRingGear("helmet", 1, `milestone-capacity-${index}`)
    );
    const full = { ...defaultProgression(), inventory };

    const tridentTrial = completeTridentTrial(full);
    expect(tridentTrial.inventory.some((item) => item.definitionId === "trident")).toBe(true);
    expect(inventorySlotCapacity(tridentTrial)).toBeGreaterThanOrEqual(inventoryUsedSlots(tridentTrial));

    const battleTen = recordVictory(full, 10);
    expect(battleTen.rewardDiscarded).toBe(false);
    expect(battleTen.state.materials["rusty-gear"]).toBe(1);
    expect(inventorySlotCapacity(battleTen.state)).toBeGreaterThanOrEqual(inventoryUsedSlots(battleTen.state));

    const chalk = completeCartographerQuest(full);
    expect(chalk.materials["mapmaker-chalk"]).toBe(1);
    expect(inventorySlotCapacity(chalk)).toBeGreaterThanOrEqual(inventoryUsedSlots(chalk));
  });

  it("does not sell non-repeatable milestone gear", () => {
    const withTrident = completeTridentTrial(defaultProgression());
    const trident = withTrident.inventory.find((item) => item.definitionId === "trident")!;
    const sold = sellGear(withTrident, trident.id);
    expect(sold.error).toMatch(/milestone gear cannot be sold/i);
    expect(sold.state.inventory).toContainEqual(trident);
  });

  it("removes only one item from a legacy inventory with duplicate gear ids", () => {
    const duplicate = createRingGear("boots", 1, "legacy-duplicate");
    const state = { ...defaultProgression(), inventory: [duplicate, { ...duplicate }] };
    const sold = sellGear(state, duplicate.id);
    expect(sold.error).toBeUndefined();
    expect(sold.state.inventory).toEqual([duplicate]);
    expect(sold.state.gold.eq(state.gold.add(gearSellPrice(duplicate)))).toBe(true);
  });

  it("prices backpack slots gently and individual stacks aggressively", () => {
    expect(inventorySlotUpgradeCost(0).toNumber()).toBe(1_000);
    expect(inventorySlotUpgradeCost(9).toNumber()).toBeGreaterThanOrEqual(10_000);
    expect(inventorySlotUpgradeCost(9).toNumber()).toBeLessThanOrEqual(20_000);
    expect(inventoryStackUpgradeCost(0).toNumber()).toBe(5_000);
    expect(inventoryStackUpgradeCost(4).gt(inventorySlotUpgradeCost(9))).toBe(true);

    let state = { ...defaultProgression(), gold: new Decimal(20_000) };
    state = purchaseInventorySlots(state).state;
    expect(inventorySlotCapacity(state)).toBe(26);
  });

  it("stores the Mining member, auto, restart, and deepest-room preferences", () => {
    let state: ProgressionState = {
      ...defaultProgression(),
      party: {
        ...defaultProgression().party,
        miner: {
          ...defaultProgression().party.knight!,
          training: { ...defaultProgression().party.knight!.training },
          fishBonuses: { ...defaultProgression().party.knight!.fishBonuses },
        },
      },
    };
    state = setMiningMember(state, "miner");
    state = setMiningAutoMode(state, false);
    state = setRestartMiningOnFullHp(state, true);
    state = recordMiningRoomReached(state, 6);
    state = recordMiningRoomReached(state, 3);
    expect(state.selectedMiningMemberId).toBe("miner");
    expect(state.miningAutoMode).toBe(false);
    expect(state.restartMiningOnFullHp).toBe(true);
    expect(state.highestMiningRoomReached).toBe(6);
    state = recordMiningRoomReached(state, 12);
    expect(state.highestMiningRoomReached).toBe(10);
  });

  it("uses the Battle 8 Rotten Tentacle indefinitely for 2% Driftwood and 1% Seaweed rolls", () => {
    let state = {
      ...defaultProgression(),
      fishingRod: true,
      materials: { ...defaultProgression().materials, "rotten-tentacle": 1 },
    };
    state = startFishing(state, "knight", "rotten-tentacle", "auto").state;
    expect(state.materials["rotten-tentacle"]).toBe(1);
    const driftwood = advanceProgression(state, 3, () => 0);
    expect(driftwood.materialCompleted).toBe("driftwood");
    expect(driftwood.state.fishingLog[0]).toBe("Fished up Driftwood.");
    expect(driftwood.state.fishingAssignment).not.toBeNull();
    const seaweed = advanceProgression(driftwood.state, 3, () => 0.025);
    expect(seaweed.materialCompleted).toBe("seaweed");
    expect(seaweed.state.materials["rotten-tentacle"]).toBe(1);
    expect(seaweed.state.fishingAssignment).not.toBeNull();
  });

  it("runs the Blacksmith's one-time Hammer quest, healing stock, and Pickaxe quest unlock", () => {
    let state = discoverBlacksmith({
      ...defaultProgression(),
      gold: new Decimal(2_000),
      materials: { ...defaultProgression().materials, clay: 90, driftwood: 20 },
    });
    expect(state.shopUnlocked).toBe(true);
    state = purchaseHammerQuest(state).state;
    expect(state.hammerQuestPurchased).toBe(true);
    expect(state.materials.clay).toBe(70);
    expect(purchaseHammerQuest(state).error).toMatch(/already owned/i);
    state = beginHammerQuestAttempt(state);
    expect(state.hammerQuestAttemptActive).toBe(true);
    expect(state.hammerQuestFailed).toBe(false);
    state = failHammerQuestAttempt(state);
    expect(state.hammerQuestAttemptActive).toBe(false);
    expect(state.hammerQuestFailed).toBe(true);
    state = beginHammerQuestAttempt(state);
    expect(state.hammerQuestAttemptActive).toBe(true);
    expect(state.hammerQuestFailed).toBe(false);
    state = purchaseBlacksmithHealingPotion(state).state;
    expect(state.healingPotions).toBe(1);
    state = setMemberHp(state, "knight", new Decimal(1));
    state = useBlacksmithHealingPotion(state, "knight").state;
    expect(getPartyMember(state, "knight").hp.eq(memberStats(state, "knight").hp)).toBe(true);
    state = returnBlacksmithHammer(recoverBlacksmithHammer(state));
    expect(state.hammerQuestAttemptActive).toBe(false);
    expect(state.hammerQuestFailed).toBe(false);
    state = { ...state, materials: { ...state.materials, clay: 20, driftwood: 20 } };
    state = purchasePickaxe(state).state;
    expect(state.pickaxeOwned).toBe(true);
    expect(state.purchasedQuestIds).toContain("find-miner");
    expect(state.activeQuestId).toBe("find-miner");
    expect(state.gold.eq(0)).toBe(true);
    expect(state.materials.clay).toBe(0);
    expect(state.materials.driftwood).toBe(0);
    state = completeQuest(state, "find-miner");
    expect(state.miningUnlocked).toBe(true);
    expect(state.party.miner).toBeDefined();
    expect(state.equipment.miner).toBeDefined();
  });

  it("unlocks the Forge quest at the Tower and finishes the blueprint handoff at the Blacksmith", () => {
    let state = {
      ...clearedThrough(9),
      gold: new Decimal(100_000),
      shopUnlocked: true,
    };
    expect(availableShopUnlockKeys(state, "quests")).not.toContain("quest:enter-tower");
    state = discoverTowerDoor(state);
    expect(availableShopUnlockKeys(state, "quests")).not.toContain("quest:enter-tower");
    state = completeAdventureRun(state);
    expect(availableShopUnlockKeys(state, "quests")).toContain("quest:enter-tower");
    expect(hasNewShopContent(state, "quests")).toBe(true);
    state = markShopUnlocksSeen(state, "quests");
    expect(hasNewShopContent(state, "quests")).toBe(false);
    state = purchaseQuest(state, "enter-tower").state;
    expect(state.activeQuestId).toBe("enter-tower");
    state = recoverForgeBlueprints(state);
    expect(state.forgeBlueprintsRecovered).toBe(true);
    expect(state.activeQuestId).toBeNull();
    state = deliverForgeBlueprints(state);
    expect(state.forgeBlueprintsRecovered).toBe(false);
    expect(state.forgeBlueprintsDelivered).toBe(true);
    expect(state.completedQuestIds).toContain("enter-tower");
  });

  it("opens the Great Tower only after the Tower Key has been crafted", () => {
    const locked = unlockGreatTower(defaultProgression());
    expect(locked.greatTowerUnlocked).toBe(false);

    const opened = unlockGreatTower({
      ...defaultProgression(),
      towerKeyOwned: true,
      adventureAutoMode: true,
      restartAdventureOnFullHp: true,
    });
    expect(opened.greatTowerUnlocked).toBe(true);
    expect(opened.adventureAutoMode).toBe(false);
    expect(opened.restartAdventureOnFullHp).toBe(false);
  });

  it("purchases the Crafting Table for the Blacksmith's exact blueprint costs", () => {
    const state = {
      ...defaultProgression(),
      forgeBlueprintsDelivered: true,
      gold: new Decimal(200_000),
      materials: {
        ...defaultProgression().materials,
        "rusty-metal": 20,
        clay: 100,
        seaweed: 10,
      },
    };
    const result = purchaseCraftingTable(state);
    expect(result.error).toBeUndefined();
    expect(result.state.craftingUnlocked).toBe(true);
    expect(result.state.gold.eq(0)).toBe(true);
    expect(result.state.materials["rusty-metal"]).toBe(0);
    expect(result.state.materials.clay).toBe(0);
    expect(result.state.materials.seaweed).toBe(0);
  });
  it("unlocks tiered Escape Ropes one room behind the farthest distance reached", () => {
    let state = { ...defaultProgression(), gold: new Decimal(2_000) };
    expect(purchaseEscapeRope(state, 1).error).toMatch(/2 rooms from the entrance/i);

    state = recordAdventureRingVisit(state, 2);
    state = purchaseEscapeRope(state, 1).state;
    expect(state.gold.eq(1_750)).toBe(true);
    expect(state.escapeRopes[1]).toBe(1);
    expect(purchaseEscapeRope(state, 2).error).toMatch(/3 rooms from the entrance/i);

    state = recordAdventureRingVisit(state, 3);
    state = purchaseEscapeRope(state, 2).state;
    expect(state.gold.eq(1_250)).toBe(true);
    expect(state.escapeRopes[2]).toBe(1);
    state = consumeEscapeRope(state, 2).state;
    expect(state.escapeRopes[2]).toBe(0);
    expect(consumeEscapeRope(state, 2).error).toMatch(/No Level 2/i);
  });

  it("banks all carried gold on a safe exit and only 75% on defeat or exhaustion", () => {
    const state = { ...defaultProgression(), gold: new Decimal(100) };
    const safe = settleAdventureGold(state, new Decimal(101), true);
    expect(safe.banked.eq(101)).toBe(true);
    expect(safe.lost.eq(0)).toBe(true);
    expect(safe.state.gold.eq(201)).toBe(true);

    const forced = settleAdventureGold(state, new Decimal(101), false);
    expect(forced.banked.eq(75.75)).toBe(true);
    expect(forced.lost.eq(25.25)).toBe(true);
    expect(forced.state.gold.eq(175.75)).toBe(true);
  });

  it("sets early materials and Fire Alligator Hide to their one-cast bait chances", () => {
    expect(MATERIAL_META["rat-pelt"].catchChance).toBe(0.02);
    expect(MATERIAL_META["ant-chitin"].catchChance).toBe(0.03);
    expect(MATERIAL_META["ink-sac"].catchChance).toBe(0.04);
    expect(MATERIAL_META["fire-alligator-hide"].catchChance).toBe(0.04);
    expect(MATERIAL_META["magic-bait"].catchChance).toBe(0.05);
  });

  it("trades the Potionmaster's four requested material stacks for four Level 2 potions and 100 casts of Magic Bait", () => {
    const base = defaultProgression();
    const state = {
      ...base,
      materials: {
        ...base.materials,
        "rat-pelt": 50,
        "ant-chitin": 50,
        "ink-sac": 25,
        "fire-alligator-hide": 25,
      },
    };
    const result = completePotionmasterQuest(state, () => 0);
    expect(result.error).toBeUndefined();
    expect(result.potions).toEqual(["haste-2", "haste-2", "haste-2", "haste-2"]);
    expect(result.state.potions["haste-2"]).toBe(4);
    expect(result.state.materials["magic-bait"]).toBe(100);
    expect(result.state.materials["rat-pelt"]).toBe(0);
    expect(result.state.materials["ant-chitin"]).toBe(0);
    expect(result.state.materials["ink-sac"]).toBe(0);
    expect(result.state.materials["fire-alligator-hide"]).toBe(0);
    expect(result.state.potionmasterQuestCompleted).toBe(true);
  });

  it("trades Battle 7 creature parts at the Crooked Still for three Mystery Potions", () => {
    const base = defaultProgression();
    const state = {
      ...base,
      materials: {
        ...base.materials,
        "eye-of-frog": 10,
        "mutated-rat-tail": 10,
        "fire-ant-chitin": 10,
      },
    };
    const result = completeOddityBrewerExchange(state);
    expect(result.error).toBeUndefined();
    expect(result.state.materials["eye-of-frog"]).toBe(0);
    expect(result.state.materials["mutated-rat-tail"]).toBe(0);
    expect(result.state.materials["fire-ant-chitin"]).toBe(0);
    expect(result.state.potions["mystery-1"]).toBe(3);
    expect(result.state.oddityBrewerCompleted).toBe(true);
    expect(completeOddityBrewerExchange(result.state).error).toMatch(/already/);
  });

  it("completes the Angler's two-stage request and configures the Tackle Box", () => {
    let state = {
      ...defaultProgression(),
      materials: {
        ...defaultProgression().materials,
        "rat-pelt": 10,
        "ant-chitin": 8,
        "ink-sac": 4,
      },
      fish: { ...defaultProgression().fish, hp: 1 },
    };
    const supplied = deliverAnglerMaterials(state, () => 0);
    expect(supplied.error).toBeUndefined();
    expect(supplied.state.anglerRequestedFish).toBe("hp");
    expect(supplied.state.materials["rat-pelt"]).toBe(0);
    expect(supplied.state.materials["ant-chitin"]).toBe(0);
    expect(supplied.state.materials["ink-sac"]).toBe(0);

    const completed = completeAnglerRequest(supplied.state);
    expect(completed.error).toBeUndefined();
    expect(completed.state.tackleBoxOwned).toBe(true);
    expect(completed.state.fish.hp).toBe(0);
    state = setFavoredFishStat(completed.state, "luck");
    expect(state.favoredFishStat).toBe("luck");
  });

  it("rewards and consumes Mapmaker's Chalk as ordinary backpack items", () => {
    const rewarded = completeCartographerQuest(defaultProgression());
    expect(rewarded.cartographerQuestCompleted).toBe(true);
    expect(rewarded.materials["mapmaker-chalk"]).toBe(1);
    const used = consumeMapmakerChalk(rewarded);
    expect(used.error).toBeUndefined();
    expect(used.state.materials["mapmaker-chalk"]).toBe(0);
  });

  it("maps each permanent stat fish to its current species name", () => {
    expect(Object.fromEntries(Object.entries(FISH_META).map(([stat, fish]) => [stat, fish.name]))).toEqual({
      hp: "Hearty Halibut",
      stamina: "Enduring Eel",
      attack: "Savage Sawfish",
      defense: "Bulwark Barnacle",
      spAttack: "Arcane Axolotl",
      spDefense: "Cleansing Clam",
      speed: "Quick Quillfish",
      luck: "Fortunate Flounder",
    });
  });

  it("persists opt-in Water portal routing only after Fishing is unlocked", () => {
    const locked = defaultProgression();
    expect(setAutoEnterPortalType(locked, "water", true).autoEnterPortalTypes).toEqual([]);
    const unlocked = completeQuest({ ...locked, activeQuestId: "retrieve-lost-item" }, "retrieve-lost-item");
    expect(unlocked.waterDungeonVisits).toBe(1);
    const enabled = setAutoEnterPortalType(unlocked, "water", true);
    expect(enabled.autoEnterPortalTypes).toEqual(["water"]);
    expect(recordWaterDungeonVisit(enabled).waterDungeonVisits).toBe(2);
  });

  it("unlocks Forge portal routing only after the first Forge visit", () => {
    const locked = defaultProgression();
    expect(setAutoEnterPortalType(locked, "forge", true).autoEnterPortalTypes).toEqual([]);

    const visited = recordForgeDungeonVisit(locked);
    expect(visited.forgeDungeonVisited).toBe(true);
    expect(setAutoEnterPortalType(visited, "forge", true).autoEnterPortalTypes).toEqual(["forge"]);
  });

  it("removes legacy Forge auto-entry until that save has actually visited the Forge", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const stale: ProgressionState = {
        ...defaultProgression(),
        autoEnterPortalTypes: ["forge"],
      };
      saveProgression(stale, 1);
      expect(loadProgression(1).autoEnterPortalTypes).toEqual([]);

      const visited = setAutoEnterPortalType(recordForgeDungeonVisit(stale), "forge", true);
      saveProgression(visited, 1);
      expect(loadProgression(1).autoEnterPortalTypes).toEqual(["forge"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("consumes and persists the four required fish offerings, allowing replacements", () => {
    let state = {
      ...defaultProgression(),
      fishingRod: true,
      fish: {
        hp: 2,
        stamina: 2,
        attack: 2,
        defense: 2,
        spAttack: 2,
        spDefense: 2,
        speed: 2,
        luck: 2,
      },
    };
    const requiredStats = ["hp", "attack", "speed", "luck"] as const;
    const wrong = offerFishAtWaterShrine(state, "hp", "attack", [...requiredStats]);
    expect(wrong.error).toBeUndefined();
    expect(wrong.state.fish.attack).toBe(1);
    const replaced = offerFishAtWaterShrine(wrong.state, "hp", "hp", [...requiredStats]);
    expect(replaced.state.fish.attack).toBe(2);
    expect(replaced.state.fish.hp).toBe(1);
    state = replaced.state;
    for (const stat of requiredStats) {
      if (stat === "hp") continue;
      state = offerFishAtWaterShrine(state, stat, stat, [...requiredStats]).state;
    }
    expect(state.waterShrineSolved).toBe(true);
    const nextRun = recordWaterDungeonVisit(state);
    expect(nextRun.waterShrineOfferings).toEqual({});
    expect(nextRun.waterShrineSolved).toBe(false);
    expect(completeTridentTrial(state).weaponThrowUnlocked).toBe(true);
    expect(completeTridentTrial(state).inventory.filter((item) => item.definitionId === "trident")).toHaveLength(1);
  });

  it("offers powers of ten up to the owned stack for bulk selling", () => {
    expect(bulkSellAmounts(0)).toEqual([]);
    expect(bulkSellAmounts(7)).toEqual([1]);
    expect(bulkSellAmounts(10)).toEqual([1, 10]);
    expect(bulkSellAmounts(547)).toEqual([1, 10, 100]);
    expect(bulkSellAmounts(10_000)).toEqual([1, 10, 100, 1_000, 10_000]);
  });

  it("sells materials and fish in exact bulk quantities or all at once", () => {
    let state = {
      ...defaultProgression(),
      gold: new Decimal(0),
      materials: { ...defaultProgression().materials, "ant-chitin": 547 },
      fish: { ...defaultProgression().fish, speed: 123 },
    };
    state = sellMaterial(state, "ant-chitin", 100).state;
    expect(state.materials["ant-chitin"]).toBe(447);
    expect(state.gold.eq(1_000)).toBe(true);
    state = sellMaterial(state, "ant-chitin", state.materials["ant-chitin"]).state;
    expect(state.materials["ant-chitin"]).toBe(0);
    expect(state.gold.eq(5_470)).toBe(true);
    state = sellFish(state, "speed", 10).state;
    expect(state.fish.speed).toBe(113);
    expect(state.gold.eq(5_870)).toBe(true);
    expect(sellFish(state, "speed", 114).error).toMatch(/Not enough/);

    const withGear = {
      ...state,
      materials: { ...state.materials, "rusty-gear": 1 },
    };
    const gearSale = sellMaterial(withGear, "rusty-gear", 1);
    expect(gearSale.error).toMatch(/cannot be sold/i);
    expect(gearSale.state.materials["rusty-gear"]).toBe(1);
  });

  it("applies member-specific stat purchases instantly and raises only that cost", () => {
    let state = { ...defaultProgression(), gold: new Decimal(24) };
    const firstCost = trainingCost(state, "knight", "attack");
    expect(firstCost.eq(3)).toBe(true);
    const result = startTraining(state, "knight", "attack");
    expect(result.error).toBeUndefined();
    state = result.state;
    expect(getPartyMember(state, "knight").training.attack).toBe(1);
    expect(memberStats(state, "knight").attack.eq(10.5)).toBe(true);
    expect(state.gold.eq(new Decimal(24).sub(firstCost))).toBe(true);
    expect(trainingCost(state, "knight", "attack").gt(firstCost)).toBe(true);
  });

  it("rounds the remaining gold down after every training purchase", () => {
    const state = { ...defaultProgression(), gold: new Decimal("10.75") };
    const result = startTraining(state, "knight", "attack");
    expect(result.error).toBeUndefined();
    expect(result.state.gold.eq(7)).toBe(true);
    expect(result.state.gold.eq(result.state.gold.floor())).toBe(true);
  });

  it("increases the training growth rate once per ten-level band", () => {
    const state = defaultProgression();
    const knightMember = getPartyMember(state, "knight");
    const atLevel = (level: number) => ({
      ...state,
      party: {
        ...state.party,
        knight: {
          ...knightMember,
          training: { ...knightMember.training, attack: level },
        },
      },
    });
    expect(trainingCost(atLevel(0), "knight", "attack").eq(3)).toBe(true);
    expect(trainingCost(atLevel(1), "knight", "attack").eq(4)).toBe(true);
    expect(trainingCost(atLevel(5), "knight", "attack").eq(5)).toBe(true);
    expect(trainingCost(atLevel(10), "knight", "attack").eq(8)).toBe(true);
    expect(trainingCost(atLevel(11), "knight", "attack").eq(10)).toBe(true);
    expect(trainingCost(atLevel(20), "knight", "attack").eq(49)).toBe(true);
    expect(trainingCost(atLevel(21), "knight", "attack").eq(63)).toBe(true);
    expect(trainingCost(atLevel(30), "knight", "attack").eq(665)).toBe(true);
    expect(trainingCost(atLevel(50), "knight", "attack").gt(1_000_000)).toBe(true);
  });

  it("unlocks Adventure and battle 2 without awarding battle gold", () => {
    const state = defaultProgression();
    const result = recordVictory(state, 1, "45");
    expect(result.unlocked).toBe(true);
    expect(result.state.highestUnlockedLevel).toBe(2);
    expect(result.state.completedRaids).toContain(1);
    expect(result.state.gold.toNumber()).toBe(0);
    expect(result.state.adventureUnlocked).toBe(true);
    expect(result.state.partyTrainingUnlocked).toBe(false);
    expect(nextRaidNumber(result.state)).toBe(2);
  });

  it("awards and activates the marked Shopkeeper rescue quest after Battle 3", () => {
    let state = recordVictory(defaultProgression(), 1).state;
    state = recordVictory(state, 2).state;
    state = recordVictory(state, 3).state;
    expect(state.purchasedQuestIds).toContain("rescue-shopkeeper");
    expect(state.activeQuestId).toBe("rescue-shopkeeper");
    expect(state.adventureStrategy).toBe("quest");
    expect(recordVictory(state, 3).state.purchasedQuestIds.filter((id) => id === "rescue-shopkeeper"))
      .toHaveLength(1);
  });

  it("never rewards a repeated battle and advances through all ten battles", () => {
    const raidOne = recordVictory(defaultProgression(), 1, "45").state;
    const duplicate = recordVictory(raidOne, 1, "45").state;
    expect(duplicate.gold.eq(raidOne.gold)).toBe(true);
    expect(duplicate.victories).toBe(raidOne.victories);
    let progress = recordVictory(duplicate, 2, "100").state;
    expect(nextRaidNumber(progress)).toBe(3);
    for (let battle = 3; battle <= 10; battle += 1) progress = recordVictory(progress, battle).state;
    expect(progress.inventory.filter((item) => item.definitionId === "shaman-ring")).toHaveLength(1);
    expect(progress.inventory.filter((item) => item.definitionId === "suction-cups")).toEqual([
      createSuctionCupsGear(),
    ]);
    expect(recordVictory(progress, 6).state.inventory.filter((item) => item.definitionId === "shaman-ring")).toHaveLength(1);
    expect(recordVictory(progress, 9).state.inventory.filter((item) => item.definitionId === "suction-cups")).toHaveLength(1);
    expect(progress.materials["rusty-gear"]).toBe(1);
    expect(recordVictory(progress, 10).state.materials["rusty-gear"]).toBe(1);
    expect(nextRaidNumber(progress)).toBeNull();
  });

  it("records only registered defeated enemies for the Bestiary", () => {
    const state = recordEnemyDefeats(defaultProgression(), ["rat", "beast-tamer", "not-an-enemy"]);
    expect(state.defeatedEnemyIds).toEqual(["rat", "beast-tamer"]);
    expect(recordEnemyDefeats(state, ["rat"])).toBe(state);
  });

  it("unlocks Training on the first Adventure death, then buys the Undead Gem after the Shopkeeper rescue", () => {
    let state = recordVictory(defaultProgression(), 1).state;
    expect(state.partyTrainingUnlocked).toBe(false);
    state = recordAdventureDeath(state);
    expect(state.partyTrainingUnlocked).toBe(true);
    state = unlockShopkeeper({ ...state, gold: new Decimal(UNDEAD_GEM_COST) });
    expect(state.shopUnlocked).toBe(true);
    const purchase = purchaseUndeadGem(state);
    expect(purchase.error).toBeUndefined();
    expect(purchase.state.gold.eq(0)).toBe(true);
    expect(purchase.state.inventory.some((item) => item.definitionId === "undead-gem")).toBe(true);
  });

  it("purchases multiple quests while keeping only one active", () => {
    let state = { ...clearedThrough(6), gold: new Decimal(2_000) };
    state = purchaseQuest(state, "rescue-me").state;
    expect(state.gold.eq(1_500)).toBe(true);
    expect(state.activeQuestId).toBe("rescue-me");
    state = purchaseQuest(state, "retrieve-lost-item").state;
    expect(state.gold.eq(500)).toBe(true);
    expect(state.purchasedQuestIds).toEqual(["rescue-shopkeeper", "rescue-me", "retrieve-lost-item"]);
    expect(state.activeQuestId).toBe("rescue-me");
    expect(purchaseQuest(state, "rescue-me").error).toMatch(/already purchased/i);

    state = activateQuest(state, "retrieve-lost-item").state;
    expect(state.activeQuestId).toBe("retrieve-lost-item");
    expect(availableAdventureStrategies(state)).toContain("quest");
  });

  it("adds Worm to the party when Rescue Me completes", () => {
    let state = clearedThrough(4);
    state = purchaseQuest({ ...state, gold: new Decimal(500) }, "rescue-me").state;
    const completed = completeQuest(state, "rescue-me");
    expect(completed.activeQuestId).toBeNull();
    expect(completed.completedQuestIds).toContain("rescue-me");
    expect(hasPartyMember(completed, "worm")).toBe(true);
    expect(getPartyMember(completed, "worm").training.spAttack).toBe(0);
  });

  it("does not generate gold passively", () => {
    const state = defaultProgression();
    expect(advanceProgression(state).state.gold.eq(state.gold)).toBe(true);
  });

  it("respawns a member at ten percent HP and heals all party members over time", () => {
    let state = defaultProgression();
    state = setMemberHp(state, "knight", new Decimal(0));
    expect(getPartyMember(state, "knight").hp.eq(5.2)).toBe(true);
    state = setMemberStamina(state, "knight", new Decimal(5));
    const healed = healParty(state, 1);
    expect(getPartyMember(healed, "knight").hp.gt(getPartyMember(state, "knight").hp)).toBe(true);
    expect(getPartyMember(healed, "knight").stamina.gt(5)).toBe(true);
    expect(getPartyMember(healed, "knight").stamina.lte(memberMaxStamina(healed, "knight"))).toBe(true);
  });

  it("heals only party members who are outside the active Adventure", () => {
    let state = rescuedWormState();
    state = setMemberHp(state, "knight", new Decimal(10));
    state = setMemberHp(state, "worm", new Decimal(10));
    const healed = healParty(state, 1, ["knight"]);
    expect(getPartyMember(healed, "knight").hp.eq(10)).toBe(true);
    expect(getPartyMember(healed, "worm").hp.gt(10)).toBe(true);
  });

  it("stores the selected expedition members, strategy, and automatic restart setting", () => {
    let state = rescuedWormState();
    state = setAdventureMemberSelected(state, "worm", true);
    state = setAdventureStrategy(state, "split");
    state = setAdventureIgnoreGold(state, true);
    state = setRestartAdventureOnFullHp(state, true);
    expect(state.selectedAdventureMembers).toEqual(["knight", "worm"]);
    expect(state.adventureStrategy).toBe("split");
    expect(state.adventureIgnoreGold).toBe(true);
    expect(state.restartAdventureOnFullHp).toBe(true);
  });

  it("reveals and configures advanced auto pauses only as special rooms are discovered", () => {
    let state = defaultProgression();
    expect(state.autoPauseAdventureRooms).toEqual([
      "blacksmith",
      "potionmaster",
      "oddityBrewer",
      "cartographer",
      "angler",
      "towerExterior",
    ]);
    expect(state.blacksmithDiscovered).toBe(false);
    state = discoverAdventureSpecialRoom(state, "blacksmith");
    expect(state.blacksmithDiscovered).toBe(true);
    state = setAdventureAutoPauseRoom(state, "blacksmith", false);
    expect(state.autoPauseAdventureRooms).not.toContain("blacksmith");
    state = discoverAdventureSpecialRoom(state, "cartographer");
    state = discoverAdventureSpecialRoom(state, "angler");
    state = discoverAdventureSpecialRoom(state, "oddityBrewer");
    expect(state.cartographerDiscovered).toBe(true);
    expect(state.anglerDiscovered).toBe(true);
    expect(state.oddityBrewerDiscovered).toBe(true);
  });

  it("unlocks Adventure strategies only when their mechanics are available", () => {
    const newGame = defaultProgression();
    expect(availableAdventureStrategies(newGame)).toEqual([]);
    expect(effectiveAdventureStrategy(newGame)).toBe("together");
    expect(setAdventureStrategy(newGame, "split")).toBe(newGame);

    const questState = purchaseQuest({ ...clearedThrough(4), gold: new Decimal(500) }, "rescue-me").state;
    expect(availableAdventureStrategies(questState)).toEqual(["quest"]);
    expect(effectiveAdventureStrategy(questState)).toBe("quest");
    expect(setAdventureStrategy(questState, "together")).toBe(questState);

    const recruited = completeQuest(questState, "rescue-me");
    expect(availableAdventureStrategies(recruited)).toEqual(["together", "split"]);
    expect(effectiveAdventureStrategy(recruited)).toBe("together");

    const throughFive = recordVictory(recruited, 5).state;
    const laterQuest = purchaseQuest({ ...throughFive, gold: new Decimal(1_000) }, "retrieve-lost-item").state;
    expect(availableAdventureStrategies(laterQuest)).toEqual(["quest", "together", "split"]);
  });

  it("offers only previously reached zones for zone-targeted exploration", () => {
    const throughEight = {
      ...clearedThrough(8),
      highestAdventureRingVisited: 3,
      targetAdventureRing: 3,
    };
    expect(availableAdventureTargetRings(throughEight)).toEqual([1, 2, 3]);
    expect(setAdventureTargetRing(throughEight, 4)).toBe(throughEight);
    expect(setAdventureTargetRing(throughEight, 2).targetAdventureRing).toBe(2);
    expect(availableAdventureTargetRings({
      ...throughEight,
      highestAdventureRingVisited: 5,
    })).toEqual([1, 2, 3, 4]);
  });

  it("unlocks Retrieve Lost Item after battle 5 and awards the Fishing Rod on completion", () => {
    expect(purchaseQuest({ ...clearedThrough(4), gold: new Decimal(1_000) }, "retrieve-lost-item").error)
      .toMatch(/Battle 5/i);
    let state = clearedThrough(5);
    state = purchaseQuest({ ...state, gold: new Decimal(1_000) }, "retrieve-lost-item").state;
    expect(state.activeQuestId).toBe("retrieve-lost-item");
    state = completeQuest(state, "retrieve-lost-item");
    expect(state.completedQuestIds).toContain("retrieve-lost-item");
    expect(state.fishingRod).toBe(true);
  });

  it("uses one enemy material per cast and feeds fish for permanent stats", () => {
    let state = { ...defaultProgression(), completedRaids: [1, 2], fishingRod: true };
    state = addMaterial(state, "rat-pelt");
    const fishing = startFishing(state, "knight", "rat-pelt");
    expect(fishing.error).toBeUndefined();
    expect(fishing.state.materials["rat-pelt"]).toBe(0);

    const caught = advanceProgression(fishing.state, 3, () => 0);
    expect(caught.state.fish.hp).toBe(1);
    expect(caught.state.fishingAssignment).toBeNull();
    expect(caught.state.fishingLog.slice(0, 2)).toEqual([
      "Out of Rat Pelt.",
      "Caught a Hearty Halibut.",
    ]);
    const before = memberStats(caught.state, "knight").hp;
    const fed = feedFish(caught.state, "knight", "hp");
    expect(fed.error).toBeUndefined();
    expect(fed.state.fish.hp).toBe(0);
    expect(getPartyMember(fed.state, "knight").fishBonuses.hp).toBe(1);
    expect(memberStats(fed.state, "knight").hp.eq(before.add(3))).toBe(true);
  });

  it("adds each fish to base before applying compounded gold training", () => {
    let state = { ...defaultProgression(), completedRaids: [1, 2], gold: new Decimal(10_000) };
    state = startTraining(state, "knight", "attack").state;
    const once = memberStats(state, "knight").attack;
    state = startTraining(state, "knight", "attack").state;
    const twice = memberStats(state, "knight").attack;
    expect(once.eq(10.5)).toBe(true);
    expect(twice.eq(new Decimal(10).mul(new Decimal(1.05).pow(2)))).toBe(true);

    state = { ...state, fish: { ...state.fish, attack: 1 } };
    const fed = feedFish(state, "knight", "attack").state;
    expect(memberStats(fed, "knight").attack.eq(new Decimal(13).mul(new Decimal(1.05).pow(2)))).toBe(true);
  });

  it("caps each member's fish use per stat at half the highest completed Battle, rounded down", () => {
    let state = {
      ...defaultProgression(),
      completedRaids: [1, 2],
      fish: { ...defaultProgression().fish, attack: 2, defense: 1 },
    };
    expect(fishBonusCap(state)).toBe(1);
    for (let fish = 0; fish < 1; fish += 1) {
      const result = feedFish(state, "knight", "attack");
      expect(result.error).toBeUndefined();
      state = result.state;
    }
    const blocked = feedFish(state, "knight", "attack");
    expect(blocked.error).toMatch(/1-fish limit/);
    expect(blocked.state.fish.attack).toBe(1);
    expect(getPartyMember(blocked.state, "knight").fishBonuses.attack).toBe(1);
    expect(memberStats(blocked.state, "knight").attack.eq(13)).toBe(true);
    expect(feedFish(blocked.state, "knight", "defense").error).toBeUndefined();

    const raidFour = { ...blocked.state, completedRaids: [1, 2, 3, 4] };
    expect(fishBonusCap(raidFour)).toBe(2);
    expect(feedFish(raidFour, "knight", "attack").error).toBeUndefined();
    expect(fishBonusCap({ ...blocked.state, completedRaids: [9] })).toBe(4);
    expect(fishBonusCap({ ...blocked.state, completedRaids: [10] })).toBe(5);
  });

  it("does not allow permanent stat fish before Battle 2 is complete", () => {
    const state = {
      ...defaultProgression(),
      completedRaids: [1],
      fish: { ...defaultProgression().fish, hp: 1 },
    };
    const result = feedFish(state, "knight", "hp");
    expect(result.error).toMatch(/Complete Battle 2/);
    expect(result.state.fish.hp).toBe(1);
  });

  it("buys and consumes party-wide stat potions for 30 minutes", () => {
    const now = Date.now();
    let state = {
      ...defaultProgression(),
      completedRaids: [1, 2, 3, 4],
      gold: new Decimal(POTION_COST * 2 + 500),
    };
    state = completeQuest(purchaseQuest(state, "rescue-me").state, "rescue-me");
    state = purchasePotion(state, "stat-attack").state;
    expect(state.gold.eq(POTION_COST)).toBe(true);
    expect(state.potions["stat-attack"]).toBe(1);
    state = consumePotion(state, "stat-attack", now).state;
    expect(state.potions["stat-attack"]).toBe(0);
    expect(state.activePotions["stat-attack"]).toBe(now + POTION_DURATION_MS);
    expect(memberStats(state, "knight").attack.eq(60)).toBe(true);
    expect(memberStats(state, "worm").attack.eq(51)).toBe(true);

    state = purchasePotion(state, "stat-attack").state;
    state = consumePotion(state, "stat-attack", now + 1_000).state;
    expect(state.activePotions["stat-attack"]).toBe(now + POTION_DURATION_MS * 2);
  });

  it("rolls three distinct Level 1 effects for Mystery Potions and applies the third at negative half strength", () => {
    const now = Date.now();
    const base = defaultProgression();
    const consumed = consumePotion({
      ...base,
      potions: { ...base.potions, "mystery-1": 1 },
    }, "mystery-1", now, () => 0.5);
    expect(consumed.error).toBeUndefined();
    expect(consumed.state.potions["mystery-1"]).toBe(0);
    expect(consumed.mysteryEffect).toBeDefined();
    expect(mysteryPotionDodgeChance(consumed.state, now + 1)).toBe(0.05);
    expect(mysteryPotionDodgeChance(consumed.state, now + POTION_DURATION_MS + 1)).toBe(0);
    expect(new Set([
      ...(consumed.mysteryEffect?.positive ?? []),
      consumed.mysteryEffect?.negative,
    ]).size).toBe(3);

    const exact = {
      ...base,
      activeMysteryPotions: [{
        positive: ["stat-attack", "stat-defense"] as ["stat-attack", "stat-defense"],
        negative: "stat-hp" as const,
        expiresAt: now + POTION_DURATION_MS,
      }],
    };
    expect(memberStats(exact, "knight").attack.sub(memberStats(base, "knight").attack).eq(50)).toBe(true);
    expect(memberStats(exact, "knight").defense.sub(memberStats(base, "knight").defense).eq(50)).toBe(true);
    expect(memberStats(exact, "knight").hp.sub(memberStats(base, "knight").hp).eq(-25)).toBe(true);
  });

  it("adds a found Forge potion through normal backpack capacity", () => {
    const reward = addPotion(defaultProgression(), "stat-defense");
    expect(reward.added).toBe(1);
    expect(reward.discarded).toBe(0);
    expect(reward.state.potions["stat-defense"]).toBe(1);
    expect(inventoryUsedSlots(reward.state)).toBe(1);
  });

  it("expires timed effects, clamps boosted vitals, and speeds only Adventure with Haste", () => {
    const now = Date.now();
    let state = { ...defaultProgression(), gold: new Decimal(POTION_COST * 2) };
    state = consumePotion(purchasePotion(state, "stat-hp").state, "stat-hp", now).state;
    expect(memberStats(state, "knight").hp.eq(102)).toBe(true);
    state = setMemberHp(state, "knight", new Decimal(102));
    state = consumePotion(purchasePotion(state, "haste").state, "haste", now).state;
    expect(adventureSpeedMultiplier(state, now + 1)).toBe(1.1);

    state = advanceTimedEffects(state, now + POTION_DURATION_MS + 1);
    expect(state.activePotions).toEqual({});
    expect(adventureSpeedMultiplier(state, now + POTION_DURATION_MS + 1)).toBe(1);
    expect(getPartyMember(state, "knight").hp.eq(52)).toBe(true);
  });

  it("unlocks stronger Level 2 potions after Battle 9 without stacking potion levels", () => {
    const now = Date.now();
    const locked = purchasePotion({
      ...defaultProgression(),
      gold: new Decimal(POTION_LEVEL_2_COST),
    }, "stat-attack-2");
    expect(locked.error).toMatch(/Battle 9/);
    expect(locked.state.gold.eq(POTION_LEVEL_2_COST)).toBe(true);

    let state = {
      ...defaultProgression(),
      completedRaids: Array.from({ length: 9 }, (_, index) => index + 1),
      gold: new Decimal(POTION_LEVEL_2_COST * 3 + POTION_COST),
    };
    state = consumePotion(purchasePotion(state, "stat-attack").state, "stat-attack", now).state;
    state = consumePotion(purchasePotion(state, "stat-attack-2").state, "stat-attack-2", now).state;
    state = consumePotion(purchasePotion(state, "stat-luck-2").state, "stat-luck-2", now).state;
    state = consumePotion(purchasePotion(state, "haste-2").state, "haste-2", now).state;

    expect(state.gold.eq(0)).toBe(true);
    expect(memberStats(state, "knight").attack.eq(110)).toBe(true);
    expect(memberStats(state, "knight").luck.eq(30)).toBe(true);
    expect(adventureSpeedMultiplier(state, now + 1)).toBe(1.2);
  });

  it("auto fishing reloads the selected bait until that bait is depleted", () => {
    let state = addMaterial(addMaterial({ ...defaultProgression(), fishingRod: true }, "rat-pelt"), "rat-pelt");
    state = startFishing(state, "knight", "rat-pelt", "auto").state;
    expect(state.materials["rat-pelt"]).toBe(1);
    state = advanceProgression(state, 3, () => 1).state;
    expect(state.materials["rat-pelt"]).toBe(0);
    expect(state.fishingAssignment).not.toBeNull();
    state = advanceProgression(state, 3, () => 1).state;
    expect(state.fishingAssignment).toBeNull();
  });

  it("equips and moves a single gear item between party members, and requires unequipping before sale", () => {
    let state = rescuedWormState();
    const item = createRingGear("helmet", 1, "party-gear");
    state = addGear(state, item);
    const wormHp = memberStats(state, "worm").hp;
    state = equipGear(state, "worm", item.id).state;
    expect(memberEquipment(state, "worm").helmet).toBe(item.id);
    expect(memberStats(state, "worm").hp.gt(wormHp)).toBe(true);
    state = equipGear(state, "knight", item.id).state;
    expect(memberEquipment(state, "worm").helmet).toBeNull();
    expect(memberEquipment(state, "knight").helmet).toBe(item.id);
    const gold = state.gold;
    const equippedSale = sellGear(state, item.id);
    expect(equippedSale.error).toMatch(/unequip/i);
    expect(equippedSale.state).toBe(state);
    expect(equippedSale.state.inventory).toHaveLength(1);
    state = unequipGear(state, "knight", "helmet").state;
    state = sellGear(state, item.id).state;
    expect(state.inventory).toHaveLength(0);
    expect(memberEquipment(state, "knight").helmet).toBeNull();
    expect(state.gold.gt(gold)).toBe(true);
  });

  it("keeps three save slots independent and deletes only the selected slot", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const advanced = recordVictory(recordVictory(defaultProgression(), 1).state, 2).state;
      saveProgression(recordEnemyDefeats({
        ...defaultProgression(),
        gold: new Decimal(111),
        timePlayedMs: 12_345,
        highestAdventureRingVisited: 3,
        escapeRopes: { 1: 2, 2: 1, 3: 0 },
      }, ["rat", "ant"]), 1);
      saveProgression({ ...advanced, gold: new Decimal(222), timePlayedMs: 65_000 }, 2);

      expect(loadProgression(1).gold.eq(111)).toBe(true);
      expect(loadProgression(1).timePlayedMs).toBe(12_345);
      expect(loadProgression(1).highestAdventureRingVisited).toBe(3);
      expect(loadProgression(1).escapeRopes).toEqual({ 1: 2, 2: 1, 3: 0 });
      expect(loadProgression(1).defeatedEnemyIds).toEqual(["rat", "ant"]);
      expect(loadProgression(2).gold.eq(222)).toBe(true);
      expect(loadProgression(2).timePlayedMs).toBe(65_000);
      expect(loadProgression(3).gold.eq(0)).toBe(true);
      expect(saveSlotSummaries().map((slot) => slot.occupied)).toEqual([true, true, false]);
      expect(saveSlotSummaries().map((slot) => slot.battle)).toEqual([1, 3, 1]);
      expect(saveSlotSummaries().map((slot) => slot.timePlayedMs)).toEqual([12_345, 65_000, 0]);

      deleteSaveSlot(1);
      expect(saveSlotSummaries().map((slot) => slot.occupied)).toEqual([false, true, false]);
      expect(loadProgression(2).gold.eq(222)).toBe(true);
      deleteSaveSlot(3);
      expect(saveSlotSummaries().map((slot) => slot.occupied)).toEqual([false, true, false]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("persists purchased quests separately from the selected active quest", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      let state = { ...clearedThrough(6), gold: new Decimal(2_000) };
      state = purchaseQuest(state, "rescue-me").state;
      state = purchaseQuest(state, "retrieve-lost-item").state;
      state = activateQuest(state, "retrieve-lost-item").state;
      saveProgression(state, 1);

      const loaded = loadProgression(1);
      expect(loaded.purchasedQuestIds).toEqual(["rescue-shopkeeper", "rescue-me", "retrieve-lost-item"]);
      expect(loaded.activeQuestId).toBe("retrieve-lost-item");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("repairs Battle 3 saves that predate the marked Shopkeeper quest", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      saveProgression({
        ...defaultProgression(),
        completedRaids: [1, 2, 3],
        highestUnlockedLevel: 4,
        selectedLevel: 4,
        shopUnlocked: false,
      }, 1);
      const loaded = loadProgression(1);
      expect(loaded.purchasedQuestIds).toContain("rescue-shopkeeper");
      expect(loaded.activeQuestId).toBe("rescue-shopkeeper");
      expect(loaded.adventureStrategy).toBe("quest");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("repairs Potionmaster discovery for a progressed version-38 Tower save", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-1";
      saveProgression({
        ...defaultProgression(),
        towerDoorDiscovered: true,
        potionmasterDiscovered: false,
      }, 1);
      const legacy = JSON.parse(values.get(key)!) as Record<string, unknown>;
      legacy.version = 38;
      values.set(key, JSON.stringify(legacy));

      expect(loadProgression(1).potionmasterDiscovered).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("marks an interrupted Hammer expedition as failed when its save is loaded", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      let state = discoverBlacksmith({
        ...defaultProgression(),
        materials: { ...defaultProgression().materials, clay: 20 },
      });
      state = beginHammerQuestAttempt(purchaseHammerQuest(state).state);
      saveProgression(state, 1);

      const loaded = loadProgression(1);
      expect(loaded.hammerQuestPurchased).toBe(true);
      expect(loaded.hammerQuestAttemptActive).toBe(false);
      expect(loaded.hammerQuestFailed).toBe(true);
      expect(availableAdventureStrategies(loaded)).not.toContain("quest");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("positions Save Slot 3 after the Squid and Miner progression but before Battle 9", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-3";
      const originalKnightTraining = {
        ...EMPTY_TRAINING,
        hp: 31,
        attack: 27,
        defense: 19,
        speed: 8,
      };
      const originalWormTraining = {
        ...EMPTY_TRAINING,
        hp: 12,
        spAttack: 34,
        spDefense: 23,
        luck: 6,
      };
      let battleEightState = rescuedWormState();
      for (let battle = 5; battle <= 7; battle += 1) {
        battleEightState = recordVictory(battleEightState, battle).state;
      }
      saveProgression({
        ...battleEightState,
        party: {
          ...battleEightState.party,
          knight: {
            ...battleEightState.party.knight!,
            training: originalKnightTraining,
          },
          worm: {
            ...battleEightState.party.worm!,
            training: originalWormTraining,
          },
        },
        defeatedEnemyIds: [
          "rat",
          "goblin-chief",
          "goblin-shaman",
          "goblin-archer",
          "alligator",
          "dragonfly",
          "bee",
          "beast-tamer",
          "squid-knight",
          "squid-tentacle",
          "abyssal-squid",
        ],
      }, 3);
      const stored = JSON.parse(values.get(key)!);
      values.set(key, JSON.stringify({
        ...stored,
        version: 25,
        highestUnlockedLevel: 9,
        selectedLevel: 9,
        completedRaids: [1, 2, 3, 4, 5, 6, 7, 8],
        victories: 8,
      }));

      expect(saveSlotSummaries()[2].battle).toBe(9);
      const replay = loadProgression(3);
      expect(replay.highestUnlockedLevel).toBe(9);
      expect(replay.selectedLevel).toBe(9);
      expect(replay.completedRaids).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(replay.victories).toBe(8);
      expect(replay.party.knight?.training).toEqual(originalKnightTraining);
      expect(replay.party.worm?.training).toEqual(originalWormTraining);
      expect(Object.values(replay.party.miner?.training ?? {})).toEqual(Array(8).fill(30));
      expect(replay.miningUnlocked).toBe(true);
      expect(replay.completedQuestIds).toContain("find-miner");
      expect(replay.materials["rotten-tentacle"]).toBeGreaterThanOrEqual(1);
      expect(replay.inventory.some((item) => item.definitionId === "suction-cups")).toBe(false);
      expect(replay.defeatedEnemyIds).toContain("rat");
      expect(replay.defeatedEnemyIds).toContain("goblin-chief");
      expect(replay.defeatedEnemyIds).toContain("goblin-shaman");
      expect(replay.defeatedEnemyIds).toContain("beast-tamer");
      expect(replay.defeatedEnemyIds).toContain("squid-knight");
      expect(replay.defeatedEnemyIds).toContain("squid-tentacle");
      expect(replay.defeatedEnemyIds).toContain("abyssal-squid");
      expect(replay.defeatedEnemyIds).not.toContain("ooze-guardian");
      expect(replay.defeatedEnemyIds).not.toContain("abyssal-ooze");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rewinds the current Save Slot 3 to immediately before Battle 10 without changing its build", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-3";
      const completed = clearedThrough(10);
      const customTraining = { ...EMPTY_TRAINING, hp: 45, attack: 43, luck: 40 };
      saveProgression({
        ...completed,
        gold: new Decimal(142_451),
        party: {
          ...completed.party,
          knight: { ...completed.party.knight!, training: customTraining },
        },
        materials: {
          ...completed.materials,
          clay: 352,
          "rusty-metal": 31,
        },
        defeatedEnemyIds: [
          ...completed.defeatedEnemyIds,
          "barnacle-drone",
          "brine-dynamo",
          "rustmire-engine",
        ],
      }, 3);
      const stored = JSON.parse(values.get(key)!);
      values.set(key, JSON.stringify({ ...stored, version: 39 }));

      const replay = loadProgression(3);
      expect(replay.gold.eq(142_451)).toBe(true);
      expect(replay.party.knight?.training).toEqual(customTraining);
      expect(replay.completedRaids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(replay.victories).toBe(9);
      expect(replay.highestUnlockedLevel).toBe(10);
      expect(replay.selectedLevel).toBe(10);
      expect(replay.materials.clay).toBe(352);
      expect(replay.materials["rusty-metal"]).toBe(31);
      expect(replay.materials["rusty-gear"]).toBe(0);
      expect(replay.defeatedEnemyIds).not.toContain("barnacle-drone");
      expect(replay.defeatedEnemyIds).not.toContain("brine-dynamo");
      expect(replay.defeatedEnemyIds).not.toContain("rustmire-engine");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("repairs Rusty Gear lost during the temporary key-item migration", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-1";
      const completed = clearedThrough(10);
      saveProgression(completed, 1);
      const stored = JSON.parse(values.get(key)!);
      stored.version = 41;
      stored.materials["rusty-gear"] = 0;
      stored.rustyGearOwned = true;
      stored.towerKeyOwned = false;
      values.set(key, JSON.stringify(stored));

      const repaired = loadProgression(1);
      expect(repaired.materials["rusty-gear"]).toBe(1);
      const persisted = JSON.parse(values.get(key)!);
      expect(persisted.rustyGearOwned).toBeUndefined();
      expect(persisted.materials["rusty-gear"]).toBe(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("repairs current saves whose one-time Trident or Rusty Gear was discarded", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-1";
      const completed = {
        ...clearedThrough(10),
        tridentTrialCompleted: true,
        weaponThrowUnlocked: true,
      };
      saveProgression(completed, 1);
      const stored = JSON.parse(values.get(key)!);
      stored.version = 44;
      stored.inventory = stored.inventory.filter((item: { definitionId?: string }) =>
        item.definitionId !== "trident"
      );
      stored.materials["rusty-gear"] = 0;
      stored.towerKeyOwned = false;
      values.set(key, JSON.stringify(stored));

      const repaired = loadProgression(1);
      expect(repaired.inventory.some((item) => item.definitionId === "trident")).toBe(true);
      expect(repaired.materials["rusty-gear"]).toBe(1);
      expect(inventorySlotCapacity(repaired)).toBeGreaterThanOrEqual(inventoryUsedSlots(repaired));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not recreate Rusty Gear after it was consumed to craft the Tower Key", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-1";
      const completed = clearedThrough(10);
      saveProgression(completed, 1);
      const stored = JSON.parse(values.get(key)!);
      stored.version = 41;
      stored.materials["rusty-gear"] = 0;
      stored.rustyGearOwned = true;
      stored.towerKeyOwned = true;
      values.set(key, JSON.stringify(stored));

      const repaired = loadProgression(1);
      expect(repaired.materials["rusty-gear"]).toBe(0);
      expect(repaired.towerKeyOwned).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("never records non-creature battle objectives in the Bestiary", () => {
    const state = recordEnemyDefeats(defaultProgression(), ["brine-dynamo"]);
    expect(state.defeatedEnemyIds).not.toContain("brine-dynamo");
  });

  it("repairs the overshot Battle 8 test preset to level 30 without touching other allocations", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-3";
      const overshotTraining = {
        hp: 45,
        stamina: 20,
        attack: 45,
        defense: 45,
        spAttack: 45,
        spDefense: 45,
        speed: 12,
        luck: 12,
      };
      const levelThirtyTraining = Object.fromEntries(
        Object.keys(EMPTY_TRAINING).map((stat) => [stat, 30]),
      );
      let state = rescuedWormState();
      for (let battle = 5; battle <= 7; battle += 1) {
        state = recordVictory(state, battle).state;
      }
      state = completeTridentTrial(state);
      saveProgression({
        ...state,
        party: {
          knight: { ...state.party.knight!, training: { ...overshotTraining } },
          worm: { ...state.party.worm!, training: { ...overshotTraining } },
        },
      }, 3);
      const stored = JSON.parse(values.get(key)!);
      values.set(key, JSON.stringify({ ...stored, version: 26 }));

      const repaired = loadProgression(3);
      expect(repaired.party.knight?.training).toEqual(levelThirtyTraining);
      expect(repaired.party.worm?.training).toEqual(levelThirtyTraining);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("grants Shaman's Ring when migrating an older save that already cleared Battle 6", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const key = "idle-game-prototype-save-v2-slot-1";
      saveProgression(clearedThrough(6), 1);
      const stored = JSON.parse(values.get(key)!);
      values.set(key, JSON.stringify({
        ...stored,
        version: 22,
        inventory: stored.inventory.filter((item: { definitionId?: string }) => item.definitionId !== "shaman-ring"),
      }));
      const loaded = loadProgression(1);
      expect(loaded.inventory.filter((item) => item.definitionId === "shaman-ring")).toEqual([
        createShamanRingGear(),
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("persists potion inventory and active real-time expirations", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const now = Date.now();
      let state = { ...defaultProgression(), gold: new Decimal(POTION_COST * 2) };
      state = purchasePotion(state, "haste").state;
      state = purchasePotion(state, "stat-defense").state;
      state = consumePotion(state, "haste", now).state;
      state = consumePotion({
        ...state,
        potions: { ...state.potions, "mystery-1": 1 },
      }, "mystery-1", now, () => 0.5).state;
      saveProgression(state, 1);

      const loaded = loadProgression(1);
      expect(loaded.potions["stat-defense"]).toBe(1);
      expect(loaded.potions.haste).toBe(0);
      expect(loaded.activePotions.haste).toBe(now + POTION_DURATION_MS);
      expect(loaded.activeMysteryPotions).toHaveLength(1);
      expect(loaded.activeMysteryPotions[0].expiresAt).toBe(now + POTION_DURATION_MS);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("migrates saved Goblin Hides and Goblin bait into Ant Chitin", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });

    try {
      const state = {
        ...defaultProgression(),
        fishingRod: true,
        fishingAssignment: {
          memberId: "knight" as const,
          baitId: "rat-pelt" as const,
          mode: "auto" as const,
          progressSeconds: 1,
        },
      };
      saveProgression(state, 1);
      const saveKey = "idle-game-prototype-save-v2-slot-1";
      const legacy = JSON.parse(values.get(saveKey)!);
      legacy.version = 11;
      legacy.materials = { "rat-pelt": 2, "goblin-hide": 5 };
      legacy.fishingAssignment.baitId = "goblin-hide";
      values.set(saveKey, JSON.stringify(legacy));

      const loaded = loadProgression(1);
      expect(loaded.materials).toEqual({
        "rat-pelt": 2,
        "ant-chitin": 5,
        "ink-sac": 0,
        clay: 0,
        "fire-alligator-hide": 0,
        "rotten-tentacle": 0,
        driftwood: 0,
        seaweed: 0,
        "magic-bait": 0,
        "rusty-metal": 0,
        "rusty-gear": 0,
        "mapmaker-chalk": 0,
        "eye-of-frog": 0,
        "mutated-rat-tail": 0,
        "fire-ant-chitin": 0,
      });
      expect(loaded.fishingAssignment?.baitId).toBe("ant-chitin");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

function clearedThrough(lastBattle: number) {
  let state = defaultProgression();
  for (let battle = 1; battle <= lastBattle; battle += 1) {
    state = recordVictory(state, battle).state;
    if (battle === 3 && state.activeQuestId === "rescue-shopkeeper") {
      state = unlockShopkeeper(completeQuest(state, "rescue-shopkeeper"));
    }
  }
  return state;
}

function rescuedWormState() {
  const state = { ...clearedThrough(4), gold: new Decimal(500) };
  return completeQuest(purchaseQuest(state, "rescue-me").state, "rescue-me");
}

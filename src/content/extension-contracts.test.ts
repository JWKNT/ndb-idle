import { describe, expect, it } from "vitest";
import type { BoardDefinition, LevelDefinition, UnitDefinition } from "../game/types";
import { ATTACK_VISUAL_IDS, PLAYER_IDS, SCENERY_KINDS, WEAPON_ABILITY_IDS } from "../game/types";
import { ADVENTURE_ENEMY_KINDS } from "../game/adventure/types";
import { ADVENTURE_ENEMY_DROPS } from "../game/adventure/enemies";
import {
  ADVENTURE_TILE_CONTRACTS,
  DUNGEON_ROOM_CONTRACTS,
  DUNGEON_THEME_BASE_ENEMIES,
} from "../game/adventure/extension-contracts";
import { MINING_ENEMY_BANDS } from "../game/mining/enemies";
import {
  MINING_ENEMY_DEFINITION_IDS,
  MINING_ROCK_CONTENTS,
  MINING_TILE_CONTRACTS,
  MINING_TILE_KINDS,
} from "../game/mining/types";
import {
  MILESTONE_GEAR_EFFECT_OWNERS,
  MILESTONE_GEAR_EFFECTS,
  MILESTONE_GEAR_IDS,
  createMilestoneGear,
} from "../game/gear";
import { MATERIAL_IDS, MATERIAL_META, emptyMaterialCounts } from "../game/items";
import { POTION_IDS, POTION_META, emptyPotionCounts } from "../game/potions";
import { WEAPON_SKILLS } from "../game/weapon-skills";
import { ATTACK_VISUAL_CONTRACTS } from "../features/shared/AttackEffectOverlay";
import { boards } from "./boards";
import { enemies, getEnemy } from "./enemies";
import { ENEMY_SPRITES } from "./enemy-sprites";
import { levels } from "./levels";
import { players } from "./players";
import { PLAYER_SPRITES } from "./player-sprites";
import { quests, QUEST_COMPLETION_EFFECTS } from "./quests";
import { BATTLE_FIRST_CLEAR_CONTRACTS } from "./battle-first-clear";
import {
  KEY_ITEM_IDS,
  KEY_ITEM_SPRITES,
  MATERIAL_SPRITES,
  MILESTONE_GEAR_SPRITES,
  POTION_SPRITES,
} from "./inventory-sprites";
import { BESTIARY_DESCRIPTIONS, STORY_DIALOGUE } from "./story-dialogue";
import { sprites } from "./sprites";
import { FORGE_RECIPE_IDS, FORGE_RECIPE_PATTERNS } from "./forge-recipes";
import { HELP_ENTRIES, HELP_GROUP_IDS, HELP_GROUPS } from "./help";
import { MILESTONE_GEAR_DESCRIPTIONS } from "./item-descriptions";
import { CRAFTING_RECIPE_OUTPUTS } from "../game/crafting";
import { GAME_VIEW_IDS, GAME_VIEW_NAVIGATION } from "../features/shell/GameNavigation";

type ModuleExports = Record<string, unknown>;

function authoredModules(pattern: Record<string, ModuleExports>): ModuleExports[] {
  return Object.entries(pattern)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .map(([, module]) => module);
}

function isUnitDefinition(value: unknown): value is UnitDefinition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UnitDefinition>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && Boolean(candidate.stats);
}

function isBoardDefinition(value: unknown): value is BoardDefinition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BoardDefinition>;
  return typeof candidate.id === "string"
    && typeof candidate.width === "number"
    && typeof candidate.height === "number"
    && Array.isArray(candidate.terrain);
}

function isLevelDefinition(value: unknown): value is LevelDefinition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LevelDefinition>;
  return typeof candidate.number === "number"
    && Boolean(candidate.board)
    && Array.isArray(candidate.enemies);
}

function isQuestDefinition(value: unknown): value is (typeof quests)[number] {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<(typeof quests)[number]>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && typeof candidate.unlockBattle === "number";
}

function definitionsFrom<T>(
  modules: ModuleExports[],
  predicate: (value: unknown) => value is T,
): T[] {
  return modules.flatMap((module) => Object.values(module).filter(predicate));
}

describe("extensible content registries", () => {
  it("registers every authored enemy definition exactly once", () => {
    const modules = authoredModules(import.meta.glob("./enemies/*.ts", { eager: true }));
    const discovered = definitionsFrom(modules, isUnitDefinition);
    expect(discovered).toHaveLength(modules.length);
    expect(new Set(discovered)).toEqual(new Set(Object.values(enemies)));
    expect(new Set(Object.keys(enemies))).toEqual(new Set(discovered.map(({ id }) => id)));
  });

  it("registers every authored party member definition exactly once", () => {
    const modules = authoredModules(import.meta.glob("./players/*.ts", { eager: true }));
    const discovered = definitionsFrom(modules, isUnitDefinition);
    expect(discovered).toHaveLength(modules.length);
    expect(new Set(discovered)).toEqual(new Set(Object.values(players)));
    expect(new Set(Object.keys(players))).toEqual(new Set(discovered.map(({ id }) => id)));
  });

  it("registers every authored board definition exactly once", () => {
    const modules = authoredModules(import.meta.glob("./boards/*-board.ts", { eager: true }));
    const discovered = definitionsFrom(modules, isBoardDefinition);
    expect(discovered).toHaveLength(modules.length);
    expect(new Set(discovered)).toEqual(new Set(Object.values(boards)));
    expect(new Set(Object.keys(boards))).toEqual(new Set(discovered.map(({ id }) => id)));
  });

  it("registers every authored Battle definition exactly once", () => {
    const modules = authoredModules(import.meta.glob("./levels/*.ts", { eager: true }));
    const discovered = definitionsFrom(modules, isLevelDefinition);
    expect(discovered).toHaveLength(modules.length);
    expect(new Set(discovered)).toEqual(new Set(levels));
    expect(new Set(levels.map(({ number }) => number))).toEqual(
      new Set(discovered.map(({ number }) => number)),
    );
  });

  it("registers every authored quest definition exactly once", () => {
    const modules = authoredModules(import.meta.glob("./quests/*.ts", { eager: true }));
    const discovered = definitionsFrom(modules, isQuestDefinition);
    expect(discovered).toHaveLength(modules.length);
    expect(new Set(discovered)).toEqual(new Set(quests));
    expect(new Set(quests.map(({ id }) => id))).toEqual(new Set(discovered.map(({ id }) => id)));
  });
});

describe("cross-system extension contracts", () => {
  it("requires every enemy to integrate with identity, visuals, flavor, and combat references", () => {
    for (const [id, enemy] of Object.entries(enemies)) {
      expect(enemy.id).toBe(id);
      expect(ENEMY_SPRITES[id as keyof typeof enemies]).toBeTruthy();
      expect(BESTIARY_DESCRIPTIONS[id as keyof typeof enemies].trim()).not.toBe("");
      for (const reference of [
        ...(enemy.summonPool ?? []),
        enemy.invulnerableWhileEnemyId,
        enemy.weakeningGuardDefinitionId,
      ].filter((value): value is string => Boolean(value))) {
        expect(getEnemy(reference), `${id} references unknown enemy ${reference}`).toBeTruthy();
      }
    }
  });

  it("requires every party member to choose a sprite and basic attack presentation", () => {
    expect(new Set(Object.keys(players))).toEqual(new Set(PLAYER_IDS));
    expect(new Set(Object.keys(PLAYER_SPRITES))).toEqual(new Set(PLAYER_IDS));
  });

  it("requires every Battle to integrate its board, story, and first-clear behavior", () => {
    expect(new Set(Object.keys(BATTLE_FIRST_CLEAR_CONTRACTS).map(Number))).toEqual(
      new Set(levels.map(({ number }) => number)),
    );
    expect(new Set(Object.keys(STORY_DIALOGUE.battles).map(Number))).toEqual(
      new Set(levels.map(({ number }) => number)),
    );
    for (const level of levels) {
      expect(boards[level.board.id as keyof typeof boards]).toBe(level.board);
      expect(level.enemies).not.toHaveLength(0);
      for (const spawn of level.enemies) {
        expect(getEnemy(spawn.unit.id)).toBe(spawn.unit);
        expect(spawn.position.x).toBeGreaterThanOrEqual(0);
        expect(spawn.position.y).toBeGreaterThanOrEqual(0);
        expect(spawn.position.x).toBeLessThan(level.board.width);
        expect(spawn.position.y).toBeLessThan(level.board.height);
      }
    }
  });

  it("requires every quest to declare completion effects and a valid unlock Battle", () => {
    const battleNumbers = new Set(levels.map(({ number }) => number));
    expect(new Set(Object.keys(QUEST_COMPLETION_EFFECTS))).toEqual(
      new Set(quests.map(({ id }) => id)),
    );
    for (const quest of quests) expect(battleNumbers.has(quest.unlockBattle)).toBe(true);
  });

  it("requires every material and potion to integrate storage, metadata, sprites, and effect families", () => {
    expect(Object.keys(emptyMaterialCounts())).toEqual([...MATERIAL_IDS]);
    expect(Object.keys(emptyPotionCounts())).toEqual([...POTION_IDS]);
    for (const id of MATERIAL_IDS) {
      expect(MATERIAL_META[id].name.trim()).not.toBe("");
      expect(MATERIAL_SPRITES[id]).toBeTruthy();
    }
    for (const id of POTION_IDS) {
      const potion = POTION_META[id];
      expect(potion.id).toBe(id);
      expect(POTION_SPRITES[id]).toBeTruthy();
      if (potion.effectKind === "stat") expect(potion.stat).not.toBeNull();
      if (potion.effectKind === "haste") expect(potion.speedMultiplier).toBeGreaterThan(1);
      if (potion.effectKind === "mystery") expect(potion.cost).toBe(0);
    }
  });

  it("requires key items, crafting recipes, and Help groups to remain complete", () => {
    expect(new Set(Object.keys(KEY_ITEM_SPRITES))).toEqual(new Set(KEY_ITEM_IDS));
    expect(new Set(Object.keys(FORGE_RECIPE_PATTERNS))).toEqual(new Set(FORGE_RECIPE_IDS));
    expect(new Set(Object.keys(CRAFTING_RECIPE_OUTPUTS))).toEqual(new Set(FORGE_RECIPE_IDS));
    expect(new Set(HELP_GROUPS.map(({ id }) => id))).toEqual(new Set(HELP_GROUP_IDS));
    expect(new Set(HELP_ENTRIES.map(({ id }) => id)).size).toBe(HELP_ENTRIES.length);
    for (const entry of HELP_ENTRIES) expect(HELP_GROUP_IDS).toContain(entry.group);
    expect(new Set(Object.keys(GAME_VIEW_NAVIGATION))).toEqual(new Set(GAME_VIEW_IDS));
    for (const kind of SCENERY_KINDS) expect(sprites[kind]).toBeTruthy();
  });

  it("requires every milestone item to have construction, visuals, and nonempty effect integration", () => {
    for (const id of MILESTONE_GEAR_IDS) {
      expect(createMilestoneGear(id).definitionId).toBe(id);
      expect(MILESTONE_GEAR_SPRITES[id]).toBeTruthy();
      expect(MILESTONE_GEAR_DESCRIPTIONS[id].trim()).not.toBe("");
      expect(MILESTONE_GEAR_EFFECTS[id].length).toBeGreaterThan(0);
      for (const effect of MILESTONE_GEAR_EFFECTS[id]) {
        expect(MILESTONE_GEAR_EFFECT_OWNERS[effect].trim()).not.toBe("");
      }
    }
  });

  it("requires every weapon ability and attack visual to have a presentation contract", () => {
    expect(new Set(Object.keys(WEAPON_SKILLS))).toEqual(new Set(WEAPON_ABILITY_IDS));
    expect(new Set(Object.keys(ATTACK_VISUAL_CONTRACTS))).toEqual(new Set(ATTACK_VISUAL_IDS));
    for (const id of WEAPON_ABILITY_IDS) {
      expect(WEAPON_SKILLS[id].id).toBe(id);
      expect(ATTACK_VISUAL_CONTRACTS[WEAPON_SKILLS[id].visual]).toBeTruthy();
    }
  });

  it("requires every Adventure and Mining enemy addition to make all subsystem decisions", () => {
    for (const id of ADVENTURE_ENEMY_KINDS) {
      expect(getEnemy(id), `Adventure enemy ${id} is not registered`).toBeTruthy();
      const drop = ADVENTURE_ENEMY_DROPS[id];
      if (drop) expect(MATERIAL_IDS).toContain(drop);
    }
    expect(new Set(MINING_ENEMY_BANDS.map(({ definitionId }) => definitionId))).toEqual(
      new Set(MINING_ENEMY_DEFINITION_IDS),
    );
    for (const band of MINING_ENEMY_BANDS) {
      expect(band.unit.id).toBe(band.definitionId);
      expect(getEnemy(band.definitionId)).toBe(band.unit);
    }
    expect(new Set(Object.keys(MINING_TILE_CONTRACTS))).toEqual(new Set(MINING_TILE_KINDS));
    expect(MINING_ROCK_CONTENTS).toEqual(["empty", "gold", "enemy", "key"]);
    expect(DUNGEON_THEME_BASE_ENEMIES).toEqual({ earth: null, water: "octopus", forge: "forgeling" });
    for (const contract of Object.values(ADVENTURE_TILE_CONTRACTS)) {
      expect(contract.movement).toBeTruthy();
      expect(contract.role).toBeTruthy();
      expect(contract.presentation).toBeTruthy();
    }
    for (const contract of Object.values(DUNGEON_ROOM_CONTRACTS)) {
      expect(contract.family).toBeTruthy();
      expect(contract.autoRouting).toBeTruthy();
    }
  });
});

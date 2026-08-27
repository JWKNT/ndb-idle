import Decimal from "break_eternity.js";
import { getEnemy, goblin } from "@/content/enemies";
import type { MaterialId } from "@/game/items";
import type { Stats } from "@/game/types";
import type { AdventureEnemyKind, AdventureState, DungeonRoom } from "./types";
import { DUNGEON_THEME_BASE_ENEMIES } from "./extension-contracts";

/** Every Adventure enemy makes an explicit loot decision, including none. */
export const ADVENTURE_ENEMY_DROPS: Record<AdventureEnemyKind, MaterialId | null> = {
  rat: "rat-pelt",
  ant: "ant-chitin",
  "clay-golem": "clay",
  goblin: null,
  "goblin-archer": null,
  spider: null,
  octopus: "ink-sac",
  merman: null,
  skeleton: null,
  "skeleton-giraffe": null,
  "skeleton-hippo": null,
  "skeleton-rhino": null,
  "skeleton-brachiosaurus": null,
  "squid-knight": null,
  "fire-ant": "fire-ant-chitin",
  alligator: null,
  dragonfly: null,
  bee: null,
  mummy: null,
  "fire-alligator": "fire-alligator-hide",
  mimic: null,
  forgeling: "rusty-metal",
  "chain-forgeling": "rusty-metal",
  "bellows-forgeling": "rusty-metal",
  "hammer-forgeling": "rusty-metal",
  "dire-rat": "mutated-rat-tail",
  "soldier-ant": "ant-chitin",
  "sewer-toad": "eye-of-frog",
};

export function adventureEnemyStats(
  ring: number,
  kind: AdventureEnemyKind = enemyKindForRing(ring),
): Stats {
  if (kind === "skeleton") {
    return {
      hp: new Decimal(42),
      stamina: new Decimal(12),
      attack: new Decimal(6),
      defense: new Decimal(3),
      spAttack: new Decimal(1),
      spDefense: new Decimal(3),
      speed: new Decimal(12),
      luck: new Decimal(0),
    };
  }
  const safeRing = kind === "octopus" || kind === "merman" ? 0 : Math.max(0, Math.floor(ring));
  const enemy = adventureEnemyDefinition(kind);
  const scale = kind === "mimic"
    ? 1 + safeRing * 0.35
    : 1 + safeRing * 0.2;
  return {
    hp: enemy.stats.hp.mul(scale).ceil(),
    stamina: enemy.stats.stamina,
    attack: enemy.stats.attack.mul(scale).ceil(),
    defense: enemy.stats.defense.mul(scale).ceil(),
    spAttack: enemy.stats.spAttack.mul(scale).ceil(),
    spDefense: enemy.stats.spDefense.mul(scale).ceil(),
    speed: enemy.stats.speed.mul(1.12).mul(1 + safeRing * (kind === "mimic" ? 0.12 : 0.08)),
    luck: enemy.stats.luck,
  };
}

export function enemyKindForRing(ring: number): AdventureEnemyKind {
  const safeRing = Math.max(0, Math.floor(ring));
  if (safeRing <= 1) return "rat";
  if (safeRing === 2) return "ant";
  if (safeRing === 3) return "clay-golem";
  return "fire-alligator";
}

/** Rare post-Beast-Tamer encounters that keep the early zones relevant. */
export function rollEnemyKindForRoom(
  ring: number,
  completedBattleNumbers: number[],
  random: () => number,
): AdventureEnemyKind {
  const ordinary = enemyKindForRing(ring);
  if (!completedBattleNumbers.includes(7) || (ring !== 1 && ring !== 2)) return ordinary;
  const roll = random();
  if (roll < 0.055) return ring === 1 ? "dire-rat" : "fire-ant";
  if (roll < 0.075) return "sewer-toad";
  return ordinary;
}

export function adventureEnemyName(kind: AdventureEnemyKind): string {
  return getEnemy(kind)?.name ?? goblin.name;
}

export function adventureEnemyDefinition(kind: AdventureEnemyKind) {
  return getEnemy(kind) ?? goblin;
}

export function enemyKindForAdventure(
  state: AdventureState,
  room: DungeonRoom = state.rooms[state.currentRoomKey],
): AdventureEnemyKind {
  const themedEnemy = DUNGEON_THEME_BASE_ENEMIES[state.dungeonTheme ?? "earth"];
  if (themedEnemy) return themedEnemy;
  return enemyKindForRing(room.ring);
}

export function materialForAdventureEnemy(kind: AdventureEnemyKind): MaterialId | null {
  return ADVENTURE_ENEMY_DROPS[kind];
}
